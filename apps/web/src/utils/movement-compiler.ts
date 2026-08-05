import type {
  AnimationData,
  Ball,
  FieldSettings,
  Keyframe,
  Movement,
  MovementTempo,
  Player,
} from "../../../../packages/shared/src";
import { pitchDistance } from "./pitch";

/**
 * Compiles authored movements down into the Keyframe[] that playback and the
 * server-side MP4 exporter already understand.
 *
 * Keyframes are an *output* format here, not something a user ever sees. Both
 * interpolators (useAnimation and video.export.service) lerp linearly between
 * keyframes, so this module's job is to place samples such that linear
 * interpolation between them reproduces the intended eased motion. Easing lives
 * in *where the samples sit*, never in the interpolator — which is exactly why
 * the exporter renders eased motion without knowing movements exist.
 *
 * See utils/movement-gestures.ts for how a drag becomes a Movement.
 */

/**
 * Samples emitted per loop. Linear interpolation between samples has to
 * approximate an eased curve, so this trades payload size against how closely
 * the curve is followed. 24 keeps a 5s loop under a handful of milliseconds of
 * timing error while staying comparable in size to a hand-authored animation.
 */
const SAMPLES_PER_LOOP = 24;

/**
 * Fraction of its cycle a movement spends actually travelling, by tempo. The
 * remainder is spent at rest, so a sprint is a quick burst followed by a pause
 * while a jog is almost continuous motion. This is what makes tempo read as
 * football rather than as a playback-rate multiplier.
 */
const TRAVEL_FRACTION: Record<MovementTempo, number> = {
  jog: 1,
  run: 0.75,
  sprint: 0.5,
};

/** Smoothstep. Zero velocity at both ends, so reversals don't visibly snap. */
function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

interface Pt { x: number; y: number }

/**
 * Cumulative arc lengths along a polyline, so we can walk it at constant speed.
 * Uses pitchDistance because percentage space is anisotropic — a raw hypot would
 * make a player cover diagonal legs faster than horizontal ones.
 */
function arcLengths(path: Pt[]): number[] {
  const acc = [0];
  for (let i = 1; i < path.length; i++) {
    acc.push(acc[i - 1] + pitchDistance(path[i], path[i - 1]));
  }
  return acc;
}

/** Point at normalised distance `s` (0-1) along the polyline. */
function pointAt(path: Pt[], acc: number[], s: number): Pt {
  const total = acc[acc.length - 1];
  if (total === 0) return path[0];
  const target = Math.max(0, Math.min(1, s)) * total;

  let i = 1;
  while (i < acc.length - 1 && acc[i] < target) i++;
  const segStart = acc[i - 1];
  const segLen = acc[i] - segStart;
  const f = segLen === 0 ? 0 : (target - segStart) / segLen;

  return {
    x: path[i - 1].x + (path[i].x - path[i - 1].x) * f,
    y: path[i - 1].y + (path[i].y - path[i - 1].y) * f,
  };
}

/**
 * Where a movement's object sits at loop fraction `u` (0-1).
 *
 * Guarantees position(0) === position(1) for every combination of cycle,
 * repeats, tempo and delay — that identity is what makes the loop seamless.
 */
export function movementPositionAt(movement: Movement, u: number): Pt {
  const { path, cycle, repeats, tempo, delay } = movement;
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];

  const acc = arcLengths(path);

  // Phase offset, then split the loop into `repeats` identical cycles.
  const shifted = (((u + delay) % 1) + 1) % 1;
  const withinCycle = (shifted * Math.max(1, repeats)) % 1;

  // Rest at the start position for whatever fraction of the cycle tempo leaves.
  const travel = TRAVEL_FRACTION[tempo] ?? 1;
  if (withinCycle >= travel) return path[0];
  const p = travel === 0 ? 0 : withinCycle / travel;

  if (cycle === 'loop') {
    // Closed circuit: walk the path once per cycle. The recognizer closes the
    // path, so arriving at s=1 is arriving back at the start.
    return pointAt(path, acc, easeInOut(p));
  }

  // Out and back: first half travels to the far end, second half retraces.
  // Easing each leg separately means the turn has zero velocity through it.
  return p < 0.5
    ? pointAt(path, acc, easeInOut(p * 2))
    : pointAt(path, acc, easeInOut((1 - p) * 2));
}

