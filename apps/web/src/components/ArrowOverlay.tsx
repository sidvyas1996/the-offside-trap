import React from "react";
import type { TacticArrow, ArrowType } from "../../../../packages/shared";
import { PITCH_VIEWBOX, pctToSvgX, pctToSvgY } from "../utils/pitch";

// SVG coordinate space matches the field markings — see utils/pitch.ts
const toSvg = (p: { x: number; y: number }) => ({ x: pctToSvgX(p.x), y: pctToSvgY(p.y) });

// Visual radius of a player marker in SVG units (~40px diameter, 0.88 scale, on ~800px field → ≈13 SVG units)
const MARKER_RADIUS = 13;

// Offset a point along the direction (dx,dy) by r units
function offsetAlongDir(x: number, y: number, dx: number, dy: number, r: number) {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return { x, y };
  return { x: x + (dx / len) * r, y: y + (dy / len) * r };
}

// Clip start/end of a straight line inward by MARKER_RADIUS
function clipLine(ax: number, ay: number, bx: number, by: number, clipEnd = true) {
  const dx = bx - ax, dy = by - ay;
  const s = offsetAlongDir(ax, ay, dx, dy, MARKER_RADIUS);
  const e = clipEnd ? offsetAlongDir(bx, by, -dx, -dy, MARKER_RADIUS) : { x: bx, y: by };
  return { sx: s.x, sy: s.y, ex: e.x, ey: e.y };
}

// Clip start/end of a quadratic bezier inward by MARKER_RADIUS
// Start tangent: P0→ctrl, End tangent: ctrl→P2
function clipCurve(ax: number, ay: number, cx: number, cy: number, bx: number, by: number, clipEnd = true) {
  const s = offsetAlongDir(ax, ay, cx - ax, cy - ay, MARKER_RADIUS);
  const e = clipEnd ? offsetAlongDir(bx, by, cx - bx, cy - by, MARKER_RADIUS) : { x: bx, y: by };
  return { sx: s.x, sy: s.y, ex: e.x, ey: e.y };
}

export const BALL_ARROW_TYPES: ArrowType[] = ['pass', 'dribble', 'long-ball', 'target-zone'];

export function defaultColor(type: ArrowType): string {
  return BALL_ARROW_TYPES.includes(type) ? '#fbbf24' : '#60a5fa';
}

// Generate zigzag SVG path — amplitudes reduced 15%: 7→6, 9→7.6
// Exported so drawn dribble movements use the same stroke as dribble arrows.
export function zigzagPath(x1: number, y1: number, x2: number, y2: number, amplitude = 6, wavelength = 22): string {
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
    parts.push(`L ${(px + sign * nx * amplitude).toFixed(2)} ${(py + sign * ny * amplitude).toFixed(2)}`);
  }
  parts.push(`L ${x2} ${y2}`);
  return parts.join(' ');
}

