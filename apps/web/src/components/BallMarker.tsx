import React from "react";
import type { Ball } from "../../../../packages/shared";

interface BallMarkerProps {
  ball: Ball;
  scale: number;
  isDragged: boolean;
  /** Set during animation playback so the positional CSS transition is dropped. */
  isAnimating?: boolean;
  editable?: boolean;
  onMouseDown?: () => void;
}

const BallMarker: React.FC<BallMarkerProps> = ({
  ball,
  scale,
  isDragged,
  isAnimating = false,
  editable = false,
  onMouseDown,
}) => {
  return (
    <div
      className={`absolute select-none ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      title="Ball"
      style={{
        left: `${ball.x}%`,
        top: `${ball.y}%`,
        zIndex: isDragged ? 50 : 12,
        transform: `translate(-50%, -50%) scale(${scale * (isDragged ? 1.15 : 1)})`,
        transformOrigin: "center",
        // See PlayerMarker: easing left/top while a per-frame loop drives them
        // makes the ball trail its own position.
        transition: isDragged || isAnimating
          ? "none"
          : "left 0.2s cubic-bezier(0.4, 0, 0.2, 1), top 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseDown={(e) => {
        if (!editable || !onMouseDown) return;
        e.preventDefault();
        e.stopPropagation();
        onMouseDown();
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        style={{
          borderRadius: "50%",
          // Brutalist shell to match player markers: hard outline + offset shadow
          boxShadow: isDragged
            ? '0 0 0 2px #15140f, 3px 3px 0 #15140f'
            : '0 0 0 2px #15140f, 2px 2px 0 #15140f',
        }}
      >
        {/* Classic football: white ball, black pentagon patches */}
        <circle cx="12" cy="12" r="12" fill="#fbf5e9" />
        <polygon points="12,8 15.8,10.8 14.3,15.2 9.7,15.2 8.2,10.8" fill="#15140f" />
        <polygon points="12,0 14.5,3.4 12,5.8 9.5,3.4" fill="#15140f" />
        <polygon points="23.4,8.3 22.6,12.6 19.6,13.3 18.4,9.6 21,7.2" fill="#15140f" />
        <polygon points="0.6,8.3 3,7.2 5.6,9.6 4.4,13.3 1.4,12.6" fill="#15140f" />
        <polygon points="18.6,21.9 15,23.6 13.6,19.9 16.6,17.4 19.5,19.3" fill="#15140f" />
        <polygon points="5.4,21.9 4.5,19.3 7.4,17.4 10.4,19.9 9,23.6" fill="#15140f" />
      </svg>
    </div>
  );
};

export default BallMarker;
