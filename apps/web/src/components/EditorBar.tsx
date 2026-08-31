import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface EditorBarProps {
  kicker: string;
  title: string;
  onTitleChange: (value: string) => void;
  placeholder?: string;
  /**
   * Optional line under the title, for fields that belong to the document's
   * identity rather than to authoring — a description, say. Keeping them here
   * means the rail doesn't need a details panel that just restates the header.
   */
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /**
   * Stack the actions onto their own row.
   *
   * The bar is a single row of back button + title + three controls, which needs
   * roughly 700px. On a phone the actions wrap underneath instead of being
   * squeezed until the save button is unreadable.
   */
  compact?: boolean;
  /**
   * Phone treatment: no black pill.
   *
   * The mobile design floats the controls straight on the cream dot-grid over a
   * gradient fade, so the board can run full-bleed underneath the header
   * instead of starting below an opaque bar. Each control carries its own ink
   * border and hard offset shadow, which is the same language as the pill —
   * just unpacked.
   */
  bare?: boolean;
}

/**
 * Contextual editor header — black rounded pill with a back button,
 * kicker + editable document title, and a right-side actions slot.
 * Shares the pill language of the marketing TopNav.
 */
const EditorBar: React.FC<EditorBarProps> = ({ kicker, title, onTitleChange, placeholder, subtitle, actions, compact = false, bare = false }) => {
  const navigate = useNavigate();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: bare ? 10 : compact ? 8 : 16,
        flexWrap: bare ? "nowrap" : compact ? "wrap" : "nowrap",
        ...(bare
          ? { background: "transparent", padding: 0 }
          : { background: "var(--ink)", borderRadius: 18, padding: "10px 14px 10px 12px" }),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: bare ? 10 : 12, minWidth: 0, flex: bare ? "1 1 auto" : compact ? "1 1 100%" : "0 1 auto" }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            flexShrink: 0, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            ...(bare
              ? {
                  width: 38, height: 38, borderRadius: 11,
                  background: "var(--surface-container)",
                  border: "var(--border-w) solid var(--ink)",
                  boxShadow: "var(--card-shadow)",
                  color: "var(--on-surface)",
                }
              : {
                  width: 40, height: 40, borderRadius: 999,
                  background: "transparent",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                }),
          }}
        >
          <ChevronLeft size={bare ? 18 : 20} strokeWidth={bare ? 2.5 : 2} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: bare ? 10 : 11, fontWeight: bare ? 700 : 800,
            letterSpacing: bare ? "0.12em" : "0.16em", textTransform: "uppercase",
            color: bare ? "var(--caption)" : "rgba(255,255,255,0.5)",
            marginBottom: 1,
          }}>
            {kicker}
          </div>
          <input
            className={`editor-title-input${bare ? " editor-title-input--bare" : ""}`}
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder={placeholder}
            style={{
              fontFamily: "var(--font-display)", fontSize: bare ? 16 : 19, fontWeight: bare ? 900 : 800,
              color: bare ? "var(--on-surface)" : "#fff", background: "transparent", border: "none", outline: "none",
              padding: 0, width: bare || compact ? "100%" : "min(42vw, 360px)",
              letterSpacing: bare ? "-0.02em" : "-0.01em",
            }}
          />
          {subtitle}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: bare ? 8 : compact ? 8 : 10,
          flexShrink: 0,
          ...(compact && !bare ? { flex: "1 1 100%", flexWrap: "wrap" as const } : {}),
        }}
      >
        {actions}
      </div>
    </nav>
  );
};

export default EditorBar;
