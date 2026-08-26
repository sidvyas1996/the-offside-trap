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
  /**
   * Height, conveyed the only way a plan view can: the ball grows as it rises,
   * and its shadow stays on the ground and drifts, so the gap between them reads
   * as elevation. 0 leaves everything exactly as it was on the deck.
   */
  const lift = Math.max(0, Math.min(1, ball.lift ?? 0));
  const liftScale = 1 + lift * 0.45;
  // Shadow slides down-right of the ball, as if lit from up-field.
  const shadowOffset = lift * 9;

  return (
    <div
      className={`absolute select-none ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      title="Ball"
      style={{
        left: `${ball.x}%`,
        top: `${ball.y}%`,
        zIndex: isDragged ? 50 : lift > 0 ? 30 : 12,
        transform: `translate(-50%, -50%) scale(${scale * liftScale * (isDragged ? 1.15 : 1)})`,
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
      {/* Ground shadow. Separate from the ball so the two can come apart — that
          gap is what actually communicates height. Absent when flat, so nothing
          about the existing look changes. */}
      {lift > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 16,
            height: 8,
            marginLeft: -8,
            marginTop: -4,
            transform: `translate(${shadowOffset}px, ${shadowOffset}px) scale(${1 - lift * 0.25})`,
            borderRadius: '50%',
            background: 'rgba(21,20,15,0.42)',
            filter: `blur(${1 + lift * 2}px)`,
            zIndex: -1,
          }}
        />
      )}

      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        style={{
          borderRadius: "50%",
          // Brutalist shell to match player markers: hard outline + offset shadow.
          // The offset grows with height so the ball lifts off its own shadow.
          boxShadow: isDragged
            ? '0 0 0 2px #15140f, 3px 3px 0 #15140f'
            : `0 0 0 2px #15140f, ${2 + lift * 3}px ${2 + lift * 3}px 0 #15140f`,
        }}
      >
        <BallGlyph />
      </svg>
    </div>
  );
};

/**
 * The ball itself, as bare SVG children on a 0 0 24 24 viewBox.
 *
 * Pulled out so the ghost ball marking a pass into space is literally the same
 * ball at lower opacity, rather than a second hand-drawn one that would drift
 * out of step with this one.
 */
export const BallGlyph: React.FC = () => (
  <>
    {/* Classic football: white ball, black pentagon patches */}
    <circle cx="12" cy="12" r="12" fill="#fbf5e9" />
    <polygon points="12,8 15.8,10.8 14.3,15.2 9.7,15.2 8.2,10.8" fill="#15140f" />
    <polygon points="12,0 14.5,3.4 12,5.8 9.5,3.4" fill="#15140f" />
    <polygon points="23.4,8.3 22.6,12.6 19.6,13.3 18.4,9.6 21,7.2" fill="#15140f" />
    <polygon points="0.6,8.3 3,7.2 5.6,9.6 4.4,13.3 1.4,12.6" fill="#15140f" />
    <polygon points="18.6,21.9 15,23.6 13.6,19.9 16.6,17.4 19.5,19.3" fill="#15140f" />
    <polygon points="5.4,21.9 4.5,19.3 7.4,17.4 10.4,19.9 9,23.6" fill="#15140f" />
  </>
);

export default BallMarker;
