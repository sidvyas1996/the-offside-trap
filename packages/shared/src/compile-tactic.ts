import type { FieldSettings, Keyframe, Player } from "./index";
import {
  BALL,
  DEFAULT_BALL_SPEED,
  DEFAULT_PLAYER_SPEED,
  MAX_SPRINT_MPS,
  isBallSpeed,
  isPlayerSpeed,
  parseActor,
  playerActor,
  speedPctPerSecond,
  type Action,
  type ActorId,
  type Point,
  type TacticState,
} from "./tactic-v2";
import { mpsToPctPerSecond, pitchDistance } from "./pitch-geometry";

/**
 * Compiles a V2 TacticState into absolute-time motion, then into Keyframe[].
 *
 * Two layers on purpose:
 *
 *   resolveTimeline()  — all the timing and geometry, in absolute milliseconds.
 *                        Needs no roster, no field settings, no fps. This is
 *                        where every interesting decision lives, and it is what
 *                        the golden test locks down.
 *   compileTactic()    — samples that timeline into Keyframe[], the one format
 *                        playback and the server-side MP4 exporter already read.
 *
 * Keeping them apart means the exporter contract can never drag assumptions into
 * the timing model, and a timing bug can be diagnosed without materialising 400
 * eleven-player snapshots.
 */

// ---------------------------------------------------------------------------
// Timeline types
// ---------------------------------------------------------------------------

export type SegmentMotion =
  /** A -> B, holding B afterwards. */
  | 'one-way'
  /** A -> B -> A, `traversals` times. Ends where it started. */
  | 'out-and-back'
  /** Round a closed path `traversals` times. Ends where it started. */
  | 'circuit';

export interface Segment {
  actorId: ActorId;
  /** 'reset' segments are compile-time housekeeping with no authored action. */
  kind: 'travel' | 'reset';
  actionId?: string;
  startMs: number;
  endMs: number;
  /** origin -> ...via -> destination. Absolute pitch percentages. */
  points: Point[];
  motion: SegmentMotion;
  /** Out-and-back cycles, or circuit laps. Always 1 for 'one-way'. */
  traversals: number;
  /**
   * The ball was played, rather than carried.
   *
   * A struck ball leaves the boot at its quickest and decelerates, so it eases
   * *out*; a carried one moves like the player who has it and eases both ends.
   * Set from the authored action, not inferred from the actor, because the carry
   * segment is also the ball.
   */
  struck?: boolean;
  /** The ball leaves the ground on this leg — a lofted pass or cross. */
  lofted?: boolean;
}

export type CompileWarningCode =
  | 'unknown-actor'
  | 'no-start-position'
  | 'zero-length-action'
  | 'constraint-no-ball'
  | 'constraint-unreachable'
  | 'continuous-truncated'
  | 'speed-kind-mismatch'
  | 'empty-phase';

export interface CompileWarning {
  code: CompileWarningCode;
  detail: string;
  phaseId?: string;
  actionId?: string;
  actorId?: ActorId;
}

export interface Timeline {
  totalMs: number;
  phaseStartsMs: number[];
  phaseEndsMs: number[];
  /**
   * Instants that must be sampled exactly rather than interpolated across:
   * phase boundaries, rendezvous arrivals, the reset, and the seam.
   *
   * This is the fix for keyframe smearing. Once arrival instants carry meaning —
   * a cross must land the same millisecond the striker gets there — a fixed
   * sample grid will straddle them and linear interpolation will visibly miss.
   */
  criticalMs: number[];
  resetStartMs: number;
  segments: Segment[];
  warnings: CompileWarning[];
}

