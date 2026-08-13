import type {
  AnimationData,
  Ball,
  FieldSettings,
  Keyframe,
  Movement,
  MovementCue,
  MovementTempo,
  PassNode,
  PassSequence,
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
  const { path, cycle, repeats, tempo, delay, window } = movement;
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];

  const acc = arcLengths(path);

  // A window means a beat owns this movement's timing, so delay/tempo/repeats
  // step aside — the beat already says when it happens and for how long.
  if (window) {
    const { start, end } = window;
    const t = ((u % 1) + 1) % 1;
    // Wrapping windows are rejected rather than silently breaking the seam.
    if (end <= start) return path[0];
    if (t < start) return path[0];
    if (t >= end) {
      // A one-way run holds where it finished; anything else has come home.
      return cycle === 'one-way' ? path[path.length - 1] : path[0];
    }

    const local = (t - start) / (end - start);
    if (cycle === 'one-way') return pointAt(path, acc, easeInOut(local));
    if (cycle === 'loop') return pointAt(path, acc, easeInOut(local));
    return local < 0.5
      ? pointAt(path, acc, easeInOut(local * 2))
      : pointAt(path, acc, easeInOut((1 - local) * 2));
  }

  // Without a window a one-way run has nothing to say about when it happens, so
  // it simply holds its start — the mapper always supplies a window.
  if (cycle === 'one-way') return path[0];

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

/**
 * Where a movement sits at `u`, accounting for the sequence's shared reset.
 *
 * One-way runs hold where they finished, so at the end of the loop nobody is
 * home and the seam would jump. The reset is a single span at the tail of the
 * loop across which *every* one-way object eases back to its start — shared, so
 * it reads as one movement rather than each run recovering on its own schedule.
 *
 * Guarantees position(0) === position(1): at u = 1 the reset lands exactly on
 * path[0], which is also where the movement sits before its window opens.
 */
