/**
 * Pitch geometry, in the one place both the app and the compiler can see it.
 *
 * This used to live only in apps/web/src/utils/pitch.ts, which was fine while
 * nothing outside the browser needed distances. The V2 compiler derives *time*
 * from distance, so the same constants now have to be reachable from
 * packages/shared (and from the backend exporter, which imports this package by
 * name). apps/web/src/utils/pitch.ts re-exports everything here rather than
 * redefining it, so there is still exactly one definition.
 *
 * 622x350 is ~16:9, matching the 1920x1080 video / screenshot export frame.
 */
export const PITCH_LENGTH = 622;
export const PITCH_WIDTH = 350;

/**
 * Correction factor for distance maths done in percentage space: one percent of
 * length covers more ground than one percent of width, so the vertical axis must
 * be scaled before the two are compared.
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
 * so it is **dy** that carries the PITCH_X_SCALE factor, not dx. Use this rather
 * than hand-rolling the maths — percentage space is anisotropic here, so a raw
 * hypot over percentages over-weights the vertical axis by ~1.8x.
 */
export const pitchDistance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): number => Math.hypot(a.x - b.x, (a.y - b.y) * PITCH_X_SCALE);

/**
 * Real-world length of the pitch, used to convert football speeds in m/s into
 * the percent-of-pitch-length per second that the compiler actually walks.
 *
 * 105m is the FIFA standard. It is the *only* place real-world units enter the
 * system; everything else stays in percentage space.
 */
export const PITCH_LENGTH_METRES = 105;

/** Metres per second -> percent of pitch length per second. */
export const mpsToPctPerSecond = (mps: number): number =>
  (mps / PITCH_LENGTH_METRES) * 100;