/** Football-language label, derived from the shape. Never stored. */
export function describeMovement(movement: Movement, playerLabel?: string): string {
  const who = movement.target.kind === 'ball' ? 'Ball' : playerLabel ?? 'Player';
  const verb =
    movement.cycle === 'loop'
      ? 'circuit'
      : movement.repeats > 1
        ? `shuttles ×${movement.repeats}`
        : movement.target.kind === 'ball'
          ? 'passes'
          : 'runs';
  return `${who} — ${verb}`;
}

/**
 * Put every object that has a movement back at its resting position (path[0]).
 *
 * Used when playback stops: a movement's start is where the loop begins, so
 * that is where the board should sit at rest. Without this, pausing leaves
 * players frozen mid-run while the overlay still draws their path from the
 * start, which reads as a bug.
 */
export function restingPose(movements: Movement[], roster: Player[], team: 'home' | 'away'): Player[] {
  const byId = new Map<number, Movement>();
  for (const m of movements) {
    if (m.target.kind === 'player' && m.target.team === team) byId.set(m.target.playerId, m);
  }
  if (byId.size === 0) return roster;
  return roster.map(p => {
    const m = byId.get(p.id);
    return m && m.path.length > 0 ? { ...p, x: m.path[0].x, y: m.path[0].y } : p;
  });
}

/** Resting ball position, or the current one when the ball has no movement. */
export function restingBall(movements: Movement[], ball: Ball): Ball {
  const m = movements.find(mv => mv.target.kind === 'ball');
  return m && m.path.length > 0 ? { x: m.path[0].x, y: m.path[0].y } : ball;
}

interface CompileInput {
  movements: Movement[];
  players: Player[];
  oppositionPlayers?: Player[];
  ball: Ball;
  fieldSettings: FieldSettings;
  durationMs: number;
  fps: number;
}

/**
 * Expand movements into a full AnimationData.
 *
 * Objects without a movement hold their resting position in every keyframe, so
 * every keyframe carries the complete team — the backend's keyframe schema
 * requires exactly eleven players, and this satisfies that by construction.
 *
 * Returns null when there is nothing to animate, so callers can omit
 * `animation` entirely rather than saving an empty object.
 */
export function compileMovements({
  movements,
  players,
  oppositionPlayers,
  ball,
  fieldSettings,
  durationMs,
  fps,
}: CompileInput): AnimationData | null {
  if (movements.length === 0) return null;

  const homeMoves = new Map<number, Movement>();
  const awayMoves = new Map<number, Movement>();
  let ballMove: Movement | undefined;
  for (const m of movements) {
    if (m.target.kind === 'ball') ballMove = m;
    else if (m.target.team === 'home') homeMoves.set(m.target.playerId, m);
    else awayMoves.set(m.target.playerId, m);
  }

  const poseAt = (team: Map<number, Movement>, roster: Player[], u: number): Player[] =>
    roster.map(p => {
      const m = team.get(p.id);
      if (!m) return p;
      const { x, y } = movementPositionAt(m, u);
      return { ...p, x, y };
    });

  const keyframes: Keyframe[] = [];
  // Inclusive of both ends: the final sample repeats the first pose at exactly
  // durationMs, so playback wrapping to 0 is a no-op and an exported MP4 loops
  // without a visible jump at the seam.
  for (let i = 0; i <= SAMPLES_PER_LOOP; i++) {
    const u = i / SAMPLES_PER_LOOP;
    const ballPos = ballMove ? movementPositionAt(ballMove, u) : ball;

    keyframes.push({
      id: crypto.randomUUID(),
      timeMs: Math.round(u * durationMs),
      players: poseAt(homeMoves, players, u),
      fieldSettings: { ...fieldSettings, ball: { x: ballPos.x, y: ballPos.y } },
      ...(oppositionPlayers && oppositionPlayers.length > 0 && {
        oppositionPlayers: poseAt(awayMoves, oppositionPlayers, u),
      }),
    });
  }

  return { durationMs, fps, keyframes, movements, loop: true };
}
