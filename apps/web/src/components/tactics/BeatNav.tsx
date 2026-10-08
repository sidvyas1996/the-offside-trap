import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BeatNavProps {
  /** 1-based beat being authored. */
  current: number;
  /** Beats the arrows describe; one past it is a new, empty beat. */
  count: number;
  onSetBeat: (n: number) => void;
  disabled?: boolean;
}

const btn = (enabled: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 999,
  border: "var(--border-w) solid var(--ink)",
  background: enabled ? "var(--primary)" : "var(--surface-high)",
  color: enabled ? "var(--on-primary)" : "var(--on-surface)",
  boxShadow: enabled ? "var(--shadow-sm)" : "none",
  cursor: enabled ? "pointer" : "not-allowed",
  opacity: enabled ? 1 : 0.4,
  padding: 0,
});

/**
 * Back / forward through the beats, right above the pitch.
 *
 * The same navigation as the Movement panel's strip, put where your eyes are
 * while drawing. Each beat shows the board as it stands when that beat starts —
 * everyone where the earlier beats left them, the ball with whoever has it — so
 * the next pass is drawn from the right place. Forward past the last beat opens
 * a new one. ← / → do the same from the keyboard.
 */
const BeatNav: React.FC<BeatNavProps> = ({ current, count, onSetBeat, disabled }) => {
  const canBack = !disabled && current > 1;
  const canForward = !disabled && current <= count;
  const isNew = count > 0 && current > count;
  const label = count === 0 ? "Beat 1" : isNew ? `New beat ${current}` : `Beat ${current} of ${count}`;
  const hint =
    count === 0
      ? "Draw runs, then a pass — each pass ends its beat and moves on to the next."
      : isNew
        ? "Everyone is where the last beat left them. Runs join this beat; a pass ends it."
        : current > 1
          ? "Positions as this beat starts. Runs join this beat; a pass replaces its pass."
          : "The starting shape. Runs join beat 1; a pass replaces its pass.";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => onSetBeat(current - 1)}
        disabled={!canBack}
        style={btn(canBack)}
        title="Previous beat (←)"
        aria-label="Previous beat"
      >
        <ChevronLeft size={16} />
      </button>
      <span
        aria-live="polite"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 13,
          fontWeight: 800,
          color: "var(--on-surface)",
          minWidth: 104,
          textAlign: "center",
        }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={() => onSetBeat(current + 1)}
        disabled={!canForward}
        style={btn(canForward)}
        title={current === count ? "Start a new beat (→)" : "Next beat (→)"}
        aria-label="Next beat"
      >
        <ChevronRight size={16} />
      </button>
      <span className="text-xs text-[var(--text-secondary)]" style={{ lineHeight: 1.4 }}>
        {hint}
      </span>
    </div>
  );
};

export default BeatNav;
