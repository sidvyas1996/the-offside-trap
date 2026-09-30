import React, { useCallback, useRef } from "react";

interface RotationDialProps {
  /** Continuous bearing, not wrapped to 0-359 — see `shortestWay`. */
  rotation: number;
  onChange: (angle: number) => void;
}

/** Bearing as it reads on the face: 0-359. */
const bearing = (angle: number) => ((angle % 360) + 360) % 360;

/**
 * Shortest signed way round from one angle to a 0-359 bearing, in (-180, 180].
 *
 * The dial reports where the pointer is, which is always 0-359, so crossing the
 * top of the face would hand back 359 -> 0. CSS reads that as a full turn
 * backwards and animates the whole way round. Accumulating the short delta onto
 * the running value instead keeps the number continuous — 359 -> 360 — so the
 * board only ever moves the degree it looks like it should.
 */
const shortestWay = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;

/** Circular drag-dial for camera rotation — drag, or focus + arrow keys. */
const RotationDial: React.FC<RotationDialProps> = ({ rotation, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pointTo = useCallback(
    (clientX: number, clientY: number) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
      onChange(rotation + shortestWay(rotation, bearing(Math.round(deg))));
    },
    [onChange, rotation],
  );

  return (
    <div
      ref={ref}
      className="tool-dial"
      role="slider"
      tabIndex={0}
      aria-label="Rotate pitch"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(bearing(rotation))}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        pointTo(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        pointTo(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onChange(rotation - 15);
        if (e.key === "ArrowRight") onChange(rotation + 15);
      }}
    >
      <span className="tool-dial-ring" aria-hidden="true" />
      <span className="tool-dial-needle" style={{ rotate: `${rotation}deg` }} aria-hidden="true" />
      <span className="tool-dial-value">{Math.round(bearing(rotation))}°</span>
    </div>
  );
};

export default RotationDial;
