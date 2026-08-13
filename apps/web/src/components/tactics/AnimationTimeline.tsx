import React from "react";
import { Film, Play, Pause, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import PresetPicker from "./PresetPicker";
import BeatList from "./BeatList";
import type { MovementTempo, Player, TacticArrow } from "../../../../../packages/shared/src";

interface AnimationTimelineProps {
  arrows: TacticArrow[];
  /** Arrows are the animation when on; off leaves them as static annotation. */
  fromArrows: boolean;
  onToggleFromArrows: () => void;
  /** The beat being authored, so the list can show which group you are adding to. */
  currentBeat?: number;
  /**
   * Loop length as computed by the compiler, when it owns the clock.
   *
   * V2 derives duration from distance over speed, so there is nothing to choose —
   * offering a Loop dropdown would be offering to overrule physics. Present, the
   * length is reported; absent (legacy gesture tactics), the dropdown comes back.
   */
  derivedDurationMs?: number;
  onSetBeat: (arrowId: string, beat: number) => void;
  onSetTempo: (arrowId: string, tempo: MovementTempo) => void;
  onRemoveArrow: (arrowId: string) => void;
  players: Player[];
  oppositionPlayers: Player[];
  /** Compiled keyframe count — surfaced only so legacy tactics aren't a mystery. */
  keyframeCount: number;
  isPlaying: boolean;
  durationMs: number;
  fps: number;
  onPlay: () => void;
  onPause: () => void;
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
  arrows,
  fromArrows,
  onToggleFromArrows,
  currentBeat,
  derivedDurationMs,
  onSetBeat,
  onSetTempo,
  onRemoveArrow,
  players,
  oppositionPlayers,
  keyframeCount,
  isPlaying,
  durationMs,
  fps,
  onPlay,
  onPause,
  onSetDuration,
  onSetFps,
  onApplyPreset,
}) => {
  // A tactic saved before gestures existed still plays, but has nothing to edit.
  const authored = arrows.filter(a => a.points.length >= 2 && a.type !== 'target-zone').length;
  const isLegacyKeyframeOnly = authored === 0 && keyframeCount > 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--surface-container)", border: "2px solid var(--ink)", boxShadow: "var(--card-shadow)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <h2 className="panel-title" style={{ margin: 0 }}>
          <span className="icon-chip"><Film size={14} /></span>
          Movement
        </h2>
        {authored > 0 && (
          <span
            className="ml-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              background: 'var(--ink)',
              borderRadius: 999,
              padding: '3px 10px',
            }}
          >
            {authored} {authored === 1 ? 'arrow' : 'arrows'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={isPlaying ? onPause : onPlay}
          className="gap-1.5 text-sm px-3 py-1.5"
          style={{
            borderRadius: 999,
            border: '2px solid var(--ink)',
            background: 'var(--primary)',
            color: 'var(--ink)',
            fontWeight: 700,
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <Button
          variant="outline"
          onClick={onToggleFromArrows}
          className="gap-1.5 text-sm px-3 py-1.5"
          style={{
            borderRadius: 999,
            border: '2px solid var(--ink)',
            background: fromArrows ? 'var(--primary)' : 'var(--surface-low)',
            color: 'var(--ink)',
            fontWeight: 700,
          }}
          title={fromArrows
            ? 'Arrows are driving the animation. Click to leave them as static annotation.'
            : 'Arrows are static annotation. Click to animate them.'}
        >
          <Pencil size={13} />
          {fromArrows ? 'Arrows animate' : 'Arrows static'}
        </Button>

        <div className="flex items-center gap-1.5 ml-auto">
          {derivedDurationMs !== undefined ? (
            <span
              className="text-xs text-[var(--text-secondary)]"
              title="Length comes out of how far everyone has to travel, so there is nothing to pick"
            >
              Runs {(derivedDurationMs / 1000).toFixed(1)}s
            </span>
          ) : (
            <>
              <span className="text-xs text-[var(--text-secondary)]">Loop</span>
              <select
                value={durationMs}
                onChange={e => onSetDuration(Number(e.target.value))}
                className="text-xs px-2 py-1 text-[var(--ink)]"
                style={{ background: 'var(--surface-low)', border: '2px solid var(--ink)', borderRadius: 8, fontWeight: 700 }}
              >
                {DURATION_OPTIONS.map(d => (
                  <option key={d} value={d}>{d / 1000}s</option>
                ))}
              </select>
            </>
          )}

          <span className="text-xs text-[var(--text-secondary)]">FPS</span>
          <select
            value={fps}
            onChange={e => onSetFps(Number(e.target.value))}
            className="text-xs px-2 py-1 text-[var(--ink)]"
            style={{ background: 'var(--surface-low)', border: '2px solid var(--ink)', borderRadius: 8, fontWeight: 700 }}
          >
            {FPS_OPTIONS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {onApplyPreset && (
        <div className="mt-3">
          <PresetPicker onApplyPreset={onApplyPreset} />
        </div>
      )}

      <div className="mt-3">
        {isLegacyKeyframeOnly ? (
          <p className="text-xs text-[var(--text-secondary)] py-2">
            This tactic was animated with keyframes ({keyframeCount}) and still plays as it always did.
            Draw a movement to take it over — that will replace the old keyframes.
          </p>
        ) : fromArrows ? (
          <BeatList
            arrows={arrows}
            players={players}
            oppositionPlayers={oppositionPlayers}
            currentBeat={currentBeat}
            onSetBeat={onSetBeat}
            onSetTempo={onSetTempo}
            onRemove={onRemoveArrow}
          />
        ) : (
          <p className="text-xs text-[var(--text-secondary)] py-2" style={{ lineHeight: 1.55 }}>
            This tactic's arrows are static annotation. Turn on <strong>Arrows animate</strong> to
            make them the animation.
          </p>
        )}
      </div>

      {authored > 0 && fromArrows && (
        <p className="text-xs text-[var(--text-secondary)] mt-3" style={{ lineHeight: 1.5 }}>
          Same beat means together; a later beat means after. Each player takes as long
          as their own distance needs at their tempo, so a short shift no longer waits
          on a long run. A run holds where it finishes until the move resets.
        </p>
      )}
    </div>
  );
};

export default AnimationTimeline;
