import React from "react";
import { ChevronLeft, ChevronRight, CornerDownRight, Eye, EyeOff, AlertTriangle } from "lucide-react";
import type { CompileWarning } from "../../../../../packages/shared/src";

interface PhaseStripProps {
  /** 1-based. Also the beat that newly drawn arrows are assigned to. */
  current: number;
  /** How many phases the arrows describe. */
  count: number;
  onSetPhase: (n: number) => void;
  /** Advance to the next phase — the Step gesture, also bound to Spacebar. */
  onStep: () => void;
  showAll: boolean;
  onToggleShowAll: () => void;
  warnings: CompileWarning[];
  /** Total loop length, so the strip can say how long the move actually runs. */
  durationMs: number;
  disabled?: boolean;
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
const circled = (n: number) => CIRCLED[n - 1] ?? `(${n})`;

const iconBtn = (enabled: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 999,
  border: 'var(--border-w) solid var(--ink)',
  background: enabled ? 'var(--surface-low)' : 'transparent',
  color: 'var(--on-surface)',
  cursor: enabled ? 'pointer' : 'not-allowed',
  opacity: enabled ? 1 : 0.35,
  padding: 0,
});

/**
 * Where you are in the move.
 *
 * Deliberately not a scrubber. A phase has no meaningful interior to park a
 * playhead in — you are either authoring beat 2 or you are not — so this is a
 * position indicator and a Step button, nothing more. It replaces the timeline
 * that V1 had and then deleted, because without *something* here sequencing is
 * invisible: you cannot see which beat you are adding to, and you cannot get back
 * to beat 2 to fix it once you have moved on.
 *
 * Stepping past the last phase is allowed and is how you start a new one: the next
 * arrow you draw is what brings it into existence.
 */
const PhaseStrip: React.FC<PhaseStripProps> = ({
  current,
  count,
  onSetPhase,
  onStep,
  showAll,
  onToggleShowAll,
  warnings,
  durationMs,
  disabled,
}) => {
  const unreachable = warnings.filter(w => w.code === 'constraint-unreachable');
  // Nothing drawn yet is not the same as having stepped past the end: one is an
  // empty board waiting for a first arrow, the other is a board that has played
  // forward and is waiting for the next one.
  const isEmpty = count === 0;
  const isNew = !isEmpty && current > count;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        border: 'var(--border-w) solid var(--ink)',
        borderRadius: 12,
        background: 'var(--surface-low)',
        boxShadow: 'var(--card-shadow)',
        padding: '7px 10px',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => onSetPhase(current - 1)}
        disabled={disabled || current <= 1}
        style={iconBtn(!disabled && current > 1)}
        title="Previous beat"
        aria-label="Previous beat"
      >
        <ChevronLeft size={15} />
      </button>

      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--on-surface)',
          minWidth: 74,
          textAlign: 'center',
        }}
      >
        {circled(current)} {isEmpty ? 'Beat 1' : isNew ? 'New beat' : `of ${count}`}
      </span>

      <button
        type="button"
        onClick={() => onSetPhase(current + 1)}
        disabled={disabled || current > count}
        style={iconBtn(!disabled && current <= count)}
        title="Next beat"
        aria-label="Next beat"
      >
        <ChevronRight size={15} />
      </button>

      <button
        type="button"
        onClick={onStep}
        disabled={disabled}
        className="gap-1"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'var(--font-display)',
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          color: 'var(--on-primary)',
          background: 'var(--primary)',
          border: 'var(--border-w) solid var(--ink)',
          borderRadius: 999,
          padding: '4px 10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        title="Step forward: fast-forward the board and start the next beat (Spacebar)"
      >
        <CornerDownRight size={12} />
        Step
      </button>

      <button
        type="button"
        onClick={onToggleShowAll}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginLeft: 'auto',
          fontFamily: 'var(--font-display)',
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          // Ink only reads on the lime fill; off, the chip is bare on the panel.
          color: showAll ? 'var(--on-primary)' : 'var(--on-surface)',
          background: showAll ? 'var(--primary)' : 'transparent',
          border: `var(--border-w) solid ${showAll ? 'var(--ink)' : 'var(--border)'}`,
          borderRadius: 999,
          padding: '4px 10px',
          cursor: 'pointer',
        }}
        title={
          showAll
            ? 'Showing every beat at once — the whole diagram, which is what the image export shows'
            : 'Showing this beat solid and earlier beats ghosted'
        }
      >
        {showAll ? <Eye size={12} /> : <EyeOff size={12} />}
        {showAll ? 'All beats' : 'This beat'}
      </button>

      <div style={{ flexBasis: '100%', height: 0 }} />

      <p
        className="text-xs text-[var(--text-secondary)]"
        style={{ margin: 0, lineHeight: 1.5 }}
      >
        {isEmpty ? (
          <>Draw an arrow to start the move. Press <strong>Step</strong> to begin a new beat.</>
        ) : isNew ? (
          <>Board has fast-forwarded. Draw the next arrows — they become beat {current}.</>
        ) : (
          <>
            Runs at {(durationMs / 1000).toFixed(1)}s. Everything in a beat starts together;
            each player takes as long as their own distance needs.
          </>
        )}
      </p>

      {unreachable.length > 0 && (
        <p
          className="flex items-start gap-1.5 text-xs"
          style={{ margin: 0, color: 'var(--whistle-orange)', lineHeight: 1.45, flexBasis: '100%' }}
        >
          <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            {unreachable.length === 1 ? 'A run cannot' : `${unreachable.length} runs cannot`} arrive
            with the ball — flat out is not fast enough, so {unreachable.length === 1 ? 'it arrives' : 'they arrive'} late.
          </span>
        </p>
      )}
    </div>
  );
};

export default PhaseStrip;