// Exported so animated curved runs and lofted passes bow exactly the way the
// drawn arrow does — two sets of curve maths would visibly disagree.
export function curveControl(x1: number, y1: number, x2: number, y2: number) {
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

interface ArrowSvgProps {
  arrow: TacticArrow;
  onDelete?: (id: string) => void;
  isPreview?: boolean;
}

const ArrowSvg: React.FC<ArrowSvgProps> = ({ arrow, onDelete, isPreview }) => {
  const color = arrow.color || defaultColor(arrow.type);
  const markerId = `arrowhead-${arrow.id}`;
  const markerIdOpen = `arrowhead-open-${arrow.id}`;
  const opacity = isPreview ? 0.6 : 1;

  // --- target-zone (1-point marker) ---
  if (arrow.type === 'target-zone') {
    if (!arrow.points[0]) return null;
    const p = toSvg(arrow.points[0]);
    return (
      <g opacity={opacity} style={{ cursor: onDelete ? 'context-menu' : 'default' }}
         onContextMenu={onDelete ? (e) => { e.preventDefault(); onDelete(arrow.id); } : undefined}>
        <circle cx={p.x} cy={p.y} r={12} fill={`${color}22`} stroke={color} strokeWidth="1.3" strokeDasharray="3,2" />
        <line x1={p.x - 6} y1={p.y - 6} x2={p.x + 6} y2={p.y + 6} stroke={color} strokeWidth="2.1" strokeLinecap="round" />
        <line x1={p.x + 6} y1={p.y - 6} x2={p.x - 6} y2={p.y + 6} stroke={color} strokeWidth="2.1" strokeLinecap="round" />
        {onDelete && <circle cx={p.x} cy={p.y} r={16} fill="transparent"
          onContextMenu={(e) => { e.preventDefault(); onDelete(arrow.id); }} style={{ cursor: 'context-menu' }} />}
      </g>
    );
  }

  if (!arrow.points[0] || !arrow.points[1]) return null;
  const a = toSvg(arrow.points[0]);
  const b = toSvg(arrow.points[1]);
  const hit = onDelete ? { cursor: 'context-menu' as const } : {};

  const renderPath = () => {
    switch (arrow.type) {

      // — Ball: Pass — dashed + open arrowhead (sizes × 0.85)
      case 'pass': {
        const { sx, sy, ex, ey } = clipLine(a.x, a.y, b.x, b.y, !arrow.endsAtPlayer);
        return (
          <>
            <defs>
              <marker id={markerIdOpen} markerWidth="7.6" markerHeight="6" refX="6.8" refY="3" orient="auto">
                <polyline points="1 1, 6.8 3, 1 5" fill="none" stroke={color} strokeWidth="1.5" />
              </marker>
            </defs>
            <line x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={color} strokeWidth="1.7" strokeDasharray="8,4.5"
              markerEnd={`url(#${markerIdOpen})`} strokeLinecap="round" />
            {onDelete && <line x1={sx} y1={sy} x2={ex} y2={ey}
              stroke="transparent" strokeWidth="12" {...hit}
              onContextMenu={(e) => { e.preventDefault(); onDelete(arrow.id); }} />}
          </>
        );
      }

      // — Ball: Dribble — zigzag (amplitude 6)
      case 'dribble': {
        const { sx, sy, ex, ey } = clipLine(a.x, a.y, b.x, b.y, !arrow.endsAtPlayer);
        const d = zigzagPath(sx, sy, ex, ey, 6);
        return (
          <>
            <path d={d} stroke={color} strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {onDelete && <path d={d} stroke="transparent" strokeWidth="14" fill="none" {...hit}
              onContextMenu={(e) => { e.preventDefault(); onDelete(arrow.id); }} />}
          </>
        );
      }

      // — Ball: Long ball — curve + open arrowhead
      case 'long-ball': {
        const { cx, cy } = curveControl(a.x, a.y, b.x, b.y);
        const { sx, sy, ex, ey } = clipCurve(a.x, a.y, cx, cy, b.x, b.y, !arrow.endsAtPlayer);
        const pathD = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
        return (
          <>
            <defs>
              <marker id={markerIdOpen} markerWidth="7.6" markerHeight="6" refX="6.8" refY="3" orient="auto">
                <polyline points="1 1, 6.8 3, 1 5" fill="none" stroke={color} strokeWidth="1.5" />
              </marker>
            </defs>
            <path d={pathD} stroke={color} strokeWidth="2.1" fill="none"
              markerEnd={`url(#${markerIdOpen})`} strokeLinecap="round" />
            {onDelete && <path d={pathD} stroke="transparent" strokeWidth="14" fill="none" {...hit}
              onContextMenu={(e) => { e.preventDefault(); onDelete(arrow.id); }} />}
          </>
        );
      }

      // — Player: Direct run — thick solid + filled arrowhead
      case 'direct-run': {
        const { sx, sy, ex, ey } = clipLine(a.x, a.y, b.x, b.y);
        return (
          <>
            <defs>
              <marker id={markerId} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <line x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={color} strokeWidth="2.55"
              markerEnd={`url(#${markerId})`} strokeLinecap="round" />
            {onDelete && <line x1={sx} y1={sy} x2={ex} y2={ey}
              stroke="transparent" strokeWidth="14" {...hit}
              onContextMenu={(e) => { e.preventDefault(); onDelete(arrow.id); }} />}
          </>
        );
      }

      // — Player: Secondary run — dashed + filled arrowhead
      case 'secondary-run': {
        const { sx, sy, ex, ey } = clipLine(a.x, a.y, b.x, b.y);
        return (
          <>
            <defs>
              <marker id={markerId} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <line x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={color} strokeWidth="2.1" strokeDasharray="7,4.5"
              markerEnd={`url(#${markerId})`} strokeLinecap="round" />
            {onDelete && <line x1={sx} y1={sy} x2={ex} y2={ey}
              stroke="transparent" strokeWidth="14" {...hit}
              onContextMenu={(e) => { e.preventDefault(); onDelete(arrow.id); }} />}
          </>
        );
      }

      // — Player: Curved run — bezier + filled arrowhead
      case 'curved-run': {
        const { cx, cy } = curveControl(a.x, a.y, b.x, b.y);
        const { sx, sy, ex, ey } = clipCurve(a.x, a.y, cx, cy, b.x, b.y);
        const pathD = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
        return (
          <>
            <defs>
              <marker id={markerId} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <path d={pathD} stroke={color} strokeWidth="2.55" fill="none"
              markerEnd={`url(#${markerId})`} strokeLinecap="round" />
            {onDelete && <path d={pathD} stroke="transparent" strokeWidth="14" fill="none" {...hit}
              onContextMenu={(e) => { e.preventDefault(); onDelete(arrow.id); }} />}
          </>
        );
      }

      // — Player: Press run — zigzag (amplitude 7.6) + filled arrowhead
      case 'press-run': {
        const { sx, sy, ex, ey } = clipLine(a.x, a.y, b.x, b.y);
        const d = zigzagPath(sx, sy, ex, ey, 7.6, 20);
        return (
          <>
            <defs>
              <marker id={markerId} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill={color} />
              </marker>
            </defs>
            <path d={d} stroke={color} strokeWidth="2.1" fill="none"
              markerEnd={`url(#${markerId})`} strokeLinecap="round" strokeLinejoin="round" />
            {onDelete && <path d={d} stroke="transparent" strokeWidth="14" fill="none" {...hit}
              onContextMenu={(e) => { e.preventDefault(); onDelete(arrow.id); }} />}
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <g opacity={opacity} filter={isPreview ? undefined : 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))'}>
      {renderPath()}
    </g>
  );
};

/**
 * Beat badge at the tail of an arrow.
 *
 * Drawn on the pitch rather than only in the panel because the same number
 * appearing on two arrows is the clearest possible statement that they happen
 * together — that is the whole notation.
 */
const BeatBadge: React.FC<{ arrow: TacticArrow; color: string }> = ({ arrow, color }) => {
  const beat = Math.max(1, Math.floor(arrow.beat ?? 1));
  const at = arrow.points[0];
  if (!at) return null;
  const cx = pctToSvgX(at.x);
  const cy = pctToSvgY(at.y);
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={cx} cy={cy - 14} r={8} fill="#15140f" stroke={color} strokeWidth={1.5} />
      <text
        x={cx} y={cy - 14} textAnchor="middle" dominantBaseline="central"
        fontSize={10} fontWeight={800} fill={color}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {beat}
      </text>
    </g>
  );
};

interface ArrowOverlayProps {
  arrows: TacticArrow[];
  onDeleteArrow?: (id: string) => void;
  previewArrow?: TacticArrow | null;
  /** Show running order on the pitch. Off when arrows are just annotation. */
  showBeats?: boolean;
  /**
   * Draw this beat solid and dim the rest. Undefined shows every beat solid, which
   * is the flattened diagram — what the static image export renders.
   *
   * Dimming rather than hiding is deliberate: an arrow you cannot see is an arrow
   * you draw on top of, and the earlier beats are the context that makes the
   * current one make sense.
   */
  activeBeat?: number;
}

/** Matches the compiler and BeatList: an absent beat is beat 1. */
const beatOf = (a: TacticArrow) => Math.max(1, Math.floor(a.beat ?? 1));

const ArrowOverlay: React.FC<ArrowOverlayProps> = ({
  arrows,
  onDeleteArrow,
  previewArrow,
  showBeats,
  activeBeat,
}) => (
  <svg
    className="absolute inset-0 w-full h-full"
    viewBox={PITCH_VIEWBOX}
    style={{ zIndex: 20, pointerEvents: 'none', overflow: 'visible' }}
  >
    {arrows.map(arrow => {
      // A target marker belongs to no beat, so it is never ghosted.
      const dimmed =
        activeBeat !== undefined &&
        arrow.type !== 'target-zone' &&
        beatOf(arrow) !== activeBeat;
      return (
        <g key={arrow.id} opacity={dimmed ? 0.28 : 1}>
          <ArrowSvg arrow={arrow} onDelete={onDeleteArrow} />
          {showBeats && arrow.type !== 'target-zone' && arrow.points.length >= 2 && (
            <BeatBadge arrow={arrow} color={arrow.color || defaultColor(arrow.type)} />
          )}
        </g>
      );
    })}
    {previewArrow && <ArrowSvg key="preview" arrow={previewArrow} isPreview />}
  </svg>
);

export default ArrowOverlay;
