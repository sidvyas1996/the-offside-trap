import React from "react";
import { Play, Pause, Plus } from "lucide-react";
import { Button } from "../ui/button";

interface TimelineControlsProps {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  fps: number;
  keyframeCount: number;
  onPlay: () => void;
  onPause: () => void;
  onAddKeyframe: () => void;
  onSetDuration: (ms: number) => void;
  onSetFps: (fps: number) => void;
}

const DURATION_OPTIONS = [2000, 3000, 5000, 8000, 10000, 15000, 20000, 30000];
const FPS_OPTIONS = [12, 24, 30];

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const dec = Math.floor((ms % 1000) / 100);
  return `${s}.${dec}s`;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  isPlaying,
  currentTimeMs,
  durationMs,
  fps,
  keyframeCount,
  onPlay,
  onPause,
  onAddKeyframe,
  onSetDuration,
  onSetFps,
}) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Play / Pause */}
      <Button
        variant="outline"
        onClick={isPlaying ? onPause : onPlay}
        className="gap-1.5 text-sm px-3 py-1.5"
        style={{ borderColor: 'var(--border)', borderRadius: 6 }}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        {isPlaying ? "Pause" : "Play"}
      </Button>

      {/* Current time */}
      <span className="text-xs text-[var(--text-secondary)] font-mono min-w-[70px]">
        {formatTime(currentTimeMs)} / {formatTime(durationMs)}
      </span>

      {/* Add keyframe */}
      <Button
        variant="outline"
        onClick={onAddKeyframe}
        className="gap-1.5 text-sm px-3 py-1.5"
        style={{ borderColor: 'var(--border)', borderRadius: 6 }}
      >
        <Plus size={14} />
        Add Keyframe
      </Button>

      <span className="text-xs text-[var(--text-secondary)]">
        {keyframeCount} keyframe{keyframeCount !== 1 ? 's' : ''}
      </span>

      {/* Duration selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--text-secondary)]">Duration:</span>
        <select
          value={durationMs}
          onChange={e => onSetDuration(Number(e.target.value))}
          className="text-xs bg-[var(--card)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--text-primary)]"
        >
          {DURATION_OPTIONS.map(d => (
            <option key={d} value={d}>{d / 1000}s</option>
          ))}
        </select>
      </div>

      {/* FPS selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--text-secondary)]">FPS:</span>
        <select
          value={fps}
          onChange={e => onSetFps(Number(e.target.value))}
          className="text-xs bg-[var(--card)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--text-primary)]"
        >
          {FPS_OPTIONS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TimelineControls;
