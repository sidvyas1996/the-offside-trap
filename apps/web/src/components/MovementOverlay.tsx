import React from "react";
import type { Movement } from "../../../../packages/shared";
import { PITCH_VIEWBOX, pctToSvgX, pctToSvgY } from "../utils/pitch";

interface MovementOverlayProps {
  movements: Movement[];
  /** Points captured so far in the drag in progress, if any. */
  liveTrail?: { x: number; y: number }[];
  /** Hidden during playback — the markers themselves are showing the motion. */
  visible?: boolean;
}

/** Out-and-back paths get arrowheads at both ends; a circuit gets one mid-path. */
const STROKE = 'var(--pitch-lime, #c6f24e)';
const LIVE_STROKE = '#ffffff';

function toPoints(path: { x: number; y: number }[]): string {
  return path.map(p => `${pctToSvgX(p.x)},${pctToSvgY(p.y)}`).join(' ');
}

/**
 * Draws the movement each object will make, so a tactic reads as a diagram even
 * when paused. Purely presentational and non-interactive — pointer events stay
 * with the markers underneath so drawing another gesture is never blocked.
 */
const MovementOverlay: React.FC<MovementOverlayProps> = ({
  movements,
  liveTrail,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={PITCH_VIEWBOX}
      style={{ pointerEvents: 'none', zIndex: 14 }}
    >
      <defs>
        <marker
          id="movement-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={STROKE} />
        </marker>
      </defs>

      {movements.map(m => {
        if (m.path.length < 2) return null;
        const isCircuit = m.cycle === 'loop';
        return (
          <g key={m.id}>
            <polyline
              points={toPoints(isCircuit ? [...m.path, m.path[0]] : m.path)}
              fill="none"
              stroke={STROKE}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={m.repeats > 1 ? '8 5' : undefined}
              opacity={0.85}
              markerEnd={isCircuit ? undefined : 'url(#movement-arrow)'}
              markerStart={m.repeats > 1 ? 'url(#movement-arrow)' : undefined}
            />
            {/* Shuttle count, parked at the far end of the run */}
            {m.repeats > 1 && (
              <text
                x={pctToSvgX(m.path[m.path.length - 1].x)}
                y={pctToSvgY(m.path[m.path.length - 1].y) - 8}
                textAnchor="middle"
                fontSize={13}
                fontWeight={800}
                fill={STROKE}
                stroke="#15140f"
                strokeWidth={0.6}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ×{m.repeats}
              </text>
            )}
          </g>
        );
      })}

      {liveTrail && liveTrail.length > 1 && (
        <polyline
          points={toPoints(liveTrail)}
          fill="none"
          stroke={LIVE_STROKE}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="5 4"
          opacity={0.9}
        />
      )}
    </svg>
  );
};

export default MovementOverlay;
