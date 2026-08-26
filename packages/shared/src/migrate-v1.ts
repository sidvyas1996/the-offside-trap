import type {
  AnimationData,
  Ball,
  FieldSettings,
  Keyframe,
  Movement,
  MovementTempo,
  PassNode,
  Player,
  TacticArrow,
} from "./index";
import {
  BALL,
  playerActor,
  toActor,
  toPoint,
  type Action,
  type ActorId,
  type Phase,
  type PlayerSpeed,
  type Point,
  type PositionMap,
  type TacticState,
} from "./tactic-v2";
import { pitchDistance } from "./pitch-geometry";

/**
 * One-way conversion of every V1 authoring format into a V2 TacticState.
 *
 * V1 accumulated four different ways to hold an animation, and a migration that
 * only understands some of them silently blanks the rest:
 *
 *   arrows      the diagram *is* the animation (`fromArrows`), sequenced by `beat`
 *   movements   drag-authored cyclic Movements plus an ordered PassSequence
 *   keyframes   preset animations, written straight to keyframes with no authoring
 *               source behind them
 *   none        arrows drawn purely as annotation, on a tactic with no motion
 *
 * That last case is the one that bites. `fromArrows` exists precisely because
 * tactics saved before arrows carried motion must keep their arrows as static
 * decoration — so converting arrows unconditionally would make every old diagram
 * in the database start animating on load. The rule here is that a V1 tactic with
 * no animation converts to zero phases and `staticOnly: true`.
 *
 * Nothing writes back: this reads V1 and returns V2, so it is safe to run on load
 * and compare against V1 playback before committing anything.
 */

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export type MigrationSource = 'arrows' | 'movements' | 'keyframes' | 'none';

export type MigrationWarningCode =
  /** The tactic had no animation. Its arrows stay annotation. */
  | 'static-diagram-preserved'
  /** Poses became phases. Faithful, but V1 lerped where V2 eases. */
  | 'keyframes-converted'
  /** V1's explicit return-to-start leg is now the compiler's hidden reset. */
  | 'closing-leg-dropped'
  /** An arrow with nobody at its tail was annotation, not motion. */
  | 'orphan-arrow'
  | 'target-zone-skipped'
  /** A dribble whose carrier could not be identified; the ball may not follow. */
  | 'unresolved-dribble-carrier'
  /** A cue pointed past the end of the pass chain. */
  | 'cue-out-of-range'
  /** Windowed movements and pass legs disagreed on how many phases there are. */
  | 'window-leg-count-mismatch'
  /** A pause after the final pose; V2 has nowhere to put it. */
  | 'trailing-pause-dropped'
  /** A Movement targeting the ball, from before passes had their own type. */
  | 'legacy-ball-movement'
  /** V1's tempo rest-fraction has no V2 equivalent and is simply dropped. */
  | 'tempo-rest-fraction-dropped';

export interface MigrationWarning {
  code: MigrationWarningCode;
  detail: string;
  actorId?: ActorId;
  sourceId?: string;
}

export interface MigrationResult {
  state: TacticState;
  source: MigrationSource;
  /** True when the tactic had no motion and must remain a static diagram. */
  staticOnly: boolean;
  warnings: MigrationWarning[];
}

export interface V1Tactic {
  animation?: AnimationData | null;
  arrows?: TacticArrow[] | null;
  players: Player[];
  oppositionPlayers?: Player[] | null;
  fieldSettings?: FieldSettings | null;
}

/** Positions closer than this are the same position. */
const EPSILON_PCT = 0.01;

/** How close an arrow tail must be to a marker to be that player's arrow. */
const ARROW_BIND_RADIUS = 6;

const DEFAULT_LOOP_MS = 5000;

// ---------------------------------------------------------------------------
// Shared mappings
// ---------------------------------------------------------------------------

/**
 * V1 tempo -> V2 speed.
 *
 * V1's tempo did two jobs: it named a speed *and* set what fraction of the cycle
 * was spent moving rather than resting (`TRAVEL_FRACTION`), which is how a sprint
 * read as a burst-then-pause. V2 has no rest fraction — a phase ends when its
 * actions do — so only the speed survives.
 */
const TEMPO_SPEED: Record<MovementTempo, PlayerSpeed> = {
  jog: 'jog',
  run: 'run',
  sprint: 'sprint',
};

/** Tempo implied by an arrow type, matching utils/arrows-to-motion.ts. */
const IMPLIED_TEMPO: Record<string, MovementTempo> = {
  'direct-run': 'run',
  'secondary-run': 'jog',
  'curved-run': 'run',
  'press-run': 'sprint',
};

