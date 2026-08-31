import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext";

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

/**
 * Right-hand nav action.
 *
 * Signed in this is the account entry point; signed out it still has to do
 * something, so it falls back to sign-in rather than dead-ending on a profile
 * page the gate would bounce straight back.
 */
const ProfileButton: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <button
        onClick={() => navigate("/login")}
        style={{
          background: "var(--whistle-orange)", color: "var(--ink)",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14,
          border: "var(--border-w) solid var(--ink)", padding: "11px 20px",
          borderRadius: 12, cursor: "pointer",
        }}
      >
        Sign in
      </button>
    );
  }

  const initials = (user.username || "?").trim().slice(0, 2).toUpperCase();

  return (
    <button
      onClick={() => navigate("/profile")}
      aria-label={`Open profile for ${user.username}`}
      title={user.username}
      style={{
        width: 42, height: 42, borderRadius: 999, flexShrink: 0, cursor: "pointer",
        padding: 0, overflow: "hidden",
        background: "var(--primary)", color: "var(--on-primary)",
        border: "var(--border-w) solid var(--ink)", boxShadow: "var(--card-shadow)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14,
      }}
    >
      {user.avatar
        ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </button>
  );
};

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
        {actions ?? <ProfileButton />}
      </div>
    </nav>
  );
};

export default TopNav;
