/**
 * Arrow geometry — the maths behind the eight annotation types, with no
 * rendering attached.
 *
 * This is the pure half of apps/web/src/components/ArrowOverlay.tsx, extracted so
 * the geometry can be tested and reused without dragging React in. The component
 * still has its own copy; folding it onto this one is the de-duplication step.
 *
 * Every function returns plain numbers or an SVG path `d` string, so nothing here
 * is tied to a particular renderer.
 */

import type { ArrowType } from './index';
import { PITCH_LENGTH } from './pitch-geometry';

export interface Pt {
  x: number;
  y: number;
}

/** The arrow types that describe what the *ball* does, as opposed to a player run. */
export const BALL_ARROW_TYPES: ArrowType[] = ['pass', 'dribble', 'long-ball', 'target-zone'];

export function defaultColor(type: ArrowType): string {
  return BALL_ARROW_TYPES.includes(type) ? '#fbbf24' : '#60a5fa';
}

/**
 * Visual radius of a player marker, in landscape SVG units (~40px diameter at
 * 0.88 scale on an ~800px-wide field works out to ≈13 units of 622).
 *
 * Arrows are clipped by this so they start and end at the edge of a marker
 * rather than under it.
 */
export const MARKER_RADIUS = 13;

/**
 * The same radius as a percentage of pitch length, for callers drawing in a
 * coordinate space that is not the landscape viewBox — the portrait board, most
 * obviously. Scale this into whichever space you are in rather than reusing the
 * raw unit count, which is only correct for the landscape canvas.
 */
export const MARKER_RADIUS_PCT = (MARKER_RADIUS / PITCH_LENGTH) * 100;

/** Offset a point along the direction (dx,dy) by r units. */
export function offsetAlongDir(x: number, y: number, dx: number, dy: number, r: number): Pt {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return { x, y };
  return { x: x + (dx / len) * r, y: y + (dy / len) * r };
}

export interface ClippedSegment {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
}

/** Clip start/end of a straight line inward by the marker radius. */
export function clipLine(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  clipEnd = true,
  radius = MARKER_RADIUS,
): ClippedSegment {
  const dx = bx - ax;
  const dy = by - ay;
  const s = offsetAlongDir(ax, ay, dx, dy, radius);
  const e = clipEnd ? offsetAlongDir(bx, by, -dx, -dy, radius) : { x: bx, y: by };
  return { sx: s.x, sy: s.y, ex: e.x, ey: e.y };
}

/**
 * Clip start/end of a quadratic bezier inward by the marker radius.
 * Start tangent is P0→ctrl, end tangent is ctrl→P2.
 */
export function clipCurve(
  ax: number,
  ay: number,
  cx: number,
  cy: number,
  bx: number,
  by: number,
  clipEnd = true,
  radius = MARKER_RADIUS,
): ClippedSegment {
  const s = offsetAlongDir(ax, ay, cx - ax, cy - ay, radius);
  const e = clipEnd ? offsetAlongDir(bx, by, cx - bx, cy - by, radius) : { x: bx, y: by };
  return { sx: s.x, sy: s.y, ex: e.x, ey: e.y };
}

/**
 * Zigzag path, used by dribble arrows and by drawn dribble movements so the two
 * share one stroke.
 */
export function zigzagPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  amplitude = 6,
  wavelength = 22,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return `M ${x1} ${y1}`;
  const nx = -dy / len;
  const ny = dx / len;
  const steps = Math.max(2, Math.round(len / wavelength));
  const parts = [`M ${x1} ${y1}`];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const sign = i % 2 === 1 ? 1 : -1;
    parts.push(
      `L ${(px + sign * nx * amplitude).toFixed(2)} ${(py + sign * ny * amplitude).toFixed(2)}`,
    );
  }
  parts.push(`L ${x2} ${y2}`);
  return parts.join(' ');
}

/**
 * Quadratic control point for a bowed arrow, offset 28% of the chord length
 * along the normal.
 *
 * Animated curved runs and lofted passes must bow exactly the way the drawn
 * arrow does, so both read this rather than each deriving their own curve.
 */
export function curveControl(x1: number, y1: number, x2: number, y2: number): { cx: number; cy: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return { cx: mx, cy: my };
  const nx = -dy / len;
  const ny = dx / len;
  return { cx: mx + nx * len * 0.28, cy: my + ny * len * 0.28 };
}

/**
 * Arrowhead as an explicit triangle, rather than an SVG `<marker>`.
 *
 * The overlay in apps/web uses `<marker orient="auto">`, which is fine in a
 * browser. This computes the triangle directly instead: it is a few lines, it has
 * no dependency on marker orientation support, and it makes the arrowhead's size
 * and spread explicit rather than buried in a `<defs>` block.
 *
 * `tipX/tipY` is where the arrow ends; `(fromX, fromY)` is any earlier point on
 * the path, used only to take the heading.
 */
export function arrowHeadPoints(
  tipX: number,
  tipY: number,
  fromX: number,
  fromY: number,
  size = 12,
  spread = 0.55,
): string {
  const dx = tipX - fromX;
  const dy = tipY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return `${tipX},${tipY}`;
  const ux = dx / len;
  const uy = dy / len;
  // Base of the triangle, one `size` back along the heading.
  const bx = tipX - ux * size;
  const by = tipY - uy * size;
  // Normal, scaled so `spread` controls how wide the head opens.
  const nx = -uy * size * spread;
  const ny = ux * size * spread;
  return `${tipX},${tipY} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`;
}

/**
 * Sample a quadratic bezier, so a caller can find a point just short of the tip
 * to take the arrowhead's heading from.
 */
export function quadraticAt(
  ax: number,
  ay: number,
  cx: number,
  cy: number,
  bx: number,
  by: number,
  t: number,
): Pt {
  const inv = 1 - t;
  return {
    x: inv * inv * ax + 2 * inv * t * cx + t * t * bx,
    y: inv * inv * ay + 2 * inv * t * cy + t * t * by,
  };
}
