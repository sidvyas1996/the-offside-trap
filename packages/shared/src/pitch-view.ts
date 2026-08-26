/**
 * Pitch *view* geometry — how the 0-100 percentage space is projected onto an
 * SVG canvas.
 *
 * pitch-geometry.ts owns the physical facts (how long a pitch is, how far apart
 * two points are). This module owns the drawing: viewBoxes, margins, the mown
 * stripes, and the percentage-to-SVG mapping.
 *
 * The landscape constants mirror apps/web/src/utils/pitch.ts, minus its
 * `clientToPitchPct` — that one reads `getBoundingClientRect` and a computed
 * `DOMMatrix`, so it is browser-only and stays in the web app.
 *
 * The portrait projection exists for tall, narrow viewports, where running the
 * pitch up the screen beats letterboxing a wide board into a strip. Stored
 * coordinates are unchanged — portrait is purely a render-time projection, so the
 * same tactic renders correctly either way and nothing has to be migrated.
 *
 * Currently unused: it was written for a mobile client that has since been
 * removed, and is kept because a responsive web layout needs exactly this.
 */

import { PITCH_LENGTH, PITCH_WIDTH } from './pitch-geometry';

/** Touchline inset inside the viewBox — the pitch surface bleeds past the lines. */
export const PITCH_MARGIN = 20;

export const PITCH_CENTRE_X = PITCH_LENGTH / 2;
export const PITCH_CENTRE_Y = PITCH_WIDTH / 2;
export const PITCH_INNER_LENGTH = PITCH_LENGTH - PITCH_MARGIN * 2;
export const PITCH_INNER_WIDTH = PITCH_WIDTH - PITCH_MARGIN * 2;

/** CSS `aspect-ratio` value; stays in lockstep with the viewBox by construction. */
export const PITCH_ASPECT = `${PITCH_LENGTH}/${PITCH_WIDTH}`;

/** SVG viewBox spanning the whole pitch, lengthwise. */
export const PITCH_VIEWBOX = `0 0 ${PITCH_LENGTH} ${PITCH_WIDTH}`;

/**
 * Players, ball and arrows are all stored as 0-100 percentages of the pitch.
 * This maps those into the landscape SVG coordinate space above.
 */
export const pctToSvgX = (x: number): number => (x / 100) * PITCH_LENGTH;
export const pctToSvgY = (y: number): number => (y / 100) * PITCH_WIDTH;

/**
 * Mown stripes. 12 bands keeps each stripe close to square at this pitch length,
 * and divides evenly so there is no clipped stripe at the touchline.
 */
export const PITCH_STRIPE_COUNT = 12;
export const PITCH_STRIPE_PCT = 100 / PITCH_STRIPE_COUNT;

// ---------------------------------------------------------------------------
// Portrait projection
// ---------------------------------------------------------------------------

/**
 * The portrait board swaps the axes: pitch *width* runs across the screen and
 * pitch *length* runs up it. The numbers are the same two constants, so a change
 * to the pitch size still only has to be made once.
 */
export const PITCH_PORTRAIT_VIEWBOX = `0 0 ${PITCH_WIDTH} ${PITCH_LENGTH}`;
export const PITCH_PORTRAIT_ASPECT = `${PITCH_WIDTH}/${PITCH_LENGTH}`;

/**
 * Project a stored percentage onto the portrait canvas.
 *
 * Stored `x` runs left-to-right along the pitch toward the opposition goal;
 * on a portrait board that direction is *up the screen*, so it is flipped
 * (`100 - x`). Stored `y` runs across the pitch and becomes the horizontal axis
 * unchanged. Attacking therefore reads upward, which is what a coach drawing on
 * a phone expects.
 */
export const pctToPortraitX = (y: number): number => (y / 100) * PITCH_WIDTH;
export const pctToPortraitY = (x: number): number => ((100 - x) / 100) * PITCH_LENGTH;

/** The same projection, kept in percentage space — for absolutely-positioned markers. */
export const toPortraitPct = (p: { x: number; y: number }): { x: number; y: number } => ({
  x: p.y,
  y: 100 - p.x,
});

/** Portrait fewer, taller bands — matches the four the design draws. */
export const PITCH_PORTRAIT_STRIPE_COUNT = 8;

/**
 * One projection object, so a renderer can be written once and told which way up
 * it is drawing rather than branching on every coordinate.
 */
export interface PitchProjection {
  viewBox: string;
  /** Extent of the SVG canvas, for sizing markings. */
  width: number;
  height: number;
  stripeCount: number;
  /** Whether stripes run across the short axis (portrait) or the long one. */
  stripesHorizontal: boolean;
  toX: (p: { x: number; y: number }) => number;
  toY: (p: { x: number; y: number }) => number;
}

// ---------------------------------------------------------------------------
// Pitch markings
// ---------------------------------------------------------------------------