export interface ResolveOptions {
  /**
   * Divides every duration. Real football speeds make a full move run 15-25s,
   * which is honest but slower than the 5s loop V1 forced everything into. This
   * compresses playback while leaving every *ratio* intact.
   */
  timeScale?: number;
  /**
   * Ceiling on the reset, so housekeeping can never dominate the loop.
   *
   * V1 spent 10-30% of every loop bringing people home. Deriving the reset from a
   * football speed instead is worse, not better: the ball ends up 90m from where
   * it started and jogs back over 30 seconds, which is 78% of the animation. The
   * reset is a rewind, not a passage of play, so it gets a rewind's timing.
   */
  maxResetMs?: number;
  /** Dead time on the final pose, before the reset, so the shape can be read. */
  settleMs?: number;
}

/** How close an actor must be to the ball to be holding it. */
const CARRY_RADIUS = 4;

/** Positions closer than this are the same position. */
const EPSILON_PCT = 0.01;

/** A reset is never a jump, however short the distance home. */
const MIN_RESET_MS = 300;

/** Nor is it ever slow. Both ends are clamps on a rewind, not on a run. */
const DEFAULT_MAX_RESET_MS = 1200;

/**
 * Nominal rewind rate, in percent of pitch length per second, used only to scale
 * the reset between its two clamps so a long recovery reads as longer than a short
 * one. Far above any real running speed on purpose — nobody is meant to read the
 * reset as a player making a run.
 */
const RESET_PCT_PER_S = 90;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Smoothstep. Zero velocity at both ends, so reversals don't snap. */
const easeInOut = (t: number): number => t * t * (3 - 2 * t);

/**
 * Ease out — away quickly, then slowing.
 *
 * Right for a played ball rather than easeInOut: it leaves the boot at its
 * quickest. Easing it in as well makes a pass look pushed rather than struck.
 */
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

/**
 * Height across a lofted leg: on the deck at both ends, highest in the middle.
 * A sine arc rather than a parabola so it leaves and lands smoothly.
 */
const loftArc = (t: number): number => Math.sin(Math.PI * Math.max(0, Math.min(1, t)));

function arcLengths(points: Point[]): number[] {
  const acc = [0];
  for (let i = 1; i < points.length; i++) {
    acc.push(acc[i - 1] + pitchDistance(points[i], points[i - 1]));
  }
  return acc;
}

const pathLength = (points: Point[]): number => {
  const acc = arcLengths(points);
  return acc[acc.length - 1];
};

/** Point at normalised distance `s` (0-1) along a polyline. */
function pointAt(points: Point[], acc: number[], s: number): Point {
  const total = acc[acc.length - 1];
  if (total === 0) return points[0];
  const target = Math.max(0, Math.min(1, s)) * total;

  let i = 1;
  while (i < acc.length - 1 && acc[i] < target) i++;
  const segStart = acc[i - 1];
  const segLen = acc[i] - segStart;
  const f = segLen === 0 ? 0 : (target - segStart) / segLen;

  return {
    x: points[i - 1].x + (points[i].x - points[i - 1].x) * f,
    y: points[i - 1].y + (points[i].y - points[i - 1].y) * f,
  };
}

/** Where a segment's actor sits at absolute time `t`, clamped to the segment. */
function positionInSegment(segment: Segment, t: number): Point {
  const { points, motion, traversals, startMs, endMs, struck } = segment;
  const acc = arcLengths(points);
  const span = endMs - startMs;
  const local = span <= 0 ? 1 : Math.max(0, Math.min(1, (t - startMs) / span));

  if (motion === 'one-way') {
    return pointAt(points, acc, struck ? easeOut(local) : easeInOut(local));
  }

  // Split the span into equal cycles and ease within each, so a shuttle has zero
  // velocity through every turn rather than snapping at the far end.
  const cycles = Math.max(1, traversals);
  const cycle = Math.min(0.999999, local * cycles) % 1;

  if (motion === 'circuit') return pointAt(points, acc, easeInOut(cycle));

  return cycle < 0.5
    ? pointAt(points, acc, easeInOut(cycle * 2))
    : pointAt(points, acc, easeInOut((1 - cycle) * 2));
}

