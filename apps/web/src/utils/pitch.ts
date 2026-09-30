/**
 * Single source of truth for the tactics pitch geometry.
 *
 * The CSS aspect ratio, the SVG markings, the arrow overlay and the
 * field-of-view cones all share one coordinate space, so they must all be
 * derived from these constants rather than repeating the numbers.
 *
 * 622x350 is ~16:9, matching the 1920x1080 video / screenshot export frame.
 * The width (350) is deliberately unchanged from the original 550x350 board so
 * every marking keeps its real-world size — penalty boxes are a fixed 16.5m on
 * a real pitch regardless of its length, so the extra length becomes midfield
 * space. That is also what makes room for a full opposition team.
 */
// The constants and distance maths now live in packages/shared, because the V2
// compiler derives *time* from distance and runs outside the browser too. They are
// re-exported here so every existing `from "../utils/pitch"` import keeps working
// and there is still exactly one definition.
export {
  PITCH_LENGTH,
  PITCH_WIDTH,
  PITCH_X_SCALE,
  PITCH_LENGTH_METRES,
  pitchDistance,
  mpsToPctPerSecond,
} from "../../../../packages/shared/src/pitch-geometry";
import { PITCH_LENGTH, PITCH_WIDTH } from "../../../../packages/shared/src/pitch-geometry";
import { LANDSCAPE, PORTRAIT, type PitchProjection } from "../../../../packages/shared/src/pitch-view";

/**
 * Marks a board element as portrait-projected, so the pointer mapping can ask
 * the element which way up it is drawn instead of being told.
 *
 * The board is rendered in one place but its coordinates are read from several
 * (player drag, ball drag, gesture capture, arrow drawing), and those live in
 * hooks several layers away from the component that decides the orientation.
 * Threading a projection down every one of those chains means each is a place
 * to forget it — which is exactly what happened. Hanging it on the element
 * makes the rendered board the single source of truth.
 */
export const PITCH_ORIENTATION_ATTR = 'data-pitch-portrait';

/** Which projection a board element is currently drawn with. */
export function projectionOf(el: HTMLElement): PitchProjection {
  return el.getAttribute(PITCH_ORIENTATION_ATTR) === 'true' ? PORTRAIT : LANDSCAPE;
}

// The portrait board's projection lives in packages/shared so the compiler and
// the exporter can see it too; re-exported here for the same reason as above.
export {
  LANDSCAPE,
  PORTRAIT,
  PITCH_MARKINGS,
  PITCH_PORTRAIT_ASPECT,
  PITCH_PORTRAIT_VIEWBOX,
  PITCH_PORTRAIT_STRIPE_COUNT,
  projectMarking,
  arcPath,
  toPortraitPct,
  fromPortraitPct,
  type PitchProjection,
  type Marking,
} from "../../../../packages/shared/src/pitch-view";

/** Touchline inset inside the viewBox — the pitch surface bleeds past the lines. */
export const PITCH_MARGIN = 20;

export const PITCH_CENTRE_X = PITCH_LENGTH / 2;
export const PITCH_CENTRE_Y = PITCH_WIDTH / 2;
export const PITCH_INNER_LENGTH = PITCH_LENGTH - PITCH_MARGIN * 2;
export const PITCH_INNER_WIDTH = PITCH_WIDTH - PITCH_MARGIN * 2;

/** CSS `aspect-ratio` value; stays in lockstep with the viewBox by construction. */
export const PITCH_ASPECT = `${PITCH_LENGTH}/${PITCH_WIDTH}`;

/** SVG viewBox spanning the whole pitch. */
export const PITCH_VIEWBOX = `0 0 ${PITCH_LENGTH} ${PITCH_WIDTH}`;

/**
 * Players, ball and arrows are all stored as 0-100 percentages of the pitch.
 * This maps those into the SVG coordinate space above.
 */
export const pctToSvgX = (x: number) => (x / 100) * PITCH_LENGTH;
export const pctToSvgY = (y: number) => (y / 100) * PITCH_WIDTH;

/**
 * Marks how far (px) a board's draggable markers float above its surface.
 *
 * Read by the pointer mapping below, the same way the orientation attribute is:
 * the rendered board declares where its markers live, and every drag on it
 * lands on that plane without each caller having to know.
 */
export const MARKER_PLANE_ATTR = 'data-marker-plane-z';

/** Height of the element's marker plane in its own coordinates; 0 when they lie on the turf. */
export function markerPlaneZOf(el: HTMLElement): number {
  const z = Number(el.getAttribute(MARKER_PLANE_ATTR));
  return Number.isFinite(z) ? z : 0;
}

