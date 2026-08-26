import type {
  AnimationData,
  FieldSettings,
  Keyframe,
  Movement,
  Player,
} from "../index";
import type { V1Tactic } from "../migrate-v1";

/**
 * Real-shaped V1 data, one fixture per authoring format the app ever saved.
 *
 * Hand-written rather than imported from apps/web so the migration test does not
 * depend on browser code — but shaped after what is actually in there:
 * `animation-presets.ts` writes 3-6 labelled keyframes, `arrows-to-motion.ts`
 * writes windowed one-way movements plus a closed pass chain, and gesture capture
 * writes cyclic movements with cues.
 */

const SHAPE: Record<number, { x: number; y: number }> = {
  1: { x: 6, y: 50 },
  2: { x: 22, y: 12 },
  3: { x: 22, y: 88 },
  4: { x: 18, y: 62 },
  5: { x: 16, y: 38 },
  6: { x: 38, y: 50 },
  7: { x: 62, y: 14 },
  8: { x: 44, y: 30 },
  9: { x: 70, y: 50 },
  10: { x: 46, y: 70 },
  11: { x: 62, y: 86 },
};

export const v1Players = (): Player[] =>
  Object.entries(SHAPE).map(([id, at]) => ({
    id: Number(id),
    number: Number(id),
    name: `H${id}`,
    ...at,
  }));

export const v1Opposition = (): Player[] =>
  Object.entries(SHAPE).map(([id, at]) => ({
    id: Number(id),
    number: Number(id),
    name: `A${id}`,
    x: 100 - at.x,
    y: at.y,
  }));

export const v1FieldSettings = (ball = { x: 6, y: 50 }): FieldSettings => ({
  fieldColor: '#2d7a3e',
  playerColor: '#ffffff',
  showPlayerLabels: true,
  markerType: 'circle',
  ball,
});

/** A keyframe that is only there to satisfy V1's "compiled output" field. */
const stubKeyframe = (timeMs: number): Keyframe => ({
  id: `stub-${timeMs}`,
  timeMs,
  players: v1Players(),
  fieldSettings: v1FieldSettings(),
});

// ---------------------------------------------------------------------------
// 1. The case that must NOT animate
// ---------------------------------------------------------------------------

/**
 * A tactic drawn before arrows carried motion.
 *
 * `fromArrows` is absent, so V1 played nothing and rendered the arrows as
 * decoration. If the converter animates this, every old diagram in the database
 * starts moving the moment someone opens it.
 */
export const staticDiagram = (): V1Tactic => ({
  players: v1Players(),
  fieldSettings: v1FieldSettings(),
  arrows: [
    { id: 'ar1', type: 'direct-run', points: [{ x: 22, y: 12 }, { x: 60, y: 10 }], beat: 1 },
    { id: 'ar2', type: 'pass', points: [{ x: 6, y: 50 }, { x: 16, y: 38 }], beat: 2 },
    { id: 'ar3', type: 'target-zone', points: [{ x: 85, y: 45 }] },
  ],
  animation: {
    durationMs: 5000,
    fps: 24,
    keyframes: [stubKeyframe(0)],
  },
});

/** The same diagram, saved once arrows became the animation. */
export const arrowDrivenTactic = (): V1Tactic => ({
  players: v1Players(),
  oppositionPlayers: v1Opposition(),
  fieldSettings: v1FieldSettings(),
  arrows: [
    // Beat 1: the keeper plays out while the full-back goes.
    {
      id: 'ar-pass',
      type: 'pass',
      points: [{ x: 6, y: 50 }, { x: 16, y: 38 }],
      beat: 1,
      endsAtPlayer: true,
      to: { team: 'home', playerId: 5 },
    },
    {
      id: 'ar-overlap',
      type: 'direct-run',
      points: [{ x: 22, y: 12 }, { x: 66, y: 8 }],
      beat: 1,
      tempo: 'sprint',
      from: { team: 'home', playerId: 2 },
    },
    // Beat 2: a curled ball, and a run that arcs in behind.
    {
      id: 'ar-cross',
      type: 'long-ball',
      points: [{ x: 16, y: 38 }, { x: 84, y: 42 }],
      beat: 2,
    },
    {
      id: 'ar-arc',
      type: 'curved-run',
      points: [{ x: 70, y: 50 }, { x: 86, y: 40 }],
      beat: 2,
      from: { team: 'home', playerId: 9 },
    },
    // Beat 3: he carries it in.
    {
      id: 'ar-carry',
      type: 'dribble',
      points: [{ x: 86, y: 40 }, { x: 94, y: 46 }],
      beat: 3,
      from: { team: 'home', playerId: 9 },
    },
    { id: 'ar-marker', type: 'target-zone', points: [{ x: 90, y: 50 }] },
    // Annotation: nobody stands at the tail of this one.
    { id: 'ar-orphan', type: 'direct-run', points: [{ x: 50, y: 5 }, { x: 60, y: 5 }], beat: 1 },
  ],
  animation: {
    durationMs: 5000,
    fps: 24,
    fromArrows: true,
    keyframes: [stubKeyframe(0), stubKeyframe(5000)],
  },
});

