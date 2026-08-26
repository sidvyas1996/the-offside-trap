import { mpsToPctPerSecond } from "./pitch-geometry";

/**
 * Schema V2: a tactic is a sequence of phases, and time is an *output*.
 *
 * V1 expressed timing as fractions of a fixed loop, which meant duration was an
 * input the author never supplied and the compiler had to invent: every beat was
 * a *share* of the loop, so two runs in the same beat always took the same time
 * regardless of length, and adding an arrow silently re-scaled the speed of
 * everything else. V2 inverts that — you say how fast a player moves, and the
 * distance decides how long it takes.
 *
 * Three rules carry the whole design:
 *
 *   1. `initialBoard` is the only absolute state. Every later origin is derived.
 *   2. Destinations are absolute (or bound to an actor) and are *never* derived,
 *      so editing an early phase re-anchors later arrows without dragging their
 *      targets off the pitch landmarks they were aimed at.
 *   3. Nothing in here describes the reset. Returning everyone home so the loop
 *      seams is compile-time housekeeping, invisible to the author.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Who moves.
 *
 * A namespaced string rather than V1's `{ team, playerId }` pair, so it can be a
 * plain object key in `initialBoard`. It has to carry the team: home #7 and away
 * #7 both have `id: 7`, and a bare number would silently animate the wrong
 * player. Always build these with `playerActor()` — never by hand.
 */
export type ActorId = string;

export type Team = 'home' | 'away';

export const BALL: ActorId = 'ball';

export const playerActor = (team: Team, playerId: number): ActorId =>
  `${team}:${playerId}`;

export type ParsedActor =
  | { kind: 'ball' }
  | { kind: 'player'; team: Team; playerId: number };

/** Inverse of `playerActor`. Returns null for anything unrecognised. */
export function parseActor(id: ActorId): ParsedActor | null {
  if (id === BALL) return { kind: 'ball' };
  const [team, raw] = id.split(':');
  if ((team !== 'home' && team !== 'away') || raw === undefined) return null;
  const playerId = Number(raw);
  return Number.isFinite(playerId) ? { kind: 'player', team, playerId } : null;
}

/**
 * How fast an actor covers ground, in football words.
 *
 * Player and ball speeds share one union because `Action.actorId` is a string —
 * TypeScript cannot make the valid `speed` values depend on it without turning
 * Action into a discriminated union, which would be worse to author against. The
 * compiler validates instead: a ball speed on a player (or the reverse) falls
 * back to that actor kind's default and emits a `speed-kind-mismatch` warning,
 * rather than moving a centre-back at 20 m/s.
 */
export type PlayerSpeed = 'walk' | 'jog' | 'run' | 'sprint';
export type BallSpeed = 'pass' | 'driven' | 'lofted';
export type Speed = PlayerSpeed | BallSpeed;

/**
 * Speeds in metres per second, converted to percent-of-pitch-length per second.
 *
 * Real values on purpose: the point of physics-grounded time is that the *ratios*
 * are right, so a 40m sprint genuinely takes ~4x a 10m one. That does make a
 * whole tactic run 15-25s where V1 crammed everything into a fixed 5s loop, which
 * is what `CompileOptions.timeScale` is for — it compresses playback without
 * touching the ratios.
 */
const SPEED_MPS: Record<Speed, number> = {
  walk: 1.4,
  jog: 3.0,
  run: 5.5,
  sprint: 8.0,
  pass: 15.0,
  driven: 22.0,
  lofted: 12.0,
};

export const PLAYER_SPEEDS: PlayerSpeed[] = ['walk', 'jog', 'run', 'sprint'];
export const BALL_SPEEDS: BallSpeed[] = ['pass', 'driven', 'lofted'];

export const isPlayerSpeed = (s: Speed): s is PlayerSpeed =>
  (PLAYER_SPEEDS as Speed[]).includes(s);
export const isBallSpeed = (s: Speed): s is BallSpeed =>
  (BALL_SPEEDS as Speed[]).includes(s);

export const DEFAULT_PLAYER_SPEED: PlayerSpeed = 'run';
export const DEFAULT_BALL_SPEED: BallSpeed = 'pass';

/** Speed in percent of pitch length per second. */
export const speedPctPerSecond = (speed: Speed): number =>
  mpsToPctPerSecond(SPEED_MPS[speed]);