/**
 * The lines on the pitch, as data.
 *
 * Declared once in **landscape** coordinates — the same numbers
 * apps/web/src/components/FootballField.tsx draws inline — and transposed for a
 * portrait board by `projectMarking`. Keeping them as data rather than JSX means
 * the markings can be rendered, measured or tested without a component, and
 * guarantees the two orientations cannot drift apart.
 *
 * Box dimensions are fixed real-world sizes: a penalty area is 16.5m deep
 * whatever the length of the pitch, so these do not scale with PITCH_LENGTH.
 */
export type Marking =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'dot'; cx: number; cy: number; r: number }
  | { kind: 'arc'; x1: number; y1: number; x2: number; y2: number; r: number; sweep: 0 | 1 };

const BOX_DEPTH = 70;
const BOX_WIDTH = 170;
const GOAL_AREA_DEPTH = 30;
const GOAL_AREA_WIDTH = 80;
const FAR = PITCH_LENGTH - PITCH_MARGIN;

export const PITCH_MARKINGS: Marking[] = [
  // Touchlines and goal lines.
  { kind: 'rect', x: PITCH_MARGIN, y: PITCH_MARGIN, w: PITCH_INNER_LENGTH, h: PITCH_INNER_WIDTH },
  // Halfway line and centre circle.
  { kind: 'line', x1: PITCH_CENTRE_X, y1: PITCH_MARGIN, x2: PITCH_CENTRE_X, y2: PITCH_WIDTH - PITCH_MARGIN },
  { kind: 'circle', cx: PITCH_CENTRE_X, cy: PITCH_CENTRE_Y, r: 40 },
  { kind: 'dot', cx: PITCH_CENTRE_X, cy: PITCH_CENTRE_Y, r: 3 },
  // Penalty areas.
  { kind: 'rect', x: PITCH_MARGIN, y: 90, w: BOX_DEPTH, h: BOX_WIDTH },
  { kind: 'rect', x: FAR - BOX_DEPTH, y: 90, w: BOX_DEPTH, h: BOX_WIDTH },
  // Six-yard boxes.
  { kind: 'rect', x: PITCH_MARGIN, y: 135, w: GOAL_AREA_DEPTH, h: GOAL_AREA_WIDTH },
  { kind: 'rect', x: FAR - GOAL_AREA_DEPTH, y: 135, w: GOAL_AREA_DEPTH, h: GOAL_AREA_WIDTH },
  // Penalty spots.
  { kind: 'dot', cx: PITCH_MARGIN + 45, cy: PITCH_CENTRE_Y, r: 3 },
  { kind: 'dot', cx: FAR - 45, cy: PITCH_CENTRE_Y, r: 3 },
  // The D at the edge of each penalty area.
  { kind: 'arc', x1: PITCH_MARGIN + BOX_DEPTH, y1: 155, x2: PITCH_MARGIN + BOX_DEPTH, y2: 195, r: 30, sweep: 1 },
  { kind: 'arc', x1: FAR - BOX_DEPTH, y1: 155, x2: FAR - BOX_DEPTH, y2: 195, r: 30, sweep: 0 },
];

/**
 * Transpose a marking for the portrait board.
 *
 * The projection is a quarter turn: landscape `y` becomes portrait `x`, and
 * landscape `x` becomes portrait `y` measured from the far end. A rect therefore
 * swaps its width and height, and an arc reverses its sweep flag because the
 * turn mirrors the handedness.
 */
export function projectMarking(m: Marking, portrait: boolean): Marking {
  if (!portrait) return m;
  const L = PITCH_LENGTH;
  switch (m.kind) {
    case 'rect':
      return { kind: 'rect', x: m.y, y: L - m.x - m.w, w: m.h, h: m.w };
    case 'line':
      return { kind: 'line', x1: m.y1, y1: L - m.x1, x2: m.y2, y2: L - m.x2 };
    case 'circle':
    case 'dot':
      return { kind: m.kind, cx: m.cy, cy: L - m.cx, r: m.r };
    case 'arc':
      return {
        kind: 'arc',
        x1: m.y1,
        y1: L - m.x1,
        x2: m.y2,
        y2: L - m.x2,
        r: m.r,
        sweep: m.sweep === 1 ? 0 : 1,
      };
  }
}

/** An arc marking as an SVG path `d` string. */
export const arcPath = (m: Extract<Marking, { kind: 'arc' }>): string =>
  `M ${m.x1} ${m.y1} A ${m.r} ${m.r} 0 0 ${m.sweep} ${m.x2} ${m.y2}`;

export const LANDSCAPE: PitchProjection = {
  viewBox: PITCH_VIEWBOX,
  width: PITCH_LENGTH,
  height: PITCH_WIDTH,
  stripeCount: PITCH_STRIPE_COUNT,
  stripesHorizontal: false,
  toX: (p) => pctToSvgX(p.x),
  toY: (p) => pctToSvgY(p.y),
};

export const PORTRAIT: PitchProjection = {
  viewBox: PITCH_PORTRAIT_VIEWBOX,
  width: PITCH_WIDTH,
  height: PITCH_LENGTH,
  stripeCount: PITCH_PORTRAIT_STRIPE_COUNT,
  stripesHorizontal: true,
  toX: (p) => pctToPortraitX(p.y),
  toY: (p) => pctToPortraitY(p.x),
};
