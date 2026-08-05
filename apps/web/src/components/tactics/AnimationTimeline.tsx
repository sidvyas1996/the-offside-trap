import React from "react";
import { Film, Play, Pause } from "lucide-react";
import { Button } from "../ui/button";
import PresetPicker from "./PresetPicker";
import MovementList from "./MovementList";
import type { Movement, Player } from "../../../../../packages/shared/src";

interface AnimationTimelineProps {
  movements: Movement[];
  players: Player[];
  oppositionPlayers: Player[];
  /** Compiled keyframe count — surfaced only so legacy tactics aren't a mystery. */
  keyframeCount: number;
  isPlaying: boolean;
  durationMs: number;
  fps: number;
  movementMode: boolean;
  onToggleMovementMode: () => void;
  onPlay: () => void;
  onPause: () => void;
  onUpdateMovement: (id: string, patch: Partial<Movement>) => void;
  onRemoveMovement: (id: string) => void;
  onSetDuration: (ms: number) => void;
  onSetFps: (fps: number) => void;
  onApplyPreset?: (presetId: string) => void;
}

/** Must stay in step with the compiler's assumptions about sane loop lengths. */
const DURATION_OPTIONS = [2000, 3000, 5000, 8000, 10000, 15000, 20000, 30000];
const FPS_OPTIONS = [12, 24, 30];

/**
 * The studio's animation panel.
 *
 * There is no scrubber and no keyframe list: an animation here is a repeating
 * phrase, so there is no playhead to park and nothing to snapshot. What used to
 * be timeline mechanics is now a list of what each player does.
 */
const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  movements,
  players,
  oppositionPlayers,
  keyframeCount,
  isPlaying,
  durationMs,
  fps,
  movementMode,
  onToggleMovementMode,
  onPlay,
  onPause,
  onUpdateMovement,
  onRemoveMovement,
  onSetDuration,
  onSetFps,
  onApplyPreset,
}) => {
  // A tactic saved before gestures existed still plays, but has nothing to edit.
  const isLegacyKeyframeOnly = movements.length === 0 && keyframeCount > 0;

  return (
    <div className="space-y-3">
      <h2 className="panel-title">
        <span className="icon-chip"><Film size={14} /></span>
        Movement
      </h2>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={isPlaying ? onPause : onPlay}
          className="gap-1.5 text-sm px-3 py-1.5"
          style={{ borderColor: 'var(--border)', borderRadius: 6 }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <Button
          variant="outline"
          onClick={onToggleMovementMode}
          className="gap-1.5 text-sm px-3 py-1.5"
          style={{
            borderRadius: 6,
            borderColor: movementMode ? 'var(--ink)' : 'var(--border)',
            background: movementMode ? 'var(--primary)' : 'transparent',
            color: movementMode ? 'var(--ink)' : undefined,
            fontWeight: movementMode ? 700 : undefined,
          }}
          title="Drag a player on the pitch to draw how they move"
        >
          {movementMode ? 'Drawing movements' : 'Draw movement'}
        </Button>

        <span className="text-xs text-[var(--text-secondary)]">
          Loops every
        </span>
        <select
          value={durationMs}
          onChange={e => onSetDuration(Number(e.target.value))}
          className="text-xs bg-[var(--card)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--text-primary)]"
        >
          {DURATION_OPTIONS.map(d => (
            <option key={d} value={d}>{d / 1000}s</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-secondary)]">Export FPS:</span>
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

      {onApplyPreset && <PresetPicker onApplyPreset={onApplyPreset} />}

      {isLegacyKeyframeOnly ? (
        <p className="text-xs text-[var(--text-secondary)] text-center py-2">
          This tactic was animated with keyframes ({keyframeCount}) and still plays as it always did.
          Draw a movement to take it over — that will replace the old keyframes.
        </p>
      ) : (
        <MovementList
          movements={movements}
          players={players}
          oppositionPlayers={oppositionPlayers}
          onUpdate={onUpdateMovement}
          onRemove={onRemoveMovement}
        />
      )}
    </div>
  );
};

export default AnimationTimeline;
