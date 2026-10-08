import React from "react";
import { Play, Pause, Plus, ArrowUpRight, ChevronDown, Undo2 } from "lucide-react";
import type { ArrowType } from "../../../../../packages/shared";
import { ARROW_TOOLS, BALL_TOOLS, RUN_TOOLS, type ArrowTool } from "./arrow-tools";

/**
 * The phone studio's permanent bottom dock.
 *
 * Unlike the desktop rail — which the mobile build first mirrored as two modal
 * sheets — the design keeps the arrow palette *on screen at all times*, because
 * drawing is the one thing you are doing in the studio and a tool picker you
 * have to open first turns every arrow into three taps. Playback and the phase
 * counter share the dock for the same reason.
 */

const TOOL_LABELS: Partial<Record<ArrowType, string>> = Object.fromEntries(
  ARROW_TOOLS.map(t => [t.type, t.title]),
);

/** `m:ss`, the format the design's playback readout uses. */
const clock = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

interface MobileArrowDockProps {
  arrowTool: ArrowType | null;
  onSetArrowTool: (t: ArrowType | null) => void;
  currentPhase: number;
  phaseCount: number;
  onStep: () => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  currentTimeMs: number;
  durationMs: number;
  /** Owned by the page: collapsing also lets the stage go edge-to-edge. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Undo the last arrow edit — a phone has no ⌘Z. */
  onUndo: () => void;
  canUndo: boolean;
}

const ToolChip: React.FC<{
  tool: ArrowTool;
  active: boolean;
  onClick: () => void;
}> = ({ tool: { label, title, icon: Icon }, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    title={title}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      flex: 1, minWidth: 0, padding: '8px 0 6px', borderRadius: 11, cursor: 'pointer',
      fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 9.5,
      color: active ? 'var(--on-primary)' : 'var(--on-surface-dim)',
      background: active ? 'var(--primary)' : 'var(--surface-high)',
      border: 'var(--border-w) solid var(--ink)',
      boxShadow: active ? 'var(--shadow-sm)' : 'none',
    }}
  >
    {/* The glyph is the arrow itself, so straight and curved read apart at a glance. */}
    <span aria-hidden style={{ display: 'flex' }}><Icon /></span>
    {label}
  </button>
);

const ToolRow: React.FC<{
  label: string;
  tools: ArrowTool[];
  arrowTool: ArrowType | null;
  onSetArrowTool: (t: ArrowType | null) => void;
  marginBottom: number;
}> = ({ label, tools, arrowTool, onSetArrowTool, marginBottom }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom }}>
    <span
      style={{
        width: 34, flexShrink: 0, fontWeight: 800, fontSize: 9,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--outline)',
      }}
    >
      {label}
    </span>
    <div style={{ display: 'flex', gap: 7, flex: 1, minWidth: 0 }}>
      {tools.map(t => (
        <ToolChip
          key={t.type}
          tool={t}
          active={arrowTool === t.type}
          // Tapping the live tool clears it, so the board goes back to dragging
          // players without having to reach for a separate "none" control.
          onClick={() => onSetArrowTool(arrowTool === t.type ? null : t.type)}
        />
      ))}
    </div>
  </div>
);

