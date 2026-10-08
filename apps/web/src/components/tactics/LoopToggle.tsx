import React from "react";
import { Repeat, ArrowRightToLine } from "lucide-react";
import { LOOP_DELAY_MS } from "../../hooks/useAnimation";

interface LoopToggleProps {
  loop: boolean;
  onChange: (loop: boolean) => void;
  /** Countdown to the next run while resting between loops. */
  delayRemainingMs?: number;
  /** The rest between loops, for the tooltip. */
  delayMs?: number;
}

/** Loop / Once segmented switch for animation playback. */
const LoopToggle: React.FC<LoopToggleProps> = ({ loop, onChange, delayRemainingMs = 0, delayMs = LOOP_DELAY_MS }) => {
  const option = (value: boolean, label: string, icon: React.ReactNode, title: string) => {
    const active = loop === value;
    return (
      <button
        type="button"
        onClick={() => onChange(value)}
        aria-pressed={active}
        title={title}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px",
          border: "none",
          borderRadius: 999,
          background: active ? "var(--primary)" : "transparent",
          color: active ? "var(--on-primary)" : "var(--on-surface-variant)",
          fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        role="group"
        aria-label="Playback mode"
        style={{
          display: "flex", padding: 2, gap: 2,
          borderRadius: 999,
          border: "var(--border-w) solid var(--ink)",
          background: "var(--surface-low)",
        }}
      >
        {option(true, "Loop", <Repeat size={11} />, delayMs > 0 ? `Repeat, resting ${delayMs / 1000}s between runs` : "Repeat continuously")}
        {option(false, "Once", <ArrowRightToLine size={11} />, "Play once and stop on the final pose")}
      </div>
      {delayRemainingMs > 0 && (
        <span style={{ fontSize: 11, fontFamily: "var(--font-display)", color: "var(--caption)" }}>
          Replay in {Math.ceil(delayRemainingMs / 1000)}s
        </span>
      )}
    </div>
  );
};

export default LoopToggle;
