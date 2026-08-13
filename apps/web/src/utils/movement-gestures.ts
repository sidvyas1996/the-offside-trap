import type { Movement } from "../../../../packages/shared/src";
import { pitchDistance } from "./pitch";

/**
 * Turns a raw drag into a Movement.
 *
 * The whole point is that the gestures are ones people already make with their
 * hand when describing a pattern out loud: drag a player up the wing and they
 * run it; drag up and back down and they shuttle it; drag a circle and they
 * cycle it. Nothing here asks the user to name a shape — the shape is read off
 * the path.
 *
 * All thresholds are in "length-percent" units via pitchDistance (see pitch.ts),
 * so they behave the same horizontally and vertically despite the pitch being
 * 622x350.
 */

export interface Pt { x: number; y: number }

/** A sample from a live drag. `t` is a performance.now() reading. */
export interface TimedPt extends Pt { t?: number }

/**
 * A pause shorter than this is not intent. Everyone hesitates slightly between
 * grabbing a marker and moving it, and reading that as a delay would leave every
 * run mysteriously late.
 */
export const DWELL_MIN_MS = 250;

/** How still the cursor must be, in length-percent, to count as dwelling. */
const DWELL_RADIUS = 1.5;

/** Never let a dwell eat so much of the loop that nothing appears to happen. */
const MAX_DELAY_FRACTION = 0.75;

/**
 * Split a stationary run of samples off one end of the stream.
 *
 * Returns the dwell in milliseconds and the samples that remain. Untimed samples
 * yield a zero dwell, which is what keeps this a no-op for callers that don't
 * record time.
 */
export function splitDwell(
  samples: TimedPt[],
  end: 'start' | 'end',
): { dwellMs: number; rest: TimedPt[] } {
  if (samples.length < 2) return { dwellMs: 0, rest: samples };

  const anchor = end === 'start' ? samples[0] : samples[samples.length - 1];
  let count = 0;
  if (end === 'start') {
    while (count < samples.length - 1 && pitchDistance(samples[count], anchor) <= DWELL_RADIUS) count++;
  } else {
    while (count < samples.length - 1
      && pitchDistance(samples[samples.length - 1 - count], anchor) <= DWELL_RADIUS) count++;
  }
  if (count < 2) return { dwellMs: 0, rest: samples };

  const first = end === 'start' ? samples[0] : samples[samples.length - count];
  const last = end === 'start' ? samples[count - 1] : samples[samples.length - 1];
  const dwellMs = first.t !== undefined && last.t !== undefined ? Math.max(0, last.t - first.t) : 0;
  if (dwellMs < DWELL_MIN_MS) return { dwellMs: 0, rest: samples };

  // Keep the anchor point itself: for a player it is the resting position, and
  // for a pass leg it is where the ball starts.
  const rest = end === 'start'
    ? [samples[count - 1], ...samples.slice(count)]
    : [...samples.slice(0, samples.length - count), samples[samples.length - count]];

  return { dwellMs, rest: rest.length >= 2 ? rest : samples };
}

/** Elapsed time across a sample stream, or 0 when it isn't timed. */
export function elapsedMs(samples: TimedPt[]): number {
  if (samples.length < 2) return 0;
  const a = samples[0].t, b = samples[samples.length - 1].t;
  return a !== undefined && b !== undefined ? Math.max(0, b - a) : 0;
}

/**
 * Below this total path length a drag is a reposition, not a gesture — that
 * keeps the old behaviour (nudging a player into place) intact even with
 * Movement mode on, which matters because dragging already means something here.
 */
export const MIN_GESTURE_LENGTH = 8;

/** How close to path[0] a drag must end to count as having come back. */
const CLOSE_ENOUGH_TO_START = 6;

/** Ignore excursions smaller than this when counting reversals, so hand-wobble
 *  along the way doesn't read as an extra shuttle leg. */
const MIN_LEG_LENGTH = 5;

/** Ramer–Douglas–Peucker tolerance. Keeps genuine curvature, drops jitter. */
const SIMPLIFY_TOLERANCE = 1.2;

