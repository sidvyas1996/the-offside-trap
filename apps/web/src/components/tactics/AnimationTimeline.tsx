import React from "react";
import { Film } from "lucide-react";
import TimelineControls from "./TimelineControls";
import TimelineScrubber from "./TimelineScrubber";
import type { Keyframe } from "../../../../../packages/shared/src";

interface AnimationTimelineProps {
  keyframes: Keyframe[];
  currentTimeMs: number;
  isPlaying: boolean;
  durationMs: number;
  fps: number;
  onPlay: () => void;
  onPause: () => void;
  onAddKeyframe: () => void;
  onRemoveKeyframe: (id: string) => void;
  onUpdateKeyframeTime: (id: string, timeMs: number) => void;
  onSeek: (timeMs: number) => void;
  onSetDuration: (ms: number) => void;
  onSetFps: (fps: number) => void;
}

const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  keyframes,
  currentTimeMs,
  isPlaying,
  durationMs,
  fps,
  onPlay,
  onPause,
  onAddKeyframe,
  onRemoveKeyframe,
  onUpdateKeyframeTime,
  onSeek,
  onSetDuration,
  onSetFps,
}) => {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Film className="h-5 w-5 text-[var(--primary)]" />
        Animation Timeline
      </h2>

      <TimelineControls
        isPlaying={isPlaying}
        currentTimeMs={currentTimeMs}
        durationMs={durationMs}
        fps={fps}
        keyframeCount={keyframes.length}
        onPlay={onPlay}
        onPause={onPause}
        onAddKeyframe={onAddKeyframe}
        onSetDuration={onSetDuration}
        onSetFps={onSetFps}
      />

      <TimelineScrubber
        keyframes={keyframes}
        currentTimeMs={currentTimeMs}
        durationMs={durationMs}
        onSeek={onSeek}
        onRemoveKeyframe={onRemoveKeyframe}
        onUpdateKeyframeTime={onUpdateKeyframeTime}
      />

      {keyframes.length === 0 && (
        <p className="text-xs text-[var(--text-secondary)] text-center py-2">
          Move players to a position, then click <strong>Add Keyframe</strong> to capture that state. Add another keyframe at a different time to create an animation.
        </p>
      )}
    </div>
  );
};

export default AnimationTimeline;
