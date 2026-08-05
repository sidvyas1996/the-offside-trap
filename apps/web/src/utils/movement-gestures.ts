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
 * Read a drag as a movement.
 *
 * Returns null for short drags so callers can fall through to plain
 * repositioning. `path[0]` is forced to the drag's own start point, which is the
 * object's resting position — the compiler relies on that.
 */
export function recognizeMovement(samples: Pt[]): RecognizeResult {
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
        path: ring.length >= 3 ? ring : simplified,
        cycle: 'loop',
        repeats: 1,
        tempo: 'run',
        delay: 0,
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
      path: outbound.length >= 2 ? outbound : [start, end],
      cycle: 'out-and-back',
      repeats,
      tempo: 'run',
      delay: 0,
    },
  };
}
