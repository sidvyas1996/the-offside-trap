import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

/* Logo flag glyph (design-language mark) */
const FlagGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#15140F">
    <path d="M6 3v18l5-4 4 3 4-4V3l-4 4-4-3z" />
  </svg>
);

const NAV_LINKS = [
  { label: "Studio", to: "/create-tactics" },
  { label: "Lineups", to: "/create-lineups" },
  { label: "Library", to: "/" },
  { label: "Pricing", to: "/pricing" },
];

interface TopNavProps {
  /** Right-side content. Defaults to the "Open App" CTA. */
  actions?: React.ReactNode;
  /** Hide the centered nav links (e.g. very tight editor bars). */
  showLinks?: boolean;
}

/**
 * The global black-pill navigation bar — consistent across every screen.
 * Renders just the pill; the page owns the surrounding padding / max-width.
 */
const TopNav: React.FC<TopNavProps> = ({ actions, showLinks = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        background: "var(--ink)",
        borderRadius: 18,
        padding: "12px 14px 12px 16px",
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", flexShrink: 0 }}>
        <span style={{
          width: 34, height: 34, borderRadius: 9, background: "var(--pitch-lime)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <FlagGlyph />
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: "0.02em", color: "#fff", lineHeight: 1 }}>
          OFFSIDE<br />TRAP
        </span>
      </Link>

      {/* Center links */}
      {showLinks && (
        <div className="lp-navlinks">
          {NAV_LINKS.map(({ label, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="lp-navlink"
              style={isActive(to) ? { color: "var(--pitch-lime)" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {actions ?? (
          <button
            onClick={() => navigate("/create-tactics")}
            style={{
              background: "var(--whistle-orange)", color: "var(--ink)",
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14,
              border: "none", padding: "11px 20px", borderRadius: 12, cursor: "pointer",
            }}
          >
            Open App
          </button>
        )}
      </div>
    </nav>
  );
};

export default TopNav;