const MobileArrowDock: React.FC<MobileArrowDockProps> = ({
  arrowTool, onSetArrowTool,
  currentPhase, phaseCount, onStep,
  isPlaying, onPlay, onPause,
  currentTimeMs, durationMs,
  collapsed, onToggleCollapsed,
  onUndo, canUndo,
}) => {
  // No arrow tool is the Move tool: a drag repositions players.
  const activeLabel = arrowTool ? TOOL_LABELS[arrowTool] : 'Move';

  const progress = durationMs > 0 ? Math.min(1, currentTimeMs / durationMs) : 0;
  const pct = `${(progress * 100).toFixed(2)}%`;

  return (
    <div
      style={{
        // A flex item, not an overlay: the stage above gets `flex:1` and the
        // dock takes exactly the height its content needs, so the board can
        // never end up hidden behind it on a short viewport.
        flexShrink: 0,
        background: 'var(--surface-container)',
        borderTop: 'var(--border-w) solid var(--ink)',
        borderRadius: '22px 22px 0 0',
        padding: collapsed ? '10px 16px 12px' : '10px 16px 26px',
        paddingBottom: collapsed
          ? 'calc(12px + env(safe-area-inset-bottom, 0px))'
          : 'calc(26px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -4px 0 rgba(15,13,21,0.35)',
      }}
    >
      {/* The whole header is the collapse control — the grab handle is the
          affordance people already reach for, so it toggles rather than
          decorating a separate chevron button. */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Show arrow tools' : 'Hide arrow tools'}
        style={{
          display: 'block', width: '100%', padding: 0, background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ width: 38, height: 5, borderRadius: 99, background: 'var(--on-surface-dim)', opacity: 0.3, margin: '0 auto 12px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: collapsed ? 0 : 11 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14,
            letterSpacing: '-0.01em', color: 'var(--on-surface)',
          }}>
            <ArrowUpRight size={15} strokeWidth={2.6} />
            ARROWS
            {/* Collapsed, the rows are gone — so the armed tool has to say so here
                or you cannot tell what a drag on the pitch will draw. */}
            {collapsed && activeLabel && (
              <span style={{
                marginLeft: 2, padding: '2px 8px', borderRadius: 99,
                background: 'var(--primary)', border: 'var(--border-w) solid var(--ink)',
                color: 'var(--on-primary)',
                fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 10,
              }}>
                {activeLabel}
              </span>
            )}
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 11, color: 'var(--outline)' }}>
            {collapsed ? 'tap to open'
              : ARROW_TOOLS.some(t => t.curved && t.type === arrowTool) ? 'swing the drag to bend'
                : 'drag on pitch to draw'}
            <ChevronDown
              size={15}
              strokeWidth={2.6}
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </span>
        </div>
      </button>

      {!collapsed && (
        <>
      <ToolRow label="Ball" tools={BALL_TOOLS} arrowTool={arrowTool} onSetArrowTool={onSetArrowTool} marginBottom={9} />
      <ToolRow label="Run" tools={RUN_TOOLS} arrowTool={arrowTool} onSetArrowTool={onSetArrowTool} marginBottom={14} />

      {/* Playback + phase counter */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--surface-low)', border: 'var(--border-w) solid var(--ink)', borderRadius: 14,
        padding: '9px 11px', boxShadow: 'var(--card-shadow)',
      }}>
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--primary)',
            border: 'var(--border-w) solid var(--ink)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {isPlaying
            ? <Pause size={15} fill="var(--ink)" stroke="var(--ink)" />
            : <Play size={15} fill="var(--ink)" stroke="var(--ink)" />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontWeight: 800, fontSize: 11, color: 'var(--on-surface)' }}>
              Phase {currentPhase} of {phaseCount}
            </span>
            <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--outline)' }}>
              {clock(currentTimeMs)} / {clock(durationMs)}
            </span>
          </div>
          <div style={{ position: 'relative', height: 8, borderRadius: 99, background: 'var(--surface)', border: 'var(--border-w) solid var(--ink)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct, borderRadius: 99, background: 'var(--primary)' }} />
            <span style={{
              position: 'absolute', left: pct, top: '50%', transform: 'translate(-50%,-50%)',
              width: 13, height: 13, borderRadius: '50%', background: '#ffffff',
              border: 'var(--border-w) solid var(--ink)',
            }} />
          </div>
        </div>

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last arrow"
          title="Undo the last arrow change"
          style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--surface-high)',
            border: 'var(--border-w) solid var(--ink)', color: 'var(--on-surface)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, cursor: canUndo ? 'pointer' : 'default',
            opacity: canUndo ? 1 : 0.4,
          }}
        >
          <Undo2 size={15} strokeWidth={2.4} />
        </button>

        {/* Step: fast-forward the board and open the next beat. */}
        <button
          type="button"
          onClick={onStep}
          aria-label="Add a new phase"
          title="Step forward: fast-forward the board and start the next beat"
          style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--surface-high)',
            border: 'var(--border-w) solid var(--ink)', color: 'var(--on-surface)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
          }}
        >
          <Plus size={15} strokeWidth={2.6} />
        </button>
      </div>
        </>
      )}
    </div>
  );
};

export default MobileArrowDock;
