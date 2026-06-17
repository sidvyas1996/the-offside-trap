import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface EditorBarProps {
  kicker: string;
  title: string;
  onTitleChange: (value: string) => void;
  placeholder?: string;
  actions?: React.ReactNode;
}

/**
 * Contextual editor header — black rounded pill with a back button,
 * kicker + editable document title, and a right-side actions slot.
 * Shares the pill language of the marketing TopNav.
 */
const EditorBar: React.FC<EditorBarProps> = ({ kicker, title, onTitleChange, placeholder, actions }) => {
  const navigate = useNavigate();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        background: "var(--ink)",
        borderRadius: 18,
        padding: "10px 14px 10px 12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 40, height: 40, borderRadius: 999, flexShrink: 0,
            background: "transparent", border: "1.5px solid rgba(255,255,255,0.25)",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800,
            letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
            marginBottom: 1,
          }}>
            {kicker}
          </div>
          <input
            className="editor-title-input"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder={placeholder}
            style={{
              fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 800,
              color: "#fff", background: "transparent", border: "none", outline: "none",
              padding: 0, width: "min(42vw, 360px)", letterSpacing: "-0.01em",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {actions}
      </div>
    </nav>
  );
};

export default EditorBar;
