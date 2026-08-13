import type { AnimationData, FieldSettings, Keyframe, Player } from "../../../../packages/shared/src";

/**
 * One-click preset animations for common tactical patterns.
 *
 * Presets are declarative data, not imperative code. A preset defines a full
 * starting shape plus a list of phases, where each phase only lists the players
 * that actually move — so authoring "third man run" means naming the three
 * players involved, not retyping all eleven positions per phase.
 *
 * Positions are [x, y] in the same 0-100 pitch percentages the field uses (see
 * utils/pitch.ts). Home attacks left -> right, y=0 is the top touchline, so the
 * bottom of the pitch (high y) is the right flank.
 *
 * Players are addressed by their INDEX in the lineup array rather than by id, so
 * a preset keeps working on a loaded tactic whose ids differ from the defaults.
 * Index order follows utils/default-lineup-single.ts:
 *
 *   0 GK | 1 RB | 2 CB | 3 CB | 4 LB | 5 CM | 6 CM | 7 RW | 8 CAM | 9 LW | 10 ST
 */

/** [x, y] as 0-100 pitch percentages. */
export type Pos = readonly [number, number];

export interface PresetPhase {
  timeMs: number;
  /** Shown on the timeline scrubber chips and keyframe dot tooltips. */
  label: string;
  /** Sparse: player index (0-10) -> new position. Unlisted players hold station. */
  move?: Record<number, Pos>;
  /** Omit to leave the ball where the previous phase left it. */
  ball?: Pos;
}

export interface AnimationPreset {
  id: string;
  name: string;
  /** One-liner shown under the name in the picker. */
  description: string;
  /**
   * Must be one of AnimationTimeline's DURATION_OPTIONS — that <select> has no
   * custom entry, so an off-list duration would render blank.
   */
  durationMs: number;
  /** All eleven starting positions, in lineup array order. */
  start: readonly Pos[];
  startBall: Pos;
  /** Applied cumulatively in order; the first phase sits at timeMs 0. */
  phases: readonly PresetPhase[];
}

export const PRESET_PLAYER_COUNT = 11;

/**
 * Expand a preset into a complete AnimationData ready for `loadAnimation`.
 *
 * `currentPlayers` supplies identity: only x/y are overwritten, so names,
 * numbers, captaincy and cards survive. Keeping each player's own `id` matters
 * because the interpolator matches players across keyframes by id.
 *
 * Returns null when the lineup isn't a full eleven — the backend's zod schema
 * requires exactly that, so it's better to bail than to build invalid data.
 */
export function buildPresetAnimation(
  preset: AnimationPreset,
  currentPlayers: Player[],
  fieldSettings: FieldSettings,
  fps: number,
): AnimationData | null {
  if (currentPlayers.length !== PRESET_PLAYER_COUNT) return null;

  // Running state, carried forward and overwritten phase by phase.
  const positions: Pos[] = [...preset.start];
  let ball: Pos = preset.startBall;

  const keyframes: Keyframe[] = preset.phases.map(phase => {
    if (phase.move) {
      for (const [index, pos] of Object.entries(phase.move)) {
        positions[Number(index)] = pos;
      }
    }
    if (phase.ball) ball = phase.ball;

    return {
      id: crypto.randomUUID(),
      timeMs: phase.timeMs,
      label: phase.label,
      players: currentPlayers.map((player, i) => ({
        ...player,
        x: positions[i][0],
        y: positions[i][1],
      })),
      // The ball rides inside fieldSettings so it persists and animates too.
      fieldSettings: { ...fieldSettings, ball: { x: ball[0], y: ball[1] } },
      // Home team only — opposition is deliberately left untouched.
    };
  });

  return { durationMs: preset.durationMs, fps, keyframes };
}

/** Shared opening mid-block, used by both defensive shape presets. */
const MID_BLOCK: readonly Pos[] = [
  [10, 50],                                   // GK
  [28, 85], [28, 65], [28, 35], [28, 15],     // back four
  [45, 62], [45, 38],                         // central midfield
  [62, 80], [60, 50], [62, 20],               // RW, CAM, LW
  [72, 50],                                   // ST
];

const highLine: AnimationPreset = {
  id: 'high-line',
  name: 'High line',
  description: 'Back four step up to squeeze the pitch',
  durationMs: 5000,
  start: MID_BLOCK,
  startBall: [72, 50],
  phases: [
    { timeMs: 0, label: 'Mid block' },
    {
      timeMs: 2500,
      label: 'Line steps up',
      move: {
        0: [20, 50],
        1: [48, 82], 2: [48, 63], 3: [48, 37], 4: [48, 18],
        5: [62, 60], 6: [62, 40],
        7: [76, 80], 8: [74, 50], 9: [76, 20],
        10: [85, 50],
      },
      ball: [85, 50],
    },
    {
      timeMs: 5000,
      label: 'Compact and squeeze',
      move: {
        0: [24, 50],
        1: [55, 78], 2: [55, 60], 3: [55, 40], 4: [55, 22],
        5: [68, 58], 6: [68, 42],
        7: [82, 78], 8: [80, 50], 9: [82, 22],
        10: [90, 50],
      },
      ball: [90, 50],
    },
  ],
};