// ---------------------------------------------------------------------------
// 2. Gesture-authored: cyclic movements plus a cued pass chain
// ---------------------------------------------------------------------------

const gestureMovements = (): Movement[] => [
  // A shuttle. V1's cyclic vocabulary, which has to survive.
  {
    id: 'mv-shuttle',
    target: { kind: 'player', team: 'home', playerId: 8 },
    path: [{ x: 44, y: 30 }, { x: 58, y: 24 }],
    cycle: 'out-and-back',
    repeats: 3,
    tempo: 'jog',
    delay: 0,
  },
  // A closed circuit, drawn with waypoints and closed by the recognizer.
  {
    id: 'mv-circuit',
    target: { kind: 'player', team: 'home', playerId: 10 },
    path: [
      { x: 46, y: 70 },
      { x: 58, y: 66 },
      { x: 58, y: 80 },
      { x: 46, y: 70 },
    ],
    cycle: 'loop',
    repeats: 2,
    tempo: 'jog',
    delay: 0.25,
  },
  // A run onto the through ball, tied to node 2 by the deprecated field.
  {
    id: 'mv-onto-pass',
    target: { kind: 'player', team: 'home', playerId: 9 },
    path: [{ x: 70, y: 50 }, { x: 84, y: 40 }],
    cycle: 'one-way',
    repeats: 1,
    tempo: 'sprint',
    delay: 0,
    syncToPassNode: 2,
  },
  // Sets off when the ball reaches the last man — a cue that lands past the chain.
  {
    id: 'mv-late',
    target: { kind: 'player', team: 'home', playerId: 7 },
    path: [{ x: 62, y: 14 }, { x: 80, y: 20 }],
    cycle: 'one-way',
    repeats: 1,
    tempo: 'run',
    delay: 0,
    cue: { node: 2, on: 'reaches' },
  },
];

export const gestureAuthoredTactic = (): V1Tactic => ({
  players: v1Players(),
  fieldSettings: v1FieldSettings(),
  animation: {
    durationMs: 6000,
    fps: 24,
    keyframes: [stubKeyframe(0), stubKeyframe(6000)],
    movements: gestureMovements(),
    passes: {
      closed: true,
      nodes: [
        // Starts at the keeper, who holds it before playing.
        { at: { x: 6, y: 50 }, receiver: { team: 'home', playerId: 1 }, holdMs: 700 },
        {
          at: { x: 16, y: 38 },
          via: 'pass',
          receiver: { team: 'home', playerId: 5 },
          travelMs: 900,
          holdMs: 400,
        },
        // Played into space — no receiver — which is what mv-onto-pass runs onto.
        { at: { x: 84, y: 40 }, via: 'pass', bend: [{ x: 54, y: 30 }], travelMs: 1500 },
      ],
    },
  },
});

/** Arrow-derived data that was *saved* as windowed movements plus a chain. */
export const windowedTactic = (): V1Tactic => ({
  players: v1Players(),
  fieldSettings: v1FieldSettings(),
  animation: {
    durationMs: 5000,
    fps: 24,
    resetStart: 0.8,
    keyframes: [stubKeyframe(0), stubKeyframe(5000)],
    movements: [
      {
        id: 'w1',
        target: { kind: 'player', team: 'home', playerId: 2 },
        path: [{ x: 22, y: 12 }, { x: 60, y: 10 }],
        cycle: 'one-way',
        repeats: 1,
        tempo: 'sprint',
        delay: 0,
        window: { start: 0, end: 0.4 },
      },
      {
        id: 'w2',
        target: { kind: 'player', team: 'home', playerId: 9 },
        path: [{ x: 70, y: 50 }, { x: 84, y: 44 }],
        cycle: 'one-way',
        repeats: 1,
        tempo: 'run',
        delay: 0,
        window: { start: 0.4, end: 0.8 },
      },
    ],
    passes: {
      closed: true,
      nodes: [
        { at: { x: 6, y: 50 } },
        { at: { x: 16, y: 38 }, via: 'pass', travelMs: 400 },
        { at: { x: 84, y: 44 }, via: 'pass', travelMs: 400 },
      ],
    },
  },
});