export function movementPositionWithReset(
  movement: Movement,
  u: number,
  resetStart?: number,
): Pt {
  const { path, cycle, window } = movement;
  // Only a windowed one-way run has an end position to come back from; without a
  // window it never travelled, so resetting it would drag it somewhere it never
  // went. Windows are also required to end before the reset — the mapper
  // guarantees that, and it is asserted in the tests.
  if (path.length < 2 || cycle !== 'one-way' || !window || resetStart === undefined) {
    return movementPositionAt(movement, u);
  }

  const t = ((u % 1) + 1) % 1;
  // u = 1 arrives here as 0, which is correctly before any window.
  if (u < 1 && t < resetStart) return movementPositionAt(movement, u);
  if (u >= 1) return path[0];

  const span = 1 - resetStart;
  const local = span <= 0 ? 1 : (t - resetStart) / span;
  // Walk the path backwards: 1 → 0 returns the object the way it came.
  return pointAt(path, arcLengths(path), 1 - easeInOut(Math.min(1, local)));
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

/**
 * Where the ball sits at rest — the start of the passing move, which is also
 * where a closed chain returns to. Falls back to a legacy ball Movement, then to
 * the current position.
 */
export function restingBall(movements: Movement[], ball: Ball, passes?: PassSequence): Ball {
  if (passes && passes.nodes.length > 0) {
    const { x, y } = passes.nodes[0].at;
    return { x, y };
  }
  const m = movements.find(mv => mv.target.kind === 'ball');
  return m && m.path.length > 0 ? { x: m.path[0].x, y: m.path[0].y } : ball;
}

// ---------------------------------------------------------------------------
// Pass sequences
//
// A passing move is an ordered chain, not a cyclic motion, so it gets its own
// evaluation rather than being squeezed through movementPositionAt.
// ---------------------------------------------------------------------------

/** One span of the loop: either the ball waiting somewhere, or travelling a leg. */
export interface PassPhase {
  kind: 'hold' | 'travel';
  /** Destination node for a travel; the node being held at for a hold. */
  nodeIndex: number;
  /** Travel only: [origin, ...bend, destination], ready for arc-length walking. */
  points?: Pt[];
  /** True for the implicit closing leg back to nodes[0]. */
  isReturn?: boolean;
  start: number;
  end: number;
}

/** Arc length of the leg arriving at `to`. */
function legLength(from: Pt, to: PassNode): number {
  const pts = [from, ...(to.bend ?? []), to.at];
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += pitchDistance(pts[i], pts[i - 1]);
  return total;
}

/**
 * Assumed ball speed, in pitch-length-percent per second, used to invent a
 * duration for a leg that carries no recorded timing — a preset, or a chain
 * built in code. Expressing the fallback as a duration keeps every weight in
 * milliseconds, so a timed leg and an untimed one stay comparable.
 */
const FALLBACK_BALL_SPEED_PCT_PER_S = 45;

/** Duration to use for a leg, preferring what was actually drawn. */
function legDurationMs(from: Pt, to: PassNode): number {
  if (to.travelMs !== undefined && to.travelMs > 0) return to.travelMs;
  return (legLength(from, to) / FALLBACK_BALL_SPEED_PCT_PER_S) * 1000;
}

/**
 * Lay a pass chain out across the loop.
 *
 * Every weight is a duration in milliseconds — as drawn where we have it, and
 * derived from distance at an assumed ball speed where we don't. They are then
 * normalised to fill the loop, so changing the loop length slows the whole move
 * rather than appending dead time at the end, and a long ball still takes longer
 * than a short square pass.
 */
export function resolvePassPhases(sequence: PassSequence, resetStart?: number): PassPhase[] {
  const { nodes } = sequence;
  if (nodes.length < 2) return [];

  // The chain closes by default: the compiled animation has to open and close on
  // the same pose or the loop (and the exported MP4) jumps at the seam.
  const closed = sequence.closed !== false;

  const raw: { phase: Omit<PassPhase, 'start' | 'end'>; weight: number }[] = [];

  if (nodes[0].holdMs) {
    raw.push({ phase: { kind: 'hold', nodeIndex: 0 }, weight: nodes[0].holdMs });
  }
  for (let i = 1; i < nodes.length; i++) {
    const points = [nodes[i - 1].at, ...(nodes[i].bend ?? []), nodes[i].at];
    raw.push({
      phase: { kind: 'travel', nodeIndex: i, points },
      weight: legDurationMs(nodes[i - 1].at, nodes[i]),
    });
    if (nodes[i].holdMs) {
      raw.push({ phase: { kind: 'hold', nodeIndex: i }, weight: nodes[i].holdMs! });
    }
  }
  if (closed) {
    const last = nodes[nodes.length - 1];
    const points = [last.at, nodes[0].at];
    // The reset always uses the fallback speed: it was never drawn, so there is
    // no recorded duration to prefer.
    raw.push({
      phase: { kind: 'travel', nodeIndex: 0, points, isReturn: true },
      weight: (pitchDistance(last.at, nodes[0].at) / FALLBACK_BALL_SPEED_PCT_PER_S) * 1000,
    });
  }

  // With a shared reset, the chain proper has to fit before it and the return leg
  // has to occupy exactly the reset span — that is what makes the ball come home
  // at the same moment the players do, rather than on its own schedule.
  const closesAtReset = resetStart !== undefined && closed && resetStart > 0 && resetStart < 1;
  const body = closesAtReset ? raw.slice(0, -1) : raw;
  const bodyEnd = closesAtReset ? resetStart! : 1;

  const total = body.reduce((s, r) => s + Math.max(r.weight, 0), 0);
  if (total <= 0) return [];

  const phases: PassPhase[] = [];
  let cursor = 0;
  body.forEach((r, i) => {
    const share = (Math.max(r.weight, 0) / total) * bodyEnd;
    // Pin the final edge exactly so float drift can't leave a sliver of the loop
    // uncovered, which would read as a one-frame flicker at the seam.
    const end = i === body.length - 1 ? bodyEnd : cursor + share;
    phases.push({ ...r.phase, start: cursor, end });
    cursor = end;
  });

  if (closesAtReset) {
    phases.push({ ...raw[raw.length - 1].phase, start: resetStart!, end: 1 });
  }
  return phases;
}

/** Where the ball sits at loop fraction `u`. */
export function ballPositionAt(sequence: PassSequence, phases: PassPhase[], u: number): Pt {
  const { nodes } = sequence;
  if (nodes.length === 0) return { x: 0, y: 0 };
  if (phases.length === 0) return nodes[0].at;

  const t = ((u % 1) + 1) % 1;
  const phase = phases.find(p => t >= p.start && t < p.end) ?? phases[phases.length - 1];

  if (phase.kind === 'hold' || !phase.points) return nodes[phase.nodeIndex].at;

  const span = phase.end - phase.start;
  const local = span <= 0 ? 1 : (t - phase.start) / span;
  const acc = arcLengths(phase.points);
  return pointAt(phase.points, acc, easeInOut(Math.max(0, Math.min(1, local))));
}

/** Loop fraction at which the ball arrives at a node. */
export function arrivalFraction(phases: PassPhase[], nodeIndex: number): number {
  if (nodeIndex === 0) return 0;
  const leg = phases.find(p => p.kind === 'travel' && p.nodeIndex === nodeIndex && !p.isReturn);
  return leg ? leg.end : 0;
}

/**
 * Loop fraction at which the ball is played onward from a node.
 *
 * Differs from arrival only when the node has a hold — which is exactly the
 * "he holds it, and as he plays it the winger goes" case.
 */
export function departureFraction(phases: PassPhase[], nodeIndex: number): number {
  const hold = phases.find(p => p.kind === 'hold' && p.nodeIndex === nodeIndex);
  return hold ? hold.end : arrivalFraction(phases, nodeIndex);
}

/**
 * The delay that makes a movement reach the far end of its path at `arrivalU`.
 *
 * Inverts movementPositionAt: within a cycle the far end is reached halfway
 * through the travelling portion, and there are `repeats` cycles per loop.
 */
export function delayForArrival(movement: Movement, arrivalU: number): number {
  const travel = TRAVEL_FRACTION[movement.tempo] ?? 1;
  const reachFarAt = travel / 2 / Math.max(1, movement.repeats);
  return (((reachFarAt - arrivalU) % 1) + 1) % 1;
}

/**
 * The delay that makes a movement *set off* at `atU`.
 *
 * Also an inversion of movementPositionAt, but a simpler one: travel begins at
 * `withinCycle === 0`, and `shifted = (u + delay) % 1`, so a delay of -u starts
 * the cycle exactly at u. Independent of tempo and repeats — though with
 * repeats > 1 this anchors one cycle and the rest follow on their own interval.
 */
export function delayForDeparture(atU: number): number {
  return (((-atU) % 1) + 1) % 1;
}

/** Read a movement's cue, tolerating the field it replaced. */
export function cueOf(movement: Movement): MovementCue | undefined {
  if (movement.cue) return movement.cue;
  if (movement.syncToPassNode !== undefined) {
    return { node: movement.syncToPassNode, on: 'meet' };
  }
  return undefined;
}

/**
 * Apply cues, replacing the authored delay with a derived one.
 *
 * Done here rather than at capture time because a cue has to survive changes to
 * the loop length and to earlier legs of the chain. Movements without a cue are
 * returned untouched, which is what keeps simultaneous movement the default.
 */
export function resolveCuedDelays(movements: Movement[], phases: PassPhase[]): Movement[] {
  if (phases.length === 0) return movements;
  return movements.map(m => {
    const cue = cueOf(m);
    if (!cue) return m;
    switch (cue.on) {
      case 'meet':
        return { ...m, delay: delayForArrival(m, arrivalFraction(phases, cue.node)) };
      case 'reaches':
        return { ...m, delay: delayForDeparture(arrivalFraction(phases, cue.node)) };
      case 'leaves':
        return { ...m, delay: delayForDeparture(departureFraction(phases, cue.node)) };
    }
  });
}

interface CompileInput {
  movements: Movement[];
  /** Owns the ball when present. */
  passes?: PassSequence;
  /**
   * Loop fraction at which everything eases back to its start. Supplied by the
   * arrow mapper; omitted for cyclic movements, which come home on their own.
   */
  resetStart?: number;
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
  passes,
  resetStart,
  players,
  oppositionPlayers,
  ball,
  fieldSettings,
  durationMs,
  fps,
}: CompileInput): AnimationData | null {
  const hasPasses = !!passes && passes.nodes.length > 0;
  if (movements.length === 0 && !hasPasses) return null;

  const phases = hasPasses ? resolvePassPhases(passes!, resetStart) : [];
  // Rendezvous links replace the authored delay, so resolve before posing.
  const resolved = resolveCuedDelays(movements, phases);

  const homeMoves = new Map<number, Movement>();
  const awayMoves = new Map<number, Movement>();
  /** Legacy only: a ball inside `movements`, from before passes had their own type. */
  let legacyBallMove: Movement | undefined;
  for (const m of resolved) {
    if (m.target.kind === 'ball') legacyBallMove = m;
    else if (m.target.team === 'home') homeMoves.set(m.target.playerId, m);
    else awayMoves.set(m.target.playerId, m);
  }

  const poseAt = (team: Map<number, Movement>, roster: Player[], u: number): Player[] =>
    roster.map(p => {
      const m = team.get(p.id);
      if (!m) return p;
      const { x, y } = movementPositionWithReset(m, u, resetStart);
      return { ...p, x, y };
    });

  /** The dribble leg covering `u`, if any — its carrier is driven by the ball. */
  const dribbleAt = (u: number) => {
    if (!hasPasses) return undefined;
    const t = ((u % 1) + 1) % 1;
    const phase = phases.find(p => p.kind === 'travel' && t >= p.start && t < p.end);
    if (!phase || phase.isReturn) return undefined;
    const node = passes!.nodes[phase.nodeIndex];
    return node.via === 'dribble' && node.carrier ? node.carrier : undefined;
  };

  const keyframes: Keyframe[] = [];
  // Inclusive of both ends: the final sample repeats the first pose at exactly
  // durationMs, so playback wrapping to 0 is a no-op and an exported MP4 loops
  // without a visible jump at the seam.
  for (let i = 0; i <= SAMPLES_PER_LOOP; i++) {
    const u = i / SAMPLES_PER_LOOP;

    const ballPos = hasPasses
      ? ballPositionAt(passes!, phases, u)
      : legacyBallMove ? movementPositionAt(legacyBallMove, u) : ball;

    let home = poseAt(homeMoves, players, u);
    let away = oppositionPlayers ? poseAt(awayMoves, oppositionPlayers, u) : [];

    // A dribbling player is carried by the ball, not the other way round. Making
    // the ball authoritative is what removes any need to keep two movements in
    // lockstep — and it means dragging a ball-carrying player produces exactly
    // one thing. If that player also drew a run, this wins for the leg's span.
    const carrier = dribbleAt(u);
    if (carrier) {
      const attach = (roster: Player[]) =>
        roster.map(p => p.id === carrier.playerId ? { ...p, x: ballPos.x, y: ballPos.y } : p);
      if (carrier.team === 'home') home = attach(home);
      else away = attach(away);
    }

    keyframes.push({
      id: crypto.randomUUID(),
      timeMs: Math.round(u * durationMs),
      players: home,
      fieldSettings: { ...fieldSettings, ball: { x: ballPos.x, y: ballPos.y } },
      ...(oppositionPlayers && oppositionPlayers.length > 0 && { oppositionPlayers: away }),
    });
  }

  return {
    durationMs,
    fps,
    keyframes,
    movements,
    ...(hasPasses && { passes }),
    ...(resetStart !== undefined && { resetStart }),
    loop: true,
  };
}
