import React from "react";
import type { Movement, PassSequence } from "../../../../packages/shared";
import { LANDSCAPE, type PitchProjection } from "../utils/pitch";
import { zigzagPath } from "./ArrowOverlay";
import { BallGlyph } from "./BallMarker";

/** Stored percentage point -> SVG coords in whichever orientation is drawn. */
const toSvg = (p: { x: number; y: number }, projection: PitchProjection) =>
  ({ x: projection.toX(p), y: projection.toY(p) });

interface MovementOverlayProps {
  movements: Movement[];
  /** The passing move. Legs are drawn in order, so the chain reads as a sequence. */
  passes?: PassSequence;
  /** Points captured so far in the drag in progress, if any. */
  liveTrail?: { x: number; y: number }[];
  /** Hidden during playback — the markers themselves are showing the motion. */
  visible?: boolean;
  /** Called with the last node's position so the caller can host a drag handle. */
  onExtendFrom?: (pt: { x: number; y: number }) => void;
  /** Which way up the board is drawn. Defaults to landscape. */
  projection?: PitchProjection;
}

const RUN_STROKE = 'var(--pitch-lime, #c6f24e)';
const BALL_STROKE = 'var(--whistle-orange, #ff6b3d)';
const LIVE_STROKE = '#ffffff';

function toPoints(path: { x: number; y: number }[], projection: PitchProjection): string {
  return path.map(p => {
    const q = toSvg(p, projection);
    return `${q.x},${q.y}`;
  }).join(' ');
}

/**
 * Draws what each object will do, so a tactic reads as a diagram even when
 * paused. Purely presentational and non-interactive apart from the extend
 * handle — pointer events otherwise stay with the markers underneath so drawing
 * another gesture is never blocked.
 *
 * Leg strokes deliberately borrow the arrow vocabulary from ArrowOverlay: a
 * drawn dribble uses the same zigzag as a dribble arrow, so the two languages
 * don't diverge.
 */
const MovementOverlay: React.FC<MovementOverlayProps> = ({
  movements,
  passes,
  liveTrail,
  visible = true,
  onExtendFrom,
  projection = LANDSCAPE,
}) => {
  if (!visible) return null;

  const nodes = passes?.nodes ?? [];
  const closed = nodes.length > 1 && passes?.closed !== false;
  const lastNode = nodes.length > 1 ? nodes[nodes.length - 1] : undefined;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={projection.viewBox}
      style={{ pointerEvents: 'none', zIndex: 14 }}
    >
      <defs>
        <marker
          id="movement-arrow"
          viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="5" markerHeight="5" orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={RUN_STROKE} />
        </marker>
        <marker
          id="pass-arrow"
          viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="5" markerHeight="5" orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={BALL_STROKE} />
        </marker>
      </defs>

      {/* ---- Player runs ------------------------------------------------- */}
      {movements.map(m => {
        if (m.path.length < 2) return null;
        const isCircuit = m.cycle === 'loop';
        return (
          <g key={m.id}>
            <polyline
              points={toPoints(isCircuit ? [...m.path, m.path[0]] : m.path, projection)}
              fill="none"
              stroke={RUN_STROKE}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={m.repeats > 1 ? '8 5' : undefined}
              opacity={0.85}
              markerEnd={isCircuit ? undefined : 'url(#movement-arrow)'}
              markerStart={m.repeats > 1 ? 'url(#movement-arrow)' : undefined}
            />
            {m.repeats > 1 && (
              <text
                x={toSvg(m.path[m.path.length - 1], projection).x}
                y={toSvg(m.path[m.path.length - 1], projection).y - 8}
                textAnchor="middle" fontSize={13} fontWeight={800}
                fill={RUN_STROKE} stroke="#15140f" strokeWidth={0.6}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ×{m.repeats}
              </text>
            )}
          </g>
        );
      })}

      {/* ---- Pass legs, in order ----------------------------------------- */}
      {nodes.map((node, i) => {
        if (i === 0) return null;
        const from = nodes[i - 1].at;
        const pts = [from, ...(node.bend ?? []), node.at];
        const isDribble = node.via === 'dribble';

        return (
          <g key={`leg-${i}`}>
            {isDribble ? (
              // Same zigzag as a dribble arrow — the ball is being carried.
              <path
                d={zigzagPath(toSvg(from, projection).x, toSvg(from, projection).y, toSvg(node.at, projection).x, toSvg(node.at, projection).y, 6)}
                fill="none" stroke={BALL_STROKE} strokeWidth={2.6}
                strokeLinecap="round" opacity={0.9}
                markerEnd="url(#pass-arrow)"
              />
            ) : (
              <polyline
                points={toPoints(pts, projection)}
                fill="none" stroke={BALL_STROKE} strokeWidth={2.6}
                strokeDasharray="7 5" strokeLinecap="round" strokeLinejoin="round"
                opacity={0.9}
                markerEnd="url(#pass-arrow)"
              />
            )}

            {/* Order badge, so a chain reads as a sequence rather than a tangle.
                Numbered to match the panel's rows, which count the start node. */}
            <text
              x={toSvg(node.at, projection).x} y={toSvg(node.at, projection).y - 11}
              textAnchor="middle" fontSize={12} fontWeight={800}
              fill={BALL_STROKE} stroke="#15140f" strokeWidth={0.6}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {i + 1}
            </text>

            {/* A hold reads as the ball being kept, so it gets a ring */}
            {node.holdMs ? (
              <circle
                cx={toSvg(node.at, projection).x} cy={toSvg(node.at, projection).y} r={11}
                fill="none" stroke={BALL_STROKE} strokeWidth={1.6}
                strokeDasharray="2 3" opacity={0.8}
              />
            ) : null}
          </g>
        );
      })}

      {/* The chain recycles possession back to the start; muted so it reads as
          the reset rather than as another intentional pass. */}
      {closed && lastNode && (
        <polyline
          points={toPoints([lastNode.at, nodes[0].at], projection)}
          fill="none" stroke={BALL_STROKE} strokeWidth={2}
          strokeDasharray="3 6" opacity={0.35} strokeLinecap="round"
        />
      )}

      {/* ---- Ghost ball: a pass played into space ------------------------ */}
      {nodes.map((node, i) => {
        if (i === 0 || node.receiver || node.via === 'dribble') return null;
        // Nobody is on the end of this pass, so mark where the ball will arrive
        // — that is the target you drag a runner onto.
        return (
          <g
            key={`ghost-${i}`}
            transform={`translate(${toSvg(node.at, projection).x - 10}, ${toSvg(node.at, projection).y - 10}) scale(0.833)`}
            opacity={0.7}
          >
            <BallGlyph />
          </g>
        );
      })}

      {/* ---- Extend handle ----------------------------------------------- */}
      {lastNode && onExtendFrom && (
        <circle
          cx={toSvg(lastNode.at, projection).x} cy={toSvg(lastNode.at, projection).y} r={7}
          fill="var(--surface-container, #fbf5e9)" stroke="#15140f" strokeWidth={2}
          style={{ pointerEvents: 'auto', cursor: 'grab' }}
          onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onExtendFrom(lastNode.at); }}
        >
          <title>Drag to add the next pass</title>
        </circle>
      )}

      {liveTrail && liveTrail.length > 1 && (
        <polyline
          points={toPoints(liveTrail, projection)}
          fill="none" stroke={LIVE_STROKE} strokeWidth={2.5}
          strokeLinecap="round" strokeDasharray="5 4" opacity={0.9}
        />
      )}
    </svg>
  );
};

export default MovementOverlay;
