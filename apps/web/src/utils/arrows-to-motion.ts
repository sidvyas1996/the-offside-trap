import type {
  Movement,
  MovementTempo,
  PassNode,
  PassSequence,
  Player,
  TacticArrow,
} from "../../../../packages/shared/src";
import { pitchDistance } from "./pitch";
import { curveControl } from "../components/ArrowOverlay";

/**
 * Turns tactical notation into motion.
 *
 * An arrow already says who moves, where to and how — it is the notation coaches
 * draw anyway — so it is also the animation. Nothing here invents a second
 * vocabulary; each of the eight arrow types has one natural reading, and the
 * only thing added on top is a beat number for running order.
 *
 * Output feeds the existing engine unchanged:
 *   arrows -> { movements, passes, resetStart } -> compileMovements -> Keyframe[]
 */

interface Pt { x: number; y: number }

/** Which arrow types move the ball rather than a player. */
const BALL_TYPES = new Set(['pass', 'dribble', 'long-ball', 'target-zone']);

/**
 * Tempo implied by how an arrow is drawn. A dashed secondary run is the
 * conditional one so it jogs; a zigzag press is a sprint by definition.
 */
const IMPLIED_TEMPO: Record<string, MovementTempo> = {
  'direct-run': 'run',
  'secondary-run': 'jog',
  'curved-run': 'run',
  'press-run': 'sprint',
};

/** Assumed travel speed in pitch-length-percent per second, for weighting beats. */
const SPEED_PCT_PER_S = 45;

/**
 * Points used to trace a drawn curve.
 *
 * The path is walked as a polyline, so a curve has to be *sampled* — using the
 * bezier's control point as a single waypoint would animate two straight legs
 * with a corner at the control point, which is not the shape the arrow draws.
 * Eight segments keeps the polyline within a fraction of a percent of the true
 * quadratic at pitch scale.
 */
const CURVE_SAMPLES = 8;

/** Points along the quadratic the arrow is drawn with, excluding the endpoints. */
function bezierWaypoints(from: Pt, to: Pt): Pt[] {
  const { cx, cy } = curveControl(from.x, from.y, to.x, to.y);
  const out: Pt[] = [];
  for (let i = 1; i < CURVE_SAMPLES; i++) {
    const t = i / CURVE_SAMPLES;
    const inv = 1 - t;
    out.push({
      x: inv * inv * from.x + 2 * inv * t * cx + t * t * to.x,
      y: inv * inv * from.y + 2 * inv * t * cy + t * t * to.y,
    });
  }
  return out;
}

/**
 * Share of the loop reserved for the reset, floored and capped.
 *
 * Weighted by how far the furthest object has to come home so it does not look
 * rushed after a long run, but never allowed to dominate — the reset is
 * housekeeping, not the tactic.
 */
const MIN_RESET_SHARE = 0.1;
const MAX_RESET_SHARE = 0.3;

/** Who a point sits on, preferring the ref bound when the arrow was drawn. */
function resolvePlayer(
  ref: { team: 'home' | 'away'; playerId: number } | undefined,
  pt: Pt | undefined,
  players: Player[],
  oppositionPlayers: Player[],
): { ref: { team: 'home' | 'away'; playerId: number }; player: Player } | null {
  if (ref) {
    const roster = ref.team === 'home' ? players : oppositionPlayers;
    const player = roster.find(p => p.id === ref.playerId);
    // A ref pointing at a player who has since been removed simply drops out,
    // rather than throwing or animating the wrong person.
    return player ? { ref, player } : null;
  }
  if (!pt) return null;

  const RADIUS = 6;
  let best: { ref: { team: 'home' | 'away'; playerId: number }; player: Player } | null = null;
  let bestDist = RADIUS;
  for (const p of players) {
    const d = pitchDistance(p, pt);
    if (d < bestDist) { bestDist = d; best = { ref: { team: 'home', playerId: p.id }, player: p }; }
  }
  for (const p of oppositionPlayers) {
    const d = pitchDistance(p, pt);
    if (d < bestDist) { bestDist = d; best = { ref: { team: 'away', playerId: p.id }, player: p }; }
  }
  return best;
}

const beatOf = (a: TacticArrow) => Math.max(1, Math.floor(a.beat ?? 1));

export interface ArrowMotion {
  movements: Movement[];
  passes: PassSequence;
  /** Loop fraction at which everything eases home. */
  resetStart: number;
}

/**
 * The ball's idle position is deliberately not an input: when there are ball
 * arrows the chain starts where the first one does, and when there are none the
 * compiler already leaves the ball where it sits.
 */