/** Perpendicular distance from p to the line ab, in length-percent units. */
function perpendicularDistance(p: Pt, a: Pt, b: Pt): number {
  const abLen = pitchDistance(a, b);
  if (abLen === 0) return pitchDistance(p, a);
  // Work in the isotropic frame so "perpendicular" means perpendicular on screen.
  const S = 350 / 622;
  const ax = a.x, ay = a.y * S;
  const bx = b.x, by = b.y * S;
  const px = p.x, py = p.y * S;
  const area = Math.abs((bx - ax) * (py - ay) - (by - ay) * (px - ax));
  return area / Math.hypot(bx - ax, by - ay);
}

/** Ramer–Douglas–Peucker polyline simplification. */
export function simplifyPath(points: Pt[], tolerance = SIMPLIFY_TOLERANCE): Pt[] {
  if (points.length < 3) return [...points];

  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) { maxDist = d; index = i; }
  }

  if (maxDist <= tolerance) return [first, last];

  const left = simplifyPath(points.slice(0, index + 1), tolerance);
  const right = simplifyPath(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

/** Total length walked along a polyline. */
export function pathLength(points: Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += pitchDistance(points[i], points[i - 1]);
  return total;
}

/**
 * How much ground the path encloses, normalised against its own length so the
 * measure is scale-free.
 *
 * This is what separates a circuit from an out-and-back: for any circle the
 * ratio is 1/(4*pi) ~= 0.08 regardless of radius, while a path that doubles back
 * along itself encloses essentially nothing. Reversal counting cannot make this
 * call — a circle reverses along its own start-to-far axis just like a shuttle
 * does.
 */
function areaRatio(points: Pt[]): number {
  const S = 350 / 622;
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    a += p.x * (q.y * S) - q.x * (p.y * S);
  }
  const area = Math.abs(a) / 2;
  const len = pathLength(points);
  return len === 0 ? 0 : area / (len * len);
}

/** Circle ~= 0.08; a there-and-back ~= 0. Half a circle's ratio is ample margin. */
const MIN_CIRCUIT_AREA_RATIO = 0.04;

/**
 * Count how many times the drag turned back on itself.
 *
 * Projects every sample onto the axis from the start to the furthest-reached
 * point, then counts sign changes in the direction of travel along that axis.
 * Legs shorter than MIN_LEG_LENGTH are absorbed rather than counted, so a shaky
 * hand doesn't inflate the shuttle count.
 */
export function countReversals(points: Pt[]): number {
  if (points.length < 3) return 0;

  const start = points[0];
  let far = points[1];
  let farDist = 0;
  for (const p of points) {
    const d = pitchDistance(p, start);
    if (d > farDist) { farDist = d; far = p; }
  }
  if (farDist === 0) return 0;

  // Unit axis start -> far, in the isotropic frame.
  const S = 350 / 622;
  const ax = (far.x - start.x) / farDist;
  const ay = ((far.y - start.y) * S) / farDist;
  const project = (p: Pt) => (p.x - start.x) * ax + (p.y - start.y) * S * ay;

  let reversals = 0;
  let dir = 0;                        // 0 until the first real leg, then ±1
  let extreme = project(points[0]);   // furthest point reached on the current leg

  for (let i = 1; i < points.length; i++) {
    const v = project(points[i]);
    const delta = v - extreme;

    // Holding `extreme` still while the direction is unknown is deliberate: a
    // slow creep outwards accumulates against it until it clears the threshold,
    // so gradual movement is still detected rather than lost step by step.
    if (dir === 0) {
      if (Math.abs(delta) >= MIN_LEG_LENGTH) { dir = Math.sign(delta); extreme = v; }
      continue;
    }

    if (Math.sign(delta) === dir) {
      extreme = v;                                  // still going the same way
    } else if (Math.abs(delta) >= MIN_LEG_LENGTH) {
      reversals++;                                  // turned back, and meant it
      dir = -dir;
      extreme = v;
    }
  }

  return reversals;
}

export interface RecognizeResult {
  /** null when the drag was too short to be a gesture — treat as a reposition. */
  movement: Omit<Movement, 'id' | 'target'> | null;
}

/**
 * Drop the drag timestamps before a path becomes part of a tactic.
 *
 * `t` is bookkeeping for dwell detection; persisting it would put meaningless
 * millisecond readings in the database and in every exported payload.
 */
const cleanPath = (pts: TimedPt[]): Pt[] => pts.map(p => ({ x: p.x, y: p.y }));

/**
 * Read a drag as a movement.
 *
 * Returns null for short drags so callers can fall through to plain
 * repositioning. `path[0]` is forced to the drag's own start point, which is the
 * object's resting position — the compiler relies on that.
 */
