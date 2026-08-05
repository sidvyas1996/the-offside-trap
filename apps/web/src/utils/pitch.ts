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
export const PITCH_LENGTH = 622;
export const PITCH_WIDTH = 350;

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
 * Correction factor for distance maths done in percentage space: one percent of
 * length covers more ground than one percent of width, so x must be scaled
 * before comparing the two (used for arrow snapping).
 */
export const PITCH_X_SCALE = PITCH_WIDTH / PITCH_LENGTH;

/**
 * Distance between two points held in 0-100 percentage coords, expressed in
 * units of pitch *length* percent, so it is proportional to real on-screen
 * distance.
 *
 * Derivation: separation on screen is
 *   sqrt((dx/100 * LENGTH)^2 + (dy/100 * WIDTH)^2)
 *   = (LENGTH/100) * sqrt(dx^2 + (dy * WIDTH/LENGTH)^2)
 * so it is **dy** that carries the PITCH_X_SCALE factor, not dx. Use this
 * rather than hand-rolling the maths — percentage space is anisotropic here
 * (the pitch is 622x350), so a raw hypot over percentages over-weights the
 * vertical axis by ~1.8x.
 */
export const pitchDistance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): number => Math.hypot(a.x - b.x, (a.y - b.y) * PITCH_X_SCALE);

/**
 * Map a viewport point onto 0-100 pitch percentages.
 *
 * The board carries a live CSS transform (rotateX + rotateZ + scale), so the
 * only reliable way back to field coordinates is to read the computed matrix and
 * invert it. Everything that turns a cursor into a pitch position — player drag,
 * ball drag, gesture capture — must go through here; hand-rolling it means three
 * copies that drift apart the moment the board's transform changes.
 *
 * Returns null when the element isn't laid out yet.
 */
export function clientToPitchPct(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const parent = el.parentElement;
  if (!parent) return null;

  const parentRect = parent.getBoundingClientRect();
  // Offset of the cursor from the perspective container's centre.
  const localX = clientX - parentRect.left - parentRect.width / 2;
  const localY = clientY - parentRect.top - parentRect.height / 2;

  const rawTransform = window.getComputedStyle(el).transform;
  const matrix = new DOMMatrix(rawTransform === 'none' ? undefined : rawTransform);
  const pt = matrix.inverse().transformPoint(new DOMPoint(localX, localY, 0, 1));

  // The field is flex-centred in its container so the centres coincide, but the
  // field's own layout size is the correct divisor — the container's height can
  // differ from the field's.
  const x = ((pt.x + el.offsetWidth / 2) / el.offsetWidth) * 100;
  const y = ((pt.y + el.offsetHeight / 2) / el.offsetHeight) * 100;

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

/**
 * Mown stripes, as a CSS `repeating-linear-gradient` stop percentage.
 * 12 bands keeps each stripe close to square at this pitch length, and divides
 * evenly so there is no clipped stripe at the touchline.
 */
export const PITCH_STRIPE_COUNT = 12;
export const PITCH_STRIPE_PCT = 100 / PITCH_STRIPE_COUNT;
