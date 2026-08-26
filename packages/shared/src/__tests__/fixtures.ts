import {
  BALL,
  playerActor,
  toActor,
  toPoint,
  type PositionMap,
  type TacticState,
} from "../tactic-v2";
import type { FieldSettings, Player } from "../index";

/**
 * Fixtures for the golden test.
 *
 * Written as football rather than as unit-test scaffolding on purpose: each one is
 * a move a coach would actually draw, so when a golden diff appears it is
 * legible as "the overlapping full-back now gets home 400ms earlier" rather than
 * as a wall of changed numbers.
 */

const H = (n: number) => playerActor('home', n);
const A = (n: number) => playerActor('away', n);

/** 4-3-3, in the 0-100 pct space where x runs goal-to-goal. */
const HOME_SHAPE: Record<number, { x: number; y: number }> = {
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

export const homeRoster = (): Player[] =>
  Object.entries(HOME_SHAPE).map(([id, at]) => ({
    id: Number(id),
    number: Number(id),
    name: `H${id}`,
    x: at.x,
    y: at.y,
  }));

export const awayRoster = (): Player[] =>
  Object.entries(HOME_SHAPE).map(([id, at]) => ({
    id: Number(id),
    number: Number(id),
    name: `A${id}`,
    // Mirrored, so an opposition player is never accidentally in the same place
    // as his home counterpart and a swapped-team bug would be visible.
    x: 100 - at.x,
    y: at.y,
  }));

export const fieldSettings = (): FieldSettings => ({
  fieldColor: '#2d7a3e',
  playerColor: '#ffffff',
  showPlayerLabels: true,
  markerType: 'circle',
  ball: { x: 6, y: 50 },
});

const homeBoard = (): PositionMap => {
  const board: PositionMap = {};
  for (const [id, at] of Object.entries(HOME_SHAPE)) board[H(Number(id))] = { ...at };
  return board;
};

/**
 * Build out from the back, overlap, cross, finish.
 *
 * The flagship fixture. Exercises, in one move: a hold before a pass, an
 * actor-bound destination, two simultaneous runs of wildly different lengths, a
 * `continuous` overlap that outlives three phases, a rendezvous solved by the
 * compiler, an auto-dribble, and a reset that has to wait for the overlap.
 */
export const buildUpAndCross = (): TacticState => ({
  schemaVersion: 2,
  initialBoard: { ...homeBoard(), [BALL]: { x: 6, y: 50 } },
  phases: [
    {
      id: 'p1',
      actions: [
        {
          // "He holds it, and as he plays it the full-back goes."
          id: 'a1-gk-pass',
          actorId: BALL,
          to: toActor(H(5)),
          speed: 'pass',
          holdMs: 800,
        },
        {
          // The overlap. Far longer than the phase it starts in, which is exactly
          // what `continuous` is for.
          id: 'a1-rb-overlap',
          actorId: H(2),
          to: toPoint({ x: 66, y: 8 }),
          speed: 'sprint',
          continuous: true,
        },
        {
          // Four units. In V1 this took the whole beat and rendered as slow motion.
          id: 'a1-cm-shift',
          actorId: H(6),
          to: toPoint({ x: 36, y: 53 }),
          speed: 'jog',
        },
      ],
    },
    {
      id: 'p2',
      actions: [
        {
          id: 'a2-cb-to-cm',
          actorId: BALL,
          to: toActor(H(6)),
          speed: 'driven',
        },
      ],
    },
    {
      id: 'p3',
      actions: [
        {
          id: 'a3-cross',
          actorId: BALL,
          to: toPoint({ x: 88, y: 40 }),
          speed: 'lofted',
          isLofted: true,
          via: [{ x: 64, y: 28 }],
        },
        {
          // The whole point of the constraint: the compiler solves for his speed
          // so he meets the cross, and keeps meeting it if the cross is redrawn.
          id: 'a3-st-attack',
          actorId: H(9),
          to: toPoint({ x: 88, y: 40 }),
          constraint: 'arrive-with-ball',
        },
      ],
    },
    {
      id: 'p4',
      actions: [
        {
          // No ball action here — he is on it, so the ball comes with him.
          id: 'a4-st-carry',
          actorId: H(9),
          to: toPoint({ x: 94, y: 46 }),
          speed: 'run',
        },
      ],
    },
  ],
});

/**
 * A shuttle and a closed circuit, with no ball.
 *
 * V1's cyclic vocabulary — `repeats` and `cycle: 'out-and-back' | 'loop'` — has to
 * survive the migration or every saved drill loses its motion. Both actions here
 * finish where they started, so the reset must be empty and the loop must seam
 * without one.
 */
export const shuttleAndCircuit = (): TacticState => ({
  schemaVersion: 2,
  initialBoard: { ...homeBoard(), [BALL]: { x: 50, y: 50 } },
  phases: [
    {
      id: 'p1',
      actions: [
        {
          id: 'a1-shuttle',
          actorId: H(8),
          to: toPoint({ x: 60, y: 30 }),
          speed: 'sprint',
          repeat: 3,
        },
        {
          id: 'a1-circuit',
          actorId: H(10),
          to: { kind: 'origin' },
          via: [
            { x: 58, y: 66 },
            { x: 58, y: 78 },
            { x: 44, y: 80 },
          ],
          speed: 'jog',
          repeat: 2,
        },
      ],
    },
  ],
});

/**
 * A rendezvous that cannot be made.
 *
 * The striker is 40-odd metres away and the pass is a five-metre square ball.
 * Physics has to win: he goes flat out and arrives late, and the compiler says so
 * rather than teleporting him.
 */
export const impossibleRendezvous = (): TacticState => ({
  schemaVersion: 2,
  initialBoard: {
    [H(6)]: { x: 38, y: 50 },
    [H(8)]: { x: 44, y: 30 },
    [H(9)]: { x: 20, y: 80 },
    [BALL]: { x: 38, y: 50 },
  },
  phases: [
    {
      id: 'p1',
      actions: [
        { id: 'a1-square', actorId: BALL, to: toActor(H(8)), speed: 'pass' },
        {
          id: 'a1-sprint',
          actorId: H(9),
          to: toPoint({ x: 46, y: 26 }),
          constraint: 'arrive-with-ball',
        },
      ],
    },
  ],
});

/** Opposition actors, to prove team namespacing keeps #7s apart. */
export const withOpposition = (): TacticState => ({
  schemaVersion: 2,
  initialBoard: {
    [H(7)]: { x: 62, y: 14 },
    [A(7)]: { x: 38, y: 14 },
    [BALL]: { x: 62, y: 14 },
  },
  phases: [
    {
      id: 'p1',
      actions: [
        { id: 'a1-home7', actorId: H(7), to: toPoint({ x: 80, y: 10 }), speed: 'sprint' },
        { id: 'a1-away7', actorId: A(7), to: toPoint({ x: 30, y: 30 }), speed: 'jog' },
      ],
    },
  ],
});

export const FIXTURES: { name: string; state: () => TacticState }[] = [
  { name: 'build-up-and-cross', state: buildUpAndCross },
  { name: 'shuttle-and-circuit', state: shuttleAndCircuit },
  { name: 'impossible-rendezvous', state: impossibleRendezvous },
  { name: 'with-opposition', state: withOpposition },
];