export function recognizeMovement(
  rawSamples: TimedPt[],
  opts: { durationMs?: number } = {},
): RecognizeResult {
  if (rawSamples.length < 2) return { movement: null };

  // Hold still before you set off and that becomes the delay. Stripping the
  // dwell cluster before shape recognition keeps a long pause from registering
  // as path length or as a direction change.
  const { dwellMs, rest: samples } = splitDwell(rawSamples, 'start');
  const delay = opts.durationMs && dwellMs > 0
    ? Math.max(0, Math.min(MAX_DELAY_FRACTION, dwellMs / opts.durationMs))
    : 0;

  if (samples.length < 2) return { movement: null };

  const simplified = simplifyPath(samples);
  const total = pathLength(simplified);
  if (total < MIN_GESTURE_LENGTH) return { movement: null };

  const start = simplified[0];
  const end = simplified[simplified.length - 1];
  const returnedHome = pitchDistance(end, start) <= CLOSE_ENOUGH_TO_START;

  // Count reversals on the RAW samples, never the simplified path. A shuttle is
  // collinear with itself, so every doubling-back has zero perpendicular
  // deviation and simplification erases exactly the evidence we need. The
  // simplified path is for geometry; the raw stream is for intent.
  const reversals = countReversals(samples);

  // A circuit: came back to where it started having actually enclosed ground.
  if (returnedHome && areaRatio(simplified) > MIN_CIRCUIT_AREA_RATIO) {
    // Drop the duplicated end point; the compiler closes the ring itself.
    const ring = simplified.slice(0, -1);
    return {
      movement: {
        path: cleanPath(ring.length >= 3 ? ring : simplified),
        cycle: 'loop',
        repeats: 1,
        tempo: 'run',
        delay,
      },
    };
  }

  // Otherwise it is an out-and-back. Its path is the outbound leg only — the
  // compiler retraces it — so trim everything after the furthest point reached.
  let farIdx = 0;
  let farDist = 0;
  for (let i = 0; i < simplified.length; i++) {
    const d = pitchDistance(simplified[i], start);
    if (d > farDist) { farDist = d; farIdx = i; }
  }
  const outbound = simplified.slice(0, farIdx + 1);

  // Each out-and-back pair is one shuttle leg. One reversal (out, back) is still
  // a single there-and-back; two or more means the user deliberately repeated it.
  const repeats = Math.max(1, Math.round((reversals + 1) / 2));

  return {
    movement: {
      path: cleanPath(outbound.length >= 2 ? outbound : [start, end]),
      cycle: 'out-and-back',
      repeats,
      tempo: 'run',
      delay,
    },
  };
}

export interface PassLegResult {
  /** Intermediate shape points, so a curled pass keeps its bend. Never empty-checked
   *  by callers — an empty array simply means a straight leg. */
  bend: Pt[];
  /** Where the leg ended. */
  to: Pt;
  /** Loop-independent: how long the ball waited before setting off, in ms. */
  holdBeforeMs: number;
  /** How long it waited on arrival, in ms. */
  holdAfterMs: number;
  /** How long the travel itself took, in ms. */
  travelMs: number;
}

/**
 * Read a ball drag as a single leg of a passing move.
 *
 * Much simpler than recognizeMovement: a pass has no cycle, no repeats and no
 * tempo — it happens once. All that matters is the shape it took, where it
 * ended, and the pauses either side of it.
 *
 * Returns null for a drag too short to be a pass, so callers fall through to
 * plain repositioning of the ball.
 */
export function recognizePassLeg(rawSamples: TimedPt[]): PassLegResult | null {
  if (rawSamples.length < 2) return null;

  const { dwellMs: holdBeforeMs, rest: afterLead } = splitDwell(rawSamples, 'start');
  const { dwellMs: holdAfterMs, rest: travelling } = splitDwell(afterLead, 'end');

  if (travelling.length < 2) return null;
  const simplified = simplifyPath(travelling);
  if (pathLength(simplified) < MIN_GESTURE_LENGTH) return null;

  return {
    bend: cleanPath(simplified.slice(1, -1)),
    to: { x: simplified[simplified.length - 1].x, y: simplified[simplified.length - 1].y },
    holdBeforeMs,
    holdAfterMs,
    travelMs: elapsedMs(travelling),
  };
}