export function arrowsToMotion(
  arrows: TacticArrow[],
  players: Player[],
  oppositionPlayers: Player[],
): ArrowMotion {
  const empty: ArrowMotion = { movements: [], passes: { nodes: [] }, resetStart: 1 };
  // target-zone marks a destination; it is drawn, but it never moves anything.
  const motionArrows = arrows.filter(a => a.type !== 'target-zone' && a.points.length >= 2);
  if (motionArrows.length === 0) return empty;

  // --- Lay the beats out ---------------------------------------------------
  const beats = [...new Set(motionArrows.map(beatOf))].sort((a, b) => a - b);

  /** Longest travel in a beat, as a duration — that is how long the beat needs. */
  const beatWeight = (beat: number): number => {
    const inBeat = motionArrows.filter(a => beatOf(a) === beat);
    const longest = Math.max(...inBeat.map(a => pitchDistance(a.points[0], a.points[1])));
    return (longest / SPEED_PCT_PER_S) * 1000;
  };

  /** Furthest anything has to travel home, which sets how long the reset needs. */
  const resetWeight = (() => {
    const longest = Math.max(...motionArrows.map(a => pitchDistance(a.points[0], a.points[1])));
    return (longest / SPEED_PCT_PER_S) * 1000;
  })();

  const weights = beats.map(beatWeight);
  const bodyTotal = weights.reduce((s, w) => s + w, 0);
  const rawResetShare = resetWeight / (bodyTotal + resetWeight);
  const resetShare = Math.min(MAX_RESET_SHARE, Math.max(MIN_RESET_SHARE, rawResetShare));
  const resetStart = 1 - resetShare;

  const windowOf = new Map<number, { start: number; end: number }>();
  let cursor = 0;
  beats.forEach((beat, i) => {
    const share = bodyTotal <= 0
      ? resetStart / beats.length
      : (weights[i] / bodyTotal) * resetStart;
    // Pin the last edge so float drift can't leave a gap before the reset.
    const end = i === beats.length - 1 ? resetStart : cursor + share;
    windowOf.set(beat, { start: cursor, end });
    cursor = end;
  });

  // --- Player arrows become one-way runs ----------------------------------
  const movements: Movement[] = [];
  for (const arrow of motionArrows) {
    if (BALL_TYPES.has(arrow.type)) continue;

    const owner = resolvePlayer(arrow.from, arrow.points[0], players, oppositionPlayers);
    if (!owner) continue;   // nobody at the tail: the arrow is annotation, not motion

    const to = arrow.points[1];
    // Re-anchor to where the player actually is now, so repositioning them takes
    // their run along instead of leaving it stranded at the drawn start.
    const start: Pt = { x: owner.player.x, y: owner.player.y };
    const path: Pt[] = [start];
    if (arrow.type === 'curved-run') {
      // Trace the curve the arrow actually draws, rather than corner through its
      // control point.
      path.push(...bezierWaypoints(start, to));
    }
    path.push(to);

    movements.push({
      id: `arrow-${arrow.id}`,
      target: { kind: 'player', team: owner.ref.team, playerId: owner.ref.playerId },
      path,
      cycle: 'one-way',
      repeats: 1,
      tempo: arrow.tempo ?? IMPLIED_TEMPO[arrow.type] ?? 'run',
      delay: 0,
      window: windowOf.get(beatOf(arrow))!,
    });
  }

  // --- Ball arrows become a pass chain ------------------------------------
  const ballArrows = motionArrows
    .filter(a => BALL_TYPES.has(a.type))
    .sort((a, b) => beatOf(a) - beatOf(b));

  const nodes: PassNode[] = [];
  if (ballArrows.length > 0) {
    // The chain starts where the first ball arrow does, so the ball is on the
    // pitch where the notation says it is rather than at its idle position.
    const first = ballArrows[0];
    const startPt = first.points[0];
    const holder = resolvePlayer(undefined, startPt, players, oppositionPlayers);
    nodes.push({
      at: { x: startPt.x, y: startPt.y },
      ...(holder && { receiver: holder.ref }),
    });

    for (const arrow of ballArrows) {
      const to = arrow.points[1];
      const win = windowOf.get(beatOf(arrow))!;
      const travelMs = (win.end - win.start) * 1000;   // relative weight; rescaled later

      if (arrow.type === 'dribble') {
        const carrier = resolvePlayer(arrow.from, arrow.points[0], players, oppositionPlayers);
        nodes.push({
          at: { x: to.x, y: to.y },
          via: 'dribble',
          ...(carrier && { carrier: carrier.ref }),
          travelMs,
        });
        continue;
      }

      // A pass that lands on nobody is a ball played into space.
      const receiver = arrow.endsAtPlayer
        ? resolvePlayer(arrow.to, to, players, oppositionPlayers)
        : null;
      const lofted = arrow.type === 'long-ball';
      const bend = lofted ? bezierWaypoints(arrow.points[0], to) : undefined;

      nodes.push({
        at: { x: to.x, y: to.y },
        via: 'pass',
        ...(bend && { bend }),
        // A long ball leaves the ground, which the renderer shows as height.
        ...(lofted && { lofted: true }),
        ...(receiver && { receiver: receiver.ref }),
        travelMs,
      });
    }
  }

  return {
    movements,
    // `closed` keeps the ball recycling to where it started, which is what makes
    // its reset coincide with the players'.
    passes: nodes.length > 1 ? { nodes, closed: true } : { nodes: [] },
    resetStart,
  };
}