/** A legacy ball Movement, from before passes had their own type. */
export const legacyBallMovementTactic = (): V1Tactic => ({
  players: v1Players(),
  fieldSettings: v1FieldSettings(),
  animation: {
    durationMs: 5000,
    fps: 24,
    keyframes: [stubKeyframe(0), stubKeyframe(5000)],
    movements: [
      {
        id: 'mv-ball',
        target: { kind: 'ball' },
        path: [{ x: 6, y: 50 }, { x: 40, y: 30 }],
        cycle: 'out-and-back',
        repeats: 1,
        tempo: 'run',
        delay: 0,
      },
    ],
  },
});

/**
 * A tactic saved while paused mid-animation.
 *
 * `players` carries interpolated positions, but the movement paths say where the
 * player actually belongs. Reading `players` naively bakes the displacement in.
 */
export const pausedMidAnimationTactic = (): V1Tactic => ({
  players: v1Players().map(p => (p.id === 8 ? { ...p, x: 51, y: 27 } : p)),
  fieldSettings: v1FieldSettings(),
  animation: {
    durationMs: 5000,
    fps: 24,
    keyframes: [stubKeyframe(0), stubKeyframe(5000)],
    movements: [
      {
        id: 'mv-shuttle',
        target: { kind: 'player', team: 'home', playerId: 8 },
        path: [{ x: 44, y: 30 }, { x: 58, y: 24 }],
        cycle: 'out-and-back',
        repeats: 2,
        tempo: 'jog',
        delay: 0,
      },
    ],
  },
});

// ---------------------------------------------------------------------------
// 3. Preset: keyframes with no authoring source behind them
// ---------------------------------------------------------------------------

const movePlayers = (moves: Record<number, [number, number]>): Player[] =>
  v1Players().map(p => (moves[p.id] ? { ...p, x: moves[p.id][0], y: moves[p.id][1] } : p));

/**
 * Shaped after `animation-presets.ts`: labelled poses at 1600ms intervals, one of
 * which is a deliberate pause where nothing moves.
 */
export const presetTactic = (): V1Tactic => {
  const keyframes: Keyframe[] = [
    {
      id: 'k0',
      timeMs: 0,
      label: 'Goal-kick shape',
      players: v1Players(),
      fieldSettings: v1FieldSettings({ x: 6, y: 50 }),
    },
    {
      id: 'k1',
      timeMs: 1600,
      label: 'Keeper to centre-back',
      players: movePlayers({ 5: [18, 34] }),
      fieldSettings: v1FieldSettings({ x: 18, y: 34 }),
    },
    {
      // Nothing moves here: the preset holds the shape for a beat.
      id: 'k2',
      timeMs: 3200,
      label: 'Hold',
      players: movePlayers({ 5: [18, 34] }),
      fieldSettings: v1FieldSettings({ x: 18, y: 34 }),
    },
    {
      id: 'k3',
      timeMs: 4800,
      label: 'Centre-back into the pivot',
      players: movePlayers({ 5: [18, 34], 6: [40, 48] }),
      fieldSettings: v1FieldSettings({ x: 40, y: 48 }),
    },
  ];
  return {
    players: v1Players(),
    fieldSettings: v1FieldSettings(),
    animation: { durationMs: 4800, fps: 24, keyframes },
  };
};

/** `fromArrows` set *and* movements present — V1 played the arrows. */
export const bothSourcesTactic = (): V1Tactic => {
  const base = gestureAuthoredTactic();
  return {
    ...base,
    arrows: [
      {
        id: 'ar-only',
        type: 'direct-run',
        points: [{ x: 22, y: 12 }, { x: 60, y: 10 }],
        beat: 1,
        from: { team: 'home', playerId: 2 },
      },
    ],
    animation: { ...(base.animation as AnimationData), fromArrows: true },
  };
};

export const V1_FIXTURES: { name: string; tactic: () => V1Tactic }[] = [
  { name: 'static-diagram', tactic: staticDiagram },
  { name: 'arrow-driven', tactic: arrowDrivenTactic },
  { name: 'gesture-authored', tactic: gestureAuthoredTactic },
  { name: 'windowed', tactic: windowedTactic },
  { name: 'legacy-ball-movement', tactic: legacyBallMovementTactic },
  { name: 'paused-mid-animation', tactic: pausedMidAnimationTactic },
  { name: 'preset', tactic: presetTactic },
  { name: 'both-sources', tactic: bothSourcesTactic },
];
