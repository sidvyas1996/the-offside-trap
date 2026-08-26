import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";

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
        <Logo size={34} />
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