/** Arrow types that move the ball rather than a player. */
const BALL_ARROW_TYPES = new Set(['pass', 'dribble', 'long-ball', 'target-zone']);

const beatOf = (a: TacticArrow) => Math.max(1, Math.floor(a.beat ?? 1));

const samePoint = (a: Point, b: Point) => pitchDistance(a, b) <= EPSILON_PCT;

/**
 * Points tracing the curve a drawn arrow follows.
 *
 * ArrowOverlay draws curved runs and long balls as a quadratic Bézier whose
 * control point is `curveControl()`. Two traps here, both already paid for:
 *
 *  - A quadratic's control point does *not* lie on the curve, so pushing it onto
 *    the path as a waypoint bulges the motion about twice as far as the arrow the
 *    coach drew. Every point returned here is evaluated *on* the curve.
 *  - The compiler walks `via` as a polyline, so a single on-curve midpoint still
 *    animates two straight legs with a corner at the apex — a visible kink where
 *    the drawing is smooth. Sampling the curve is what removes it.
 *
 * The raw hypot is deliberate and matches ArrowOverlay: the control point is
 * computed in unscaled percentage space, so using pitchDistance here would move
 * the bend off the drawn arrow.
 */
function curveWaypoints(from: Point, to: Point): Point[] {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return [];
  // Same control point ArrowOverlay draws with, so animated and drawn agree.
  const cx = mx + (-dy / len) * len * 0.28;
  const cy = my + (dx / len) * len * 0.28;

  const SEGMENTS = 8;
  const out: Point[] = [];
  for (let i = 1; i < SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const inv = 1 - t;
    out.push({
      x: inv * inv * from.x + 2 * inv * t * cx + t * t * to.x,
      y: inv * inv * from.y + 2 * inv * t * cy + t * t * to.y,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Starting board
// ---------------------------------------------------------------------------

/**
 * The resting board, which becomes `initialBoard`.
 *
 * V1's own answer to "where does this player belong" was `restingPose`: the start
 * of their movement, not their current position, because playback wrote
 * interpolated positions straight into `players`. A tactic saved while paused
 * mid-animation therefore has displaced `players`, and reading them naively would
 * bake that displacement in permanently. Movement paths win where they exist.
 */
function restingBoard(v1: V1Tactic): PositionMap {
  const board: PositionMap = {};
  for (const p of v1.players) board[playerActor('home', p.id)] = { x: p.x, y: p.y };
  for (const p of v1.oppositionPlayers ?? []) board[playerActor('away', p.id)] = { x: p.x, y: p.y };

  for (const m of v1.animation?.movements ?? []) {
    if (m.target.kind !== 'player' || m.path.length === 0) continue;
    board[playerActor(m.target.team, m.target.playerId)] = { ...m.path[0] };
  }

  board[BALL] = restingBall(v1);
  return board;
}

/** Mirrors V1's `restingBall`: the chain start, then a legacy ball movement, then live. */
function restingBall(v1: V1Tactic): Ball {
  const nodes = v1.animation?.passes?.nodes ?? [];
  if (nodes.length > 0) return { ...nodes[0].at };
  const legacy = v1.animation?.movements?.find(m => m.target.kind === 'ball');
  if (legacy && legacy.path.length > 0) return { ...legacy.path[0] };
  return v1.fieldSettings?.ball ?? { x: 50, y: 50 };
}

// ---------------------------------------------------------------------------
// Arrows -> phases
// ---------------------------------------------------------------------------

function resolveArrowActor(
  ref: { team: 'home' | 'away'; playerId: number } | undefined,
  pt: Point | undefined,
  board: PositionMap,
): ActorId | null {
  // The bound ref wins, exactly as in V1 — proximity alone orphans an arrow the
  // moment its player is repositioned.
  if (ref) {
    const id = playerActor(ref.team, ref.playerId);
    return id in board ? id : null;
  }
  if (!pt) return null;

  let best: ActorId | null = null;
  let bestDist = ARROW_BIND_RADIUS;
  for (const [actorId, at] of Object.entries(board)) {
    if (actorId === BALL) continue;
    const d = pitchDistance(at, pt);
    if (d < bestDist) {
      bestDist = d;
      best = actorId;
    }
  }
  return best;
}

function phasesFromArrows(
  arrows: TacticArrow[],
  board: PositionMap,
  warn: (w: MigrationWarning) => void,
): Phase[] {
  const markers = arrows.filter(a => a.type === 'target-zone');
  if (markers.length > 0) {
    warn({
      code: 'target-zone-skipped',
      detail: `${markers.length} target marker(s) are annotation and move nothing`,
    });
  }

  const motion = arrows.filter(a => a.type !== 'target-zone' && a.points.length >= 2);
  const beats = [...new Set(motion.map(beatOf))].sort((a, b) => a - b);

  const phases: Phase[] = [];
  for (const beat of beats) {
    const actions: Action[] = [];

    for (const arrow of motion.filter(a => beatOf(a) === beat)) {
      const from = arrow.points[0];
      const to = arrow.points[1];

      if (!BALL_ARROW_TYPES.has(arrow.type)) {
        const actorId = resolveArrowActor(arrow.from, from, board);
        if (!actorId) {
          warn({
            code: 'orphan-arrow',
            detail: `a ${arrow.type} with nobody at its tail; kept as annotation`,
            sourceId: arrow.id,
          });
          continue;
        }
        const bend = arrow.type === 'curved-run' ? curveWaypoints(from, to) : [];
        actions.push({
          id: `arrow-${arrow.id}`,
          actorId,
          to: toPoint({ ...to }),
          ...(bend.length > 0 && { via: bend }),
          speed: TEMPO_SPEED[arrow.tempo ?? IMPLIED_TEMPO[arrow.type] ?? 'run'],
        });
        continue;
      }

      if (arrow.type === 'dribble') {
        // A carry is the carrier's run; the compiler attaches the ball because he
        // is on it. No second action to keep in step.
        const carrier = resolveArrowActor(arrow.from, from, board);
        if (!carrier) {
          warn({
            code: 'unresolved-dribble-carrier',
            detail: 'a dribble with nobody at its tail; the ball will not follow',
            sourceId: arrow.id,
          });
          continue;
        }
        actions.push({
          id: `arrow-${arrow.id}`,
          actorId: carrier,
          to: toPoint({ ...to }),
          speed: TEMPO_SPEED[arrow.tempo ?? 'run'],
        });
        continue;
      }

      const receiver = arrow.endsAtPlayer ? resolveArrowActor(arrow.to, to, board) : null;
      const bend = arrow.type === 'long-ball' ? curveWaypoints(from, to) : [];
      actions.push({
        id: `arrow-${arrow.id}`,
        actorId: BALL,
        // Bind to the receiver where V1 knew one: a pass then follows a player who
        // moved in an earlier phase instead of arriving where he used to stand.
        to: receiver ? toActor(receiver) : toPoint({ ...to }),
        ...(bend.length > 0 && { via: bend }),
        speed: arrow.type === 'long-ball' ? 'lofted' : 'pass',
        ...(arrow.type === 'long-ball' && { isLofted: true }),
      });
    }

    if (actions.length > 0) phases.push({ id: `beat-${beat}`, actions });
  }
  return phases;
}

// ---------------------------------------------------------------------------
// Movements + passes -> phases
// ---------------------------------------------------------------------------

/** One pass leg becomes one action — a carry becomes the carrier's, not the ball's. */
function actionFromPassLeg(
  index: number,
  prev: PassNode,
  node: PassNode,
  warn: (w: MigrationWarning) => void,
): Action {
  const holdMs = prev.holdMs && prev.holdMs > 0 ? prev.holdMs : undefined;

  if (node.via === 'dribble') {
    if (node.carrier) {
      return {
        id: `leg-${index}`,
        actorId: playerActor(node.carrier.team, node.carrier.playerId),
        to: toPoint({ ...node.at }),
        ...(node.bend && node.bend.length > 0 && { via: node.bend.map(p => ({ ...p })) }),
        ...(node.travelMs && node.travelMs > 0 && { durationMs: node.travelMs }),
        ...(holdMs && { holdMs }),
      };
    }
    warn({
      code: 'unresolved-dribble-carrier',
      detail: `pass leg ${index} is a carry with no recorded carrier; moving the ball alone`,
      sourceId: `leg-${index}`,
    });
  }

  const receiver = node.receiver
    ? playerActor(node.receiver.team, node.receiver.playerId)
    : null;
  const lofted = !!node.bend && node.bend.length > 0;
  return {
    id: `leg-${index}`,
    actorId: BALL,
    to: receiver ? toActor(receiver) : toPoint({ ...node.at }),
    ...(lofted && { via: node.bend!.map(p => ({ ...p })) }),
    speed: lofted ? 'lofted' : 'pass',
    ...(lofted && { isLofted: true }),
    // Drawn timing is the ground truth where V1 recorded it.
    ...(node.travelMs && node.travelMs > 0 && { durationMs: node.travelMs }),
    ...(holdMs && { holdMs }),
  };
}

/** A cyclic V1 Movement becomes one action; `cycle` picks the destination kind. */
function actionFromMovement(
  movement: Movement,
  index: number,
  loopMs: number,
  applyDelay: boolean,
  warn: (w: MigrationWarning) => void,
): Action | null {
  const { path } = movement;
  if (path.length < 2) return null;

  const actorId =
    movement.target.kind === 'ball'
      ? BALL
      : playerActor(movement.target.team, movement.target.playerId);

  if (movement.target.kind === 'ball') {
    warn({
      code: 'legacy-ball-movement',
      detail: 'a Movement targeting the ball, from before passes had their own type',
      actorId: BALL,
      sourceId: movement.id,
    });
  }

  const last = path[path.length - 1];
  const closed = samePoint(last, path[0]);
  const repeat = Math.max(1, Math.floor(movement.repeats ?? 1));

  // 'loop' is a closed circuit, so it returns to its own origin — which is exactly
  // what Destination 'origin' means, and it is why that variant exists.
  const isCircuit = movement.cycle === 'loop' || (closed && movement.cycle !== 'one-way');
  const via = isCircuit
    ? (closed ? path.slice(1, -1) : path.slice(1))
    : path.slice(1, -1);

  if (movement.tempo === 'sprint' || movement.tempo === 'run') {
    warn({
      code: 'tempo-rest-fraction-dropped',
      detail: `${movement.tempo} spent part of its cycle at rest in V1; V2 has no rest fraction`,
      actorId,
      sourceId: movement.id,
    });
  }

  // V1's delay was a phase offset in loop fractions, keeping players out of
  // lockstep. In a sequenced model that is simply a wait before setting off.
  const holdMs =
    applyDelay && movement.delay > 0
      ? Math.round(((movement.delay % 1) + 1) % 1 * loopMs)
      : undefined;

  return {
    id: `movement-${index}`,
    actorId,
    to: isCircuit ? { kind: 'origin' } : toPoint({ ...last }),
    ...(via.length > 0 && { via: via.map(p => ({ ...p })) }),
    speed: movement.target.kind === 'ball' ? 'pass' : TEMPO_SPEED[movement.tempo] ?? 'run',
    ...(movement.cycle !== 'one-way' && repeat > 1 && { repeat }),
    ...(holdMs && { holdMs }),
  };
}

/** V1 cue -> which phase the run belongs in, and whether it is a rendezvous. */
function phaseForCue(
  movement: Movement,
  legCount: number,
  warn: (w: MigrationWarning) => void,
): { index: number; constraint?: 'arrive-with-ball' } {
  const cue = movement.cue ?? (
    movement.syncToPassNode !== undefined
      ? { node: movement.syncToPassNode, on: 'meet' as const }
      : undefined
  );
  if (!cue) return { index: 0 };

  // Leg i is the one arriving at node i, so it lives in phase i-1.
  const arrivalPhase = cue.node - 1;
  const target = cue.on === 'meet' ? arrivalPhase : arrivalPhase + 1;

  // `target === legCount` is legitimate and common: "he sets off as the ball reaches
  // the last man" is a run that begins once the chain is done, so it earns a new
  // phase of its own rather than being dropped back to the start.
  if (target < 0 || target > legCount) {
    warn({
      code: 'cue-out-of-range',
      detail: `cue on node ${cue.node} (${cue.on}) has no matching pass leg; running from the start`,
      sourceId: movement.id,
    });
    return { index: 0 };
  }
  // 'meet' is the constraint V2 solves for; 'reaches' and 'leaves' are just
  // "start when the ball gets there", which putting it in the next phase says.
  return { index: target, ...(cue.on === 'meet' && { constraint: 'arrive-with-ball' as const }) };
}

function phasesFromMovements(
  animation: AnimationData,
  warn: (w: MigrationWarning) => void,
): Phase[] {
  const movements = animation.movements ?? [];
  const nodes = animation.passes?.nodes ?? [];
  const loopMs = animation.durationMs || DEFAULT_LOOP_MS;

  const legActions: Action[] = [];
  for (let i = 1; i < nodes.length; i++) {
    legActions.push(actionFromPassLeg(i, nodes[i - 1], nodes[i], warn));
  }
  if (nodes.length > 1 && animation.passes?.closed !== false) {
    warn({
      code: 'closing-leg-dropped',
      detail: 'V1 recycled the ball to the chain start; the compiler now resets instead',
    });
  }

  // Windowed movements came from arrows, where one beat produced one window and at
  // most one ball leg. The windows are therefore the running order.
  const windows = [...new Set(
    movements.filter(m => m.window).map(m => `${m.window!.start}:${m.window!.end}`),
  )].sort((a, b) => Number(a.split(':')[0]) - Number(b.split(':')[0]));

  if (windows.length > 0) {
    const phases: Phase[] = windows.map((_, i) => ({ id: `phase-${i + 1}`, actions: [] }));
    if (legActions.length > windows.length) {
      warn({
        code: 'window-leg-count-mismatch',
        detail:
          `${legActions.length} pass legs across ${windows.length} windows; ` +
          `the surplus legs are appended as extra phases`,
      });
      while (phases.length < legActions.length) {
        phases.push({ id: `phase-${phases.length + 1}`, actions: [] });
      }
    }
    legActions.forEach((action, i) => phases[Math.min(i, phases.length - 1)].actions.push(action));

    movements.forEach((m, i) => {
      // A windowed movement's timing came from its beat, so its delay is meaningless.
      const action = actionFromMovement(m, i, loopMs, false, warn);
      if (!action) return;
      const key = m.window ? `${m.window.start}:${m.window.end}` : null;
      const index = key ? Math.max(0, windows.indexOf(key)) : 0;
      phases[index].actions.push(action);
    });

    return phases.filter(p => p.actions.length > 0);
  }

  // Gesture-authored: the pass chain is the only real sequence in the data, and
  // cues are what tie a run to a moment in it.
  const phases: Phase[] = legActions.map((action, i) => ({
    id: `phase-${i + 1}`,
    actions: [action],
  }));
  if (phases.length === 0) phases.push({ id: 'phase-1', actions: [] });

  movements.forEach((m, i) => {
    const action = actionFromMovement(m, i, loopMs, true, warn);
    if (!action) return;
    const { index, constraint } = phaseForCue(m, legActions.length, warn);
    // A cue landing past the last leg opens a phase, rather than being clamped back
    // into one where it would fire at the wrong moment.
    while (index >= phases.length) {
      phases.push({ id: `phase-${phases.length + 1}`, actions: [] });
    }
    phases[index].actions.push(constraint ? { ...action, constraint } : action);
  });

  return phases.filter(p => p.actions.length > 0);
}

// ---------------------------------------------------------------------------
// Keyframes -> phases
// ---------------------------------------------------------------------------

const ballOf = (kf: Keyframe): Point | undefined => kf.fieldSettings?.ball;

function posesOf(kf: Keyframe): PositionMap {
  const map: PositionMap = {};
  for (const p of kf.players ?? []) map[playerActor('home', p.id)] = { x: p.x, y: p.y };
  for (const p of kf.oppositionPlayers ?? []) map[playerActor('away', p.id)] = { x: p.x, y: p.y };
  const ball = ballOf(kf);
  if (ball) map[BALL] = { ...ball };
  return map;
}

/**
 * Poses become phases.
 *
 * This is the closest of all four conversions, because a keyframe already *is* what
 * a phase is: a moment where the board is in a known state. The presets are even
 * authored that way — 3-6 labelled poses like "Keeper to centre-back" — so what
 * comes out reads like something a person would have drawn with Step.
 *
 * Every action carries an explicit `durationMs` taken from the gap between the two
 * keyframes, not a speed. That is deliberate: for keyframe data the recorded timing
 * is the ground truth, so everyone in a phase takes the whole gap exactly as V1's
 * interpolator did. The one visible difference is easing — V1 lerped linearly
 * between keyframes where V2 eases each segment.
 */
function phasesFromKeyframes(
  keyframes: Keyframe[],
  warn: (w: MigrationWarning) => void,
): Phase[] {
  const sorted = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);
  const phases: Phase[] = [];
  /** A gap where nothing moved is a pause, carried onto the next phase. */
  let pendingHoldMs = 0;

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].timeMs - sorted[i - 1].timeMs;
    if (gap <= 0) continue;

    const before = posesOf(sorted[i - 1]);
    const after = posesOf(sorted[i]);
    const actions: Action[] = [];

    for (const [actorId, to] of Object.entries(after)) {
      const from = before[actorId];
      if (!from || samePoint(from, to)) continue;
      actions.push({
        id: `kf-${i}-${actorId}`,
        actorId,
        to: toPoint({ ...to }),
        durationMs: gap,
      });
    }

    if (actions.length === 0) {
      pendingHoldMs += gap;
      continue;
    }

    phases.push({
      id: sorted[i].label ? `${sorted[i].label}` : `pose-${i}`,
      ...(pendingHoldMs > 0 && { holdMs: pendingHoldMs }),
      actions,
    });
    pendingHoldMs = 0;
  }

  if (pendingHoldMs > 0) {
    warn({
      code: 'trailing-pause-dropped',
      detail: `${pendingHoldMs}ms of stillness after the final pose has nowhere to go`,
    });
  }
  if (phases.length > 0) {
    warn({
      code: 'keyframes-converted',
      detail:
        `${phases.length} phase(s) recovered from ${sorted.length} keyframes; ` +
        `V1 interpolated linearly where V2 eases each move`,
    });
  }
  return phases;
}

// ---------------------------------------------------------------------------
// Live authoring
// ---------------------------------------------------------------------------

/**
 * Build a V2 TacticState from arrows on the board right now.
 *
 * The studio's authoring surface is still arrows, and an arrow's `beat` *is* its
 * phase number — so live authoring and the migration want exactly the same
 * conversion. Sharing it means the tactic you are drawing and the tactic you
 * reopen tomorrow compile through one code path rather than two that drift.
 *
 * Unlike `migrateTacticToV2` this makes no judgement about whether the arrows
 * should animate: the caller has already decided that.
 */
export function tacticStateFromArrows(
  arrows: TacticArrow[],
  players: Player[],
  oppositionPlayers: Player[],
  ball: Point,
): { state: TacticState; warnings: MigrationWarning[] } {
  const warnings: MigrationWarning[] = [];
  const initialBoard: PositionMap = {};
  for (const p of players) initialBoard[playerActor('home', p.id)] = { x: p.x, y: p.y };
  for (const p of oppositionPlayers) initialBoard[playerActor('away', p.id)] = { x: p.x, y: p.y };
  initialBoard[BALL] = { ...ball };

  const phases = phasesFromArrows(arrows, initialBoard, w => warnings.push(w));
  return { state: { schemaVersion: 2, initialBoard, phases }, warnings };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function migrateTacticToV2(v1: V1Tactic): MigrationResult {
  const warnings: MigrationWarning[] = [];
  const warn = (w: MigrationWarning) => warnings.push(w);

  const animation = v1.animation ?? undefined;
  const arrows = v1.arrows ?? [];
  const initialBoard = restingBoard(v1);

  const hasArrowMotion = !!animation?.fromArrows && arrows.length > 0;
  const hasGestureMotion =
    (animation?.movements?.length ?? 0) > 0 || (animation?.passes?.nodes?.length ?? 0) > 1;
  const hasKeyframes = (animation?.keyframes?.length ?? 0) > 1;

  // Order matches V1 playback: CreateTactics compiled from arrows in preference to
  // movements whenever `fromArrows` was set, so converting in any other order would
  // migrate a tactic to something that never played.
  let source: MigrationSource = 'none';
  let phases: Phase[] = [];

  if (hasArrowMotion) {
    source = 'arrows';
    phases = phasesFromArrows(arrows, initialBoard, warn);
  } else if (hasGestureMotion) {
    source = 'movements';
    phases = phasesFromMovements(animation!, warn);
  } else if (hasKeyframes) {
    source = 'keyframes';
    phases = phasesFromKeyframes(animation!.keyframes, warn);
    // Keyframe 0 is the authored board; movements never existed for these.
    const opening = posesOf(animation!.keyframes.reduce((a, b) => (a.timeMs <= b.timeMs ? a : b)));
    for (const [actorId, at] of Object.entries(opening)) initialBoard[actorId] = at;
  }

  if (phases.length === 0) {
    // Either there was no animation, or every candidate turned out to be
    // annotation. Both mean the same thing: leave it as a diagram.
    if (source === 'none') {
      warn({
        code: 'static-diagram-preserved',
        detail:
          arrows.length > 0
            ? `${arrows.length} arrow(s) stay static annotation; this tactic had no animation`
            : 'this tactic had no animation',
      });
    }
    source = source === 'none' ? 'none' : source;
  }

  return {
    state: { schemaVersion: 2, initialBoard, phases },
    source,
    staticOnly: phases.length === 0,
    warnings,
  };
}