/**
 * Ceiling used when a rendezvous demands the impossible.
 *
 * Physics wins over the constraint: a run that cannot arrive with the ball goes
 * flat out and arrives late, which is a thing that happens on a pitch. It is
 * slightly above `sprint` so that a marginal rendezvous can still be met by
 * digging in rather than being reported as unreachable.
 */
export const MAX_SPRINT_MPS = 9.5;

/**
 * Where an action ends.
 *
 * `point` is a pitch coordinate and is the common case. `actor` binds the
 * destination to whoever is being aimed at, evaluated at the moment the action
 * starts — without it a pass to a striker who repositioned in an earlier phase
 * would be delivered to where he used to stand. `origin` closes the path back to
 * where the action began, which is how a closed-circuit drill is expressed.
 */
export type Destination =
  | { kind: 'point'; at: Point }
  | { kind: 'actor'; actorId: ActorId }
  | { kind: 'origin' };

export const toPoint = (at: Point): Destination => ({ kind: 'point', at });
export const toActor = (actorId: ActorId): Destination => ({ kind: 'actor', actorId });

/** Timing relationship to the ball within the same phase. */
export type Constraint =
  /** Move at the authored speed and arrive whenever that puts you there. */
  | 'free'
  /**
   * Arrive at the same millisecond the ball does — a run onto a pass. The
   * compiler solves for the speed needed, so this survives edits to the pass that
   * a hand-authored delay would not.
   */
  | 'arrive-with-ball';

/**
 * One actor moving once.
 *
 * Deliberately has no start time and no origin. Both are derived: the start comes
 * from the phase this action sits in, and the origin from wherever the actor
 * already is. That is rule 1, enforced by the type rather than by a comment
 * telling you not to read `path[0]`.
 */
export interface Action {
  id: string;
  actorId: ActorId;
  to: Destination;
  /**
   * Intermediate absolute points, so a curled pass or a weaving carry keeps its
   * shape. Excludes both the origin and the destination.
   */
  via?: Point[];
  /** Football speed. Defaults by actor kind. Ignored when `durationMs` is set. */
  speed?: Speed;
  /**
   * Explicit duration, overriding the speed. This is what preserves timing *as
   * drawn* — a slowly traced pass stays slow — which a speed enum alone would
   * quantise away. With `repeat` it is the total across all traversals.
   */
  durationMs?: number;
  /** Wait this long, in place, before setting off. "He holds it, then plays it." */
  holdMs?: number;
  /**
   * Allow this action to outlive its phase.
   *
   * The overlapping full-back keeps running through the next two passes. Set,
   * this action is excluded when sizing its phase and is never clipped; it simply
   * keeps interpolating while later phases play. A boolean rather than V2's phase
   * count on purpose — nobody should have to count how many phases their run
   * overlaps, and a count re-introduces the question of what happens when the run
   * outlasts it.
   */
  continuous?: boolean;
  constraint?: Constraint;
  /** Ball only: draw the leg as a lofted arc. Geometry, not speed. */
  isLofted?: boolean;
  /**
   * Traverse the path out and back this many times, finishing where it started.
   *
   * The home for V1's cyclic vocabulary — `repeats` and `cycle: 'out-and-back'` —
   * so shuttle drills survive the migration. Net displacement is zero, so a
   * repeating action never contributes to the reset.
   */
  repeat?: number;
}

/**
 * A set of actions that all begin at the same instant.
 *
 * Simultaneity is the *default* and needs no expression: two actions in a phase
 * start together. Sequence is the thing you have to say, by putting actions in
 * different phases. That inversion is what makes "together vs. after" a single
 * mechanism rather than two.
 */
export interface Phase {
  id: string;
  /**
   * Dead time before anything in the phase starts. Additive with each action's
   * own `holdMs`: the phase hold applies to everyone, then each action waits its
   * own hold on top.
   */
  holdMs?: number;
  actions: Action[];
}

/** Every actor's absolute starting coordinate. The only absolute state. */
export type PositionMap = Record<ActorId, Point>;

export interface TacticState {
  schemaVersion: 2;
  initialBoard: PositionMap;
  phases: Phase[];
}

export const emptyTacticState = (initialBoard: PositionMap = {}): TacticState => ({
  schemaVersion: 2,
  initialBoard,
  phases: [],
});
