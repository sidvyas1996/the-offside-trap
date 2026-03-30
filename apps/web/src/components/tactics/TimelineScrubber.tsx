import React, { useRef, useCallback } from "react";
import type { Keyframe } from "../../../../../packages/shared/src";
import { X } from "lucide-react";

interface TimelineScrubberProps {
  keyframes: Keyframe[];
  currentTimeMs: number;
  durationMs: number;
  onSeek: (timeMs: number) => void;
  onRemoveKeyframe: (id: string) => void;
  onUpdateKeyframeTime: (id: string, timeMs: number) => void;
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  keyframes,
  currentTimeMs,
  durationMs,
  onSeek,
  onRemoveKeyframe,
  onUpdateKeyframeTime,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingKfRef = useRef<string | null>(null);

  const posToTime = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * durationMs);
    },
    [durationMs]
  );

  const handleTrackClick = (e: React.MouseEvent) => {
    if (draggingKfRef.current) return;
    onSeek(posToTime(e.clientX));
  };

  const handleKfMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    draggingKfRef.current = id;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!draggingKfRef.current) return;
      onUpdateKeyframeTime(draggingKfRef.current, posToTime(ev.clientX));
    };
    const handleMouseUp = () => {
      draggingKfRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const cursorPct = (currentTimeMs / durationMs) * 100;

  return (
    <div className="space-y-1">
      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-8 bg-[var(--background)] border border-[var(--border)] rounded-md cursor-pointer select-none"
        onClick={handleTrackClick}
      >
        {/* Filled region */}
        <div
          className="absolute top-0 left-0 h-full bg-[var(--primary)] opacity-20 rounded-md pointer-events-none"
          style={{ width: `${cursorPct}%` }}
        />

        {/* Keyframe dots */}
        {keyframes.map(kf => {
          const pct = (kf.timeMs / durationMs) * 100;
          return (
            <div
              key={kf.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-yellow-600 cursor-grab shadow z-10"
              style={{ left: `${pct}%` }}
              onMouseDown={e => handleKfMouseDown(e, kf.id)}
              title={`Keyframe at ${(kf.timeMs / 1000).toFixed(1)}s${kf.label ? ' — ' + kf.label : ''}`}
            />
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-[var(--primary)] pointer-events-none z-20"
          style={{ left: `${cursorPct}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[var(--primary)] rotate-45" />
        </div>
      </div>

      {/* Keyframe list */}
      {keyframes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...keyframes].sort((a, b) => a.timeMs - b.timeMs).map(kf => (
            <div
              key={kf.id}
              className="flex items-center gap-1 text-xs bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 rounded px-2 py-0.5"
            >
              <span>{(kf.timeMs / 1000).toFixed(1)}s{kf.label ? ` — ${kf.label}` : ''}</span>
              <button
                onClick={() => onRemoveKeyframe(kf.id)}
                className="opacity-60 hover:opacity-100"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineScrubber;