const lowBlock: AnimationPreset = {
  id: 'low-block',
  name: 'Low block',
  description: 'Drop into two compact banks',
  durationMs: 5000,
  start: MID_BLOCK,
  startBall: [45, 50],
  phases: [
    { timeMs: 0, label: 'Mid block' },
    {
      timeMs: 2500,
      label: 'Drop into two banks',
      // Wingers tuck in beside the midfielders to form a bank of four,
      // leaving the CAM and striker as a front two.
      move: {
        0: [6, 50],
        1: [14, 82], 2: [14, 64], 3: [14, 36], 4: [14, 18],
        7: [28, 78], 5: [28, 58], 6: [28, 42], 9: [28, 22],
        8: [45, 58], 10: [45, 42],
      },
      ball: [28, 50],
    },
    {
      timeMs: 5000,
      label: 'Deep and narrow',
      move: {
        0: [5, 50],
        1: [10, 76], 2: [10, 60], 3: [10, 40], 4: [10, 24],
        7: [20, 72], 5: [20, 56], 6: [20, 44], 9: [20, 28],
        8: [38, 56], 10: [38, 44],
      },
      ball: [18, 50],
    },
  ],
};

const buildUpFromTheBack: AnimationPreset = {
  id: 'build-up-from-the-back',
  name: 'Build-up from the back',
  description: 'Play out from the keeper through the pivot',
  durationMs: 8000,
  start: [
    [8, 50],                                  // GK
    [35, 88],                                 // RB pushed high
    [18, 64], [18, 36],                       // CBs split either side of the box
    [35, 12],                                 // LB pushed high
    [30, 50],                                 // CM dropping in as the pivot
    [48, 60],                                 // CM ahead of the pivot
    [62, 84],                                 // RW holding width
    [52, 40],                                 // CAM
    [62, 16],                                 // LW holding width
    [76, 50],                                 // ST
  ],
  startBall: [10, 50],
  phases: [
    { timeMs: 0, label: 'Goal-kick shape' },
    { timeMs: 1600, label: 'Keeper to centre-back', ball: [18, 64] },
    { timeMs: 3200, label: 'Centre-back into the pivot', ball: [30, 50] },
    {
      timeMs: 4800,
      label: 'Pivot switches wide',
      move: { 1: [45, 88] },
      ball: [45, 88],
    },
    {
      timeMs: 6400,
      label: 'Fullback finds the winger',
      move: { 7: [70, 86] },
      ball: [70, 86],
    },
    {
      timeMs: 8000,
      label: 'Team advances',
      // Whole block shifts upfield behind the ball.
      move: {
        0: [16, 50],
        1: [55, 88], 2: [28, 62], 3: [28, 38], 4: [46, 12],
        5: [40, 50], 6: [58, 58],
        7: [78, 84], 8: [64, 40], 9: [74, 16],
        10: [86, 52],
      },
      ball: [78, 80],
    },
  ],
};

const thirdManRun: AnimationPreset = {
  id: 'third-man-run',
  name: 'Third-man run',
  description: 'Bounce off the striker, third man runs beyond',
  durationMs: 5000,
  start: [
    [10, 50],                                 // GK
    [30, 85], [24, 63], [24, 37], [30, 15],   // back four
    [42, 62], [48, 45],                       // CM (idx 6 starts on the ball)
    [64, 82],                                 // RW
    [60, 55],                                 // CAM
    [62, 18],                                 // LW — the third man
    [76, 50],                                 // ST
  ],
  startBall: [48, 45],
  phases: [
    { timeMs: 0, label: 'Set up' },
    {
      timeMs: 1200,
      label: 'Pass into the striker',
      move: { 9: [70, 22] },                  // LW begins the run
      ball: [76, 50],
    },
    {
      timeMs: 2400,
      label: 'Lay-off to the third man',
      move: { 8: [62, 52], 9: [80, 26] },
      ball: [62, 52],
    },
    {
      timeMs: 3600,
      label: 'Through ball into space',
      move: { 9: [88, 22] },
      ball: [88, 20],
    },
    {
      timeMs: 5000,
      label: 'Attack the box',
      move: { 9: [90, 24], 10: [88, 48], 8: [72, 50] },
      ball: [90, 24],
    },
  ],
};

export const ANIMATION_PRESETS: readonly AnimationPreset[] = [
  highLine,
  lowBlock,
  buildUpFromTheBack,
  thirdManRun,
];