/**
 * How high the ball is at `t`, 0 on the deck and 1 at the top of its arc.
 *
 * The pitch is drawn in plan view, so there is no "up" to move into — the
 * renderer turns this into the ball growing and its shadow separating beneath it.
 * Only lofted legs leave the ground; everything else returns 0 and draws exactly
 * as it always has.
 */
export function ballLiftAt(segments: Segment[], t: number): number {
  for (const s of segments) {
    if (s.actorId !== BALL || !s.lofted) continue;
    if (t < s.startMs || t > s.endMs) continue;
    const span = s.endMs - s.startMs;
    return loftArc(span <= 0 ? 1 : (t - s.startMs) / span);
  }
  return 0;
}

/** Where a segment leaves its actor once it is over. */
const segmentEndPoint = (segment: Segment): Point =>
  segment.motion === 'one-way'
    ? segment.points[segment.points.length - 1]
    : segment.points[0];

/**
 * Where an actor is at absolute time `t`.
 *
 * The single source of truth for actor position, used both while resolving (to
 * derive origins and actor-bound destinations) and while sampling. Deriving
 * origins through the same function that renders them is what makes a mid-flight
 * `continuous` action a non-special-case: asking where the full-back is halfway
 * through his overlap just works.
 */
export function positionAt(
  segments: Segment[],
  actorId: ActorId,
  t: number,
  fallback: Point,
): Point {
  let covering: Segment | undefined;
  let latestDone: Segment | undefined;

  for (const s of segments) {
    if (s.actorId !== actorId) continue;
    if (t >= s.startMs && t < s.endMs) {
      // Later-starting wins, which is what makes truncation-on-conflict safe.
      if (!covering || s.startMs >= covering.startMs) covering = s;
    } else if (t >= s.endMs) {
      if (!latestDone || s.endMs >= latestDone.endMs) latestDone = s;
    }
  }

  if (covering) return positionInSegment(covering, t);
  if (latestDone) return segmentEndPoint(latestDone);
  return fallback;
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

interface Planned {
  action: Action;
  actorId: ActorId;
  points: Point[];
  motion: SegmentMotion;
  traversals: number;
  startMs: number;
  durationMs: number;
  distance: number;
}

/** Total ground covered, which is what a duration has to be derived from. */
function travelDistance(points: Point[], motion: SegmentMotion, traversals: number): number {
  const len = pathLength(points);
  if (motion === 'one-way') return len;
  if (motion === 'circuit') return len * traversals;
  return len * 2 * traversals;
}

export function resolveTimeline(
  state: TacticState,
  options: ResolveOptions = {},
): Timeline {
  const { settleMs = 0, maxResetMs = DEFAULT_MAX_RESET_MS } = options;
  const timeScale = options.timeScale && options.timeScale > 0 ? options.timeScale : 1;

  const segments: Segment[] = [];
  const warnings: CompileWarning[] = [];
  const phaseStartsMs: number[] = [];
  const phaseEndsMs: number[] = [];
  const critical = new Set<number>([0]);

  const startOf = (actorId: ActorId): Point =>
    state.initialBoard[actorId] ?? { x: 50, y: 50 };

  const where = (actorId: ActorId, t: number): Point =>
    positionAt(segments, actorId, t, startOf(actorId));

  /** Who is on the ball. Drives auto-dribble; updated as the ball changes hands. */
  let ballHolder: ActorId | null = nearestActor(
    state.initialBoard,
    state.initialBoard[BALL],
    CARRY_RADIUS,
  );

  let cursor = 0;

  for (const phase of state.phases) {
    const phaseStart = cursor + Math.max(0, phase.holdMs ?? 0);
    phaseStartsMs.push(phaseStart);
    critical.add(phaseStart);

    const planned: Planned[] = [];

    for (const action of phase.actions) {
      const parsed = parseActor(action.actorId);
      if (!parsed) {
        warnings.push({
          code: 'unknown-actor',
          detail: `"${action.actorId}" is not a recognised actor id`,
          phaseId: phase.id,
          actionId: action.id,
          actorId: action.actorId,
        });
        continue;
      }
      if (!(action.actorId in state.initialBoard)) {
        warnings.push({
          code: 'no-start-position',
          detail: `${action.actorId} has no entry in initialBoard; assuming centre`,
          phaseId: phase.id,
          actionId: action.id,
          actorId: action.actorId,
        });
      }

      const isBall = parsed.kind === 'ball';
      const origin = where(action.actorId, phaseStart);

      // Destinations are resolved but never derived from an origin — rule 2. An
      // actor-bound target is read at phaseStart, so a pass follows a receiver who
      // moved in an earlier phase instead of being played to where he used to be.
      let destination: Point;
      let motion: SegmentMotion;
      if (action.to.kind === 'origin') {
        destination = origin;
        motion = 'circuit';
      } else if (action.to.kind === 'actor') {
        destination = where(action.to.actorId, phaseStart);
        motion = 'one-way';
      } else {
        destination = action.to.at;
        motion = 'one-way';
      }

      const repeat = Math.max(1, Math.floor(action.repeat ?? 1));
      if (repeat > 1 && motion === 'one-way') motion = 'out-and-back';
      const traversals = motion === 'one-way' ? 1 : repeat;

      const points = [origin, ...(action.via ?? []), destination];
      const distance = travelDistance(points, motion, traversals);

      // Speed is validated here rather than in the type: a ball speed on a player
      // would otherwise move a centre-back at 20 m/s in silence.
      let speed = action.speed;
      if (speed) {
        const wrongKind = isBall ? !isBallSpeed(speed) : !isPlayerSpeed(speed);
        if (wrongKind) {
          warnings.push({
            code: 'speed-kind-mismatch',
            detail: `"${speed}" is not a ${isBall ? 'ball' : 'player'} speed; using default`,
            phaseId: phase.id,
            actionId: action.id,
            actorId: action.actorId,
          });
          speed = undefined;
        }
      }
      const effectiveSpeed = speed ?? (isBall ? DEFAULT_BALL_SPEED : DEFAULT_PLAYER_SPEED);

      // Drawn timing wins over the speed enum where it exists — that is what keeps
      // "he takes his time here" expressible.
      const durationMs =
        action.durationMs !== undefined && action.durationMs > 0
          ? action.durationMs
          : (distance / speedPctPerSecond(effectiveSpeed)) * 1000;

      if (distance <= EPSILON_PCT && action.durationMs === undefined) {
        warnings.push({
          code: 'zero-length-action',
          detail: `${action.actorId} does not move; the action has no effect`,
          phaseId: phase.id,
          actionId: action.id,
          actorId: action.actorId,
        });
      }

      planned.push({
        action,
        actorId: action.actorId,
        points,
        motion,
        traversals,
        startMs: phaseStart + Math.max(0, action.holdMs ?? 0),
        durationMs,
        distance,
      });
    }

    // --- Rendezvous ------------------------------------------------------
    // Phase-local by design: "arrive with the ball" means the ball that is being
    // played in this phase, which is the only reading a coach would give it.
    const ballLeg = planned.find(p => p.actorId === BALL);
    const ballArrivalMs = ballLeg ? ballLeg.startMs + ballLeg.durationMs : undefined;

    for (const p of planned) {
      if (p.action.constraint !== 'arrive-with-ball' || p.actorId === BALL) continue;
      if (ballArrivalMs === undefined) {
        warnings.push({
          code: 'constraint-no-ball',
          detail: 'arrive-with-ball needs a ball action in the same phase',
          phaseId: phase.id,
          actionId: p.action.id,
          actorId: p.actorId,
        });
        continue;
      }

      const available = ballArrivalMs - p.startMs;
      // Physics wins. A run that cannot make it goes flat out and arrives late,
      // which is what happens on a pitch — and the UI turns the badge red.
      const floorMs = (p.distance / mpsToPctPerSecond(MAX_SPRINT_MPS)) * 1000;
      if (available < floorMs) {
        p.durationMs = floorMs;
        warnings.push({
          code: 'constraint-unreachable',
          detail:
            `needs ${Math.round(available)}ms to arrive with the ball but flat out ` +
            `takes ${Math.round(floorMs)}ms; arriving late`,
          phaseId: phase.id,
          actionId: p.action.id,
          actorId: p.actorId,
        });
      } else {
        p.durationMs = available;
        critical.add(ballArrivalMs);
      }
    }

    // --- Phase duration --------------------------------------------------
    // max() over the actions that belong to this phase, with `continuous` ones
    // excluded so an overlapping run doesn't hold the whole move up. Excluding
    // them is skipped when it would leave nothing, otherwise a phase made only of
    // overlapping runs would collapse to zero length.
    const bounding = planned.filter(p => !p.action.continuous);
    const sizing = bounding.length > 0 ? bounding : planned;
    const phaseEnd = sizing.reduce(
      (max, p) => Math.max(max, p.startMs + p.durationMs),
      phaseStart,
    );
    if (planned.length === 0) {
      warnings.push({
        code: 'empty-phase',
        detail: 'phase has no usable actions and takes no time',
        phaseId: phase.id,
      });
    }
    phaseEndsMs.push(phaseEnd);
    critical.add(phaseEnd);

    // --- Emit ------------------------------------------------------------
    for (const p of planned) {
      // A new action for an actor whose earlier continuous run is still going ends
      // that run where it had got to. The origin was already read at phaseStart
      // via positionAt, so the two join up rather than teleporting.
      for (const s of segments) {
        if (s.actorId === p.actorId && s.endMs > p.startMs && s.startMs < p.startMs) {
          s.endMs = p.startMs;
          warnings.push({
            code: 'continuous-truncated',
            detail: `superseded by a new action at ${Math.round(p.startMs)}ms`,
            actionId: s.actionId,
            actorId: s.actorId,
          });
        }
      }

      segments.push({
        actorId: p.actorId,
        kind: 'travel',
        actionId: p.action.id,
        startMs: p.startMs,
        endMs: p.startMs + p.durationMs,
        points: p.points,
        motion: p.motion,
        traversals: p.traversals,
        // An authored ball action is a played ball. The carry copy below is the
        // same actor but deliberately gets neither flag.
        ...(p.actorId === BALL && {
          struck: true,
          ...((p.action.isLofted || p.action.speed === 'lofted') && { lofted: true }),
        }),
      });
    }

    // --- Possession ------------------------------------------------------
    // A carry needs no gesture of its own: if the man on the ball runs and nobody
    // played the ball this phase, the ball goes with him. Making the ball a copy
    // of his segment rather than a second thing to keep in step is what stops the
    // two drifting apart.
    if (!ballLeg && ballHolder) {
      const carry = planned.find(p => p.actorId === ballHolder);
      if (carry) {
        segments.push({
          actorId: BALL,
          kind: 'travel',
          actionId: `${carry.action.id}:carry`,
          startMs: carry.startMs,
          endMs: carry.startMs + carry.durationMs,
          points: carry.points,
          motion: carry.motion,
          traversals: carry.traversals,
        });
      }
    }

    // Who has it now.
    if (ballLeg) {
      const arrival = ballLeg.startMs + ballLeg.durationMs;
      if (ballLeg.action.to.kind === 'actor') {
        ballHolder = ballLeg.action.to.actorId;
      } else {
        const at = ballLeg.points[ballLeg.points.length - 1];

        // A ball played into space is collected by whoever ran onto it, not by
        // whoever happened to be standing nearest. Resolving this by proximity
        // alone hands a cross to the defender marking the striker whenever he is a
        // fraction closer to the delivery — and on a cross into the box he usually
        // is, so possession would flip teams on almost every delivery.
        const arriving = planned
          .filter(p => p.actorId !== BALL)
          .map(p => ({
            actorId: p.actorId,
            distance: pitchDistance(p.points[p.points.length - 1], at),
          }))
          .filter(c => c.distance <= CARRY_RADIUS)
          .sort((a, b) => a.distance - b.distance);

        // Failing that, a bystander may pick it up — but the side in possession is
        // preferred, because a genuine interception is something a coach draws (a
        // ball arrow aimed at an opponent), not something proximity should infer.
        const holdingTeam = ballHolder ? parseActor(ballHolder) : null;
        const team = holdingTeam?.kind === 'player' ? holdingTeam.team : undefined;
        ballHolder =
          arriving[0]?.actorId ??
          (team
            ? nearestActorAt(
                Object.keys(state.initialBoard).filter(id => id.startsWith(`${team}:`)),
                id => where(id, arrival),
                at,
                CARRY_RADIUS,
              )
            : null) ??
          nearestActorAt(
            Object.keys(state.initialBoard),
            id => where(id, arrival),
            at,
            CARRY_RADIUS,
          );
      }
    }

    cursor = phaseEnd;
  }

  // --- Reset -------------------------------------------------------------
  // The one piece of time the author never sees. A continuous run may still be
  // going when the last phase ends, so the reset waits for it rather than
  // yanking the full-back backwards mid-overlap.
  const lastEnd = segments.reduce((max, s) => Math.max(max, s.endMs), cursor);
  const resetStartMs = Math.max(cursor, lastEnd) + Math.max(0, settleMs);

  const movedActors = [...new Set(segments.map(s => s.actorId))];
  const resets: { actorId: ActorId; from: Point; to: Point; distance: number }[] = [];
  for (const actorId of movedActors) {
    const from = where(actorId, resetStartMs);
    const to = startOf(actorId);
    const distance = pitchDistance(from, to);
    if (distance > EPSILON_PCT) resets.push({ actorId, from, to, distance });
  }

  let resetMs = 0;
  if (resets.length > 0) {
    const furthest = resets.reduce((max, r) => Math.max(max, r.distance), 0);
    // One shared duration, so the reset reads as a single movement rather than as
    // eleven separate recoveries on their own schedules.
    resetMs = Math.min(
      Math.max(MIN_RESET_MS, maxResetMs),
      Math.max(MIN_RESET_MS, (furthest / RESET_PCT_PER_S) * 1000),
    );
    for (const r of resets) {
      segments.push({
        actorId: r.actorId,
        kind: 'reset',
        startMs: resetStartMs,
        endMs: resetStartMs + resetMs,
        points: [r.from, r.to],
        motion: 'one-way',
        traversals: 1,
      });
    }
  }

  const totalMs = resetStartMs + resetMs;
  critical.add(resetStartMs);
  critical.add(totalMs);

  const scale = (ms: number) => ms / timeScale;
  const scaled: Timeline = {
    totalMs: scale(totalMs),
    phaseStartsMs: phaseStartsMs.map(scale),
    phaseEndsMs: phaseEndsMs.map(scale),
    criticalMs: [...critical].map(scale).sort((a, b) => a - b),
    resetStartMs: scale(resetStartMs),
    segments: segments.map(s => ({ ...s, startMs: scale(s.startMs), endMs: scale(s.endMs) })),
    warnings,
  };
  return scaled;
}

/** Nearest actor to a point, among a position map. */
function nearestActor(
  board: Record<ActorId, Point>,
  to: Point | undefined,
  radius: number,
): ActorId | null {
  if (!to) return null;
  return nearestActorAt(Object.keys(board), id => board[id], to, radius);
}

function nearestActorAt(
  actorIds: ActorId[],
  positionOf: (id: ActorId) => Point | undefined,
  to: Point,
  radius: number,
): ActorId | null {
  let best: ActorId | null = null;
  let bestDist = radius;
  for (const id of actorIds) {
    if (id === BALL) continue;
    const at = positionOf(id);
    if (!at) continue;
    const d = pitchDistance(at, to);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Keyframe compilation
// ---------------------------------------------------------------------------

export interface CompileOptions extends ResolveOptions {
  fps?: number;
  /** Identity only — name, number, cards. Positions come from the timeline. */
  players: Player[];
  oppositionPlayers?: Player[];
  fieldSettings: FieldSettings;
}

export interface CompiledAnimation {
  durationMs: number;
  fps: number;
  keyframes: Keyframe[];
  loop: true;
  timeline: Timeline;
}

/**
 * Sample times: an fps grid, plus every critical instant pinned exactly.
 *
 * The grid alone is what smeared arrivals in V1 — a rendezvous at 2410ms sampled
 * at 2375 and 2416 is interpolated *through*, so the ball and the runner never
 * actually coincide on any rendered frame. Pinning the instant makes the meeting
 * a real frame.
 */
export function sampleTimes(timeline: Timeline, fps: number): number[] {
  const step = 1000 / fps;
  const times = new Set<number>();
  for (let t = 0; t < timeline.totalMs; t += step) times.add(Math.round(t));
  times.add(Math.round(timeline.totalMs));
  for (const c of timeline.criticalMs) times.add(Math.round(c));
  return [...times].sort((a, b) => a - b);
}

export function compileTactic(
  state: TacticState,
  options: CompileOptions,
): CompiledAnimation {
  const { fps = 24, players, oppositionPlayers = [], fieldSettings } = options;
  const timeline = resolveTimeline(state, options);

  // Nothing moves, so there is no animation — not a one-frame one. Callers treat a
  // non-empty keyframe list as "this tactic is animated", and a lone keyframe at
  // t=0 makes an untouched board look like a legacy keyframe animation.
  if (timeline.segments.length === 0) {
    return { durationMs: 0, fps, keyframes: [], loop: true, timeline };
  }

  const times = sampleTimes(timeline, fps);

  const fallbackFor = (actorId: ActorId, roster: Player[], id: number): Point => {
    const seeded = state.initialBoard[actorId];
    if (seeded) return seeded;
    // A player the tactic never mentions holds the position the roster gives him,
    // so initialBoard only has to list the actors that actually take part.
    const p = roster.find(r => r.id === id);
    return p ? { x: p.x, y: p.y } : { x: 50, y: 50 };
  };

  const poseAt = (roster: Player[], team: 'home' | 'away', t: number): Player[] =>
    roster.map(p => {
      const actorId = playerActor(team, p.id);
      const { x, y } = positionAt(
        timeline.segments,
        actorId,
        t,
        fallbackFor(actorId, roster, p.id),
      );
      return { ...p, x, y };
    });

  const ballFallback = state.initialBoard[BALL] ?? fieldSettings.ball ?? { x: 50, y: 50 };

  const keyframes: Keyframe[] = times.map((t, i) => {
    const pos = positionAt(timeline.segments, BALL, t, ballFallback);
    const lift = ballLiftAt(timeline.segments, t);
    // A fresh object rather than mutating: positionAt can hand back the fallback
    // by reference, and lift is only carried when there is some, so a tactic with
    // no lofted pass produces byte-identical output to before.
    const ball = lift > 0 ? { x: pos.x, y: pos.y, lift } : pos;
    return {
      // Deterministic rather than crypto.randomUUID(): identical input has to
      // produce byte-identical output or the golden test can never assert on it.
      id: `kf-${i}`,
      timeMs: t,
      players: poseAt(players, 'home', t),
      fieldSettings: { ...fieldSettings, ball },
      ...(oppositionPlayers.length > 0 && {
        oppositionPlayers: poseAt(oppositionPlayers, 'away', t),
      }),
    };
  });

  return {
    durationMs: Math.round(timeline.totalMs),
    fps,
    keyframes,
    loop: true,
    timeline,
  };
}