/**
 * Map a viewport point onto 0-100 pitch percentages.
 *
 * The board carries a live CSS transform (rotateX + rotateZ + scale) beneath a
 * parent `perspective`, so the only reliable way back to field coordinates is
 * to send the cursor's ray through that same camera and intersect it with the
 * plane the dragged thing actually sits on. Everything that turns a cursor into
 * a pitch position — player drag, ball drag, gesture capture — must go through
 * here; hand-rolling it means three copies that drift apart the moment the
 * board's transform changes.
 *
 * `planeZ` is that plane's height in the board's own space. The lineup board's
 * markers float above the grass, and under perspective a point up there lands
 * on screen a little outboard of the same point on the turf — intersecting the
 * turf instead left a grabbed marker sitting off the cursor and creeping as it
 * was dragged. Inverting the matrix alone had the same flaw: it ignores the
 * perspective divide, so its error grew towards the near and far edges.
 *
 * On the portrait board the element's own percentage space is *rotated* relative
 * to stored coordinates, so the projection's `fromPct` is applied on the way
 * out. Every caller therefore receives stored coords whichever way the board is
 * drawn, and nothing downstream — drag, gesture capture, save — has to know the
 * orientation.
 *
 * Both the projection and the plane default to whatever the board element
 * declares, so callers get this right by doing nothing.
 *
 * Returns null when the element isn't laid out yet or the ray misses the plane.
 */
export function clientToPitchPct(
  el: HTMLElement,
  clientX: number,
  clientY: number,
  projection: PitchProjection = projectionOf(el),
  planeZ: number = markerPlaneZOf(el),
): { x: number; y: number } | null {
  const parent = el.parentElement;
  if (!parent) return null;
  // A zero-sized field would divide by zero and hand back NaN, which then flows
  // into stored movements and passes as a permanently broken point. Happens
  // legitimately when the board hasn't been laid out yet or its container is
  // collapsed, so refuse rather than poison the data.
  if (el.offsetWidth === 0 || el.offsetHeight === 0) return null;

  const parentRect = parent.getBoundingClientRect();
  // Cursor relative to the perspective origin — the container's centre, which
  // the flex-centred board's own transform origin shares.
  const sx = clientX - parentRect.left - parentRect.width / 2;
  const sy = clientY - parentRect.top - parentRect.height / 2;

  const rawTransform = window.getComputedStyle(el).transform;
  const board = new DOMMatrix(rawTransform === 'none' ? undefined : rawTransform);
  // The parent's perspective is not part of the element's own matrix, so it is
  // rebuilt here as the camera: identity with m34 = -1/d. Without one it stays
  // identity and everything below collapses to the flat, affine case.
  const perspective = window.getComputedStyle(parent).perspective;
  const depth = perspective && perspective !== 'none' ? parseFloat(perspective) : 0;
  const camera = depth > 0
    ? new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / depth, 0, 0, 0, 1])
    : new DOMMatrix();
  const m = camera.multiply(board);

  // Find the (x, y) on the plane z = planeZ that projects to (sx, sy):
  //   X(x, y) = sx · W(x, y)   and   Y(x, y) = sy · W(x, y)
  // which, with the shared homogeneous W multiplied through, is a pair of
  // linear equations. DOMMatrix is column-major: X = m11·x + m21·y + m31·z + m41,
  // Y = m12·x + m22·y + m32·z + m42, W = m14·x + m24·y + m34·z + m44.
  const a1 = m.m11 - sx * m.m14;
  const b1 = m.m21 - sx * m.m24;
  const c1 = sx * (m.m34 * planeZ + m.m44) - (m.m31 * planeZ + m.m41);
  const a2 = m.m12 - sy * m.m14;
  const b2 = m.m22 - sy * m.m24;
  const c2 = sy * (m.m34 * planeZ + m.m44) - (m.m32 * planeZ + m.m42);
  const det = a1 * b2 - a2 * b1;
  // A degenerate camera (the board edge-on) has no single answer; refuse rather
  // than hand back a point at infinity.
  if (!Number.isFinite(det) || Math.abs(det) < 1e-9) return null;
  const px = (c1 * b2 - c2 * b1) / det;
  const py = (a1 * c2 - a2 * c1) / det;

  // The field is flex-centred in its container so the centres coincide, but the
  // field's own layout size is the correct divisor — the container's height can
  // differ from the field's.
  const x = ((px + el.offsetWidth / 2) / el.offsetWidth) * 100;
  const y = ((py + el.offsetHeight / 2) / el.offsetHeight) * 100;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  // Clamp in the *board's* space, before un-rotating: the clamp is what keeps a
  // drag inside the visible pitch, and the visible pitch is the element. Doing
  // it after the projection would clamp the wrong pair of axes in portrait.
  return projection.fromPct({
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  });
}

/**
 * Mown stripes, as a CSS `repeating-linear-gradient` stop percentage.
 * 12 bands keeps each stripe close to square at this pitch length, and divides
 * evenly so there is no clipped stripe at the touchline.
 */
export const PITCH_STRIPE_COUNT = 12;
export const PITCH_STRIPE_PCT = 100 / PITCH_STRIPE_COUNT;
