import React, { useState, useEffect, Suspense, lazy } from "react";
import { TacticEntity } from "../entities/TacticEntity.ts";
import { Link } from "react-router-dom";
import { TacticCard } from "../components/TacticCard";
import type { TacticSummary } from "../../../../packages/shared";
import { Plus, ArrowUpRight, Clock, TrendingUp, Award, Share2, MousePointer2 } from "lucide-react";

const TacticsHero3D = lazy(() => import("../components/TacticsHero3D"));

/* Faint pitch-line artwork for the hero cards */
const PitchArt: React.FC<{ accent: string; flip?: boolean }> = ({ accent, flip }) => (
  <svg
    className="hero-art"
    viewBox="0 0 400 220"
    preserveAspectRatio="xMaxYMid slice"
    style={flip ? { transform: "scaleX(-1)" } : undefined}
  >
    {/* half-pitch lines anchored to the right edge */}
    <g stroke={accent} strokeWidth="1.5" fill="none" opacity="0.16">
      <circle cx="400" cy="110" r="80" />
      <circle cx="400" cy="110" r="3" fill={accent} stroke="none" />
      <rect x="260" y="-20" width="280" height="260" rx="2" />
      <rect x="310" y="35" width="140" height="150" rx="2" />
    </g>
    <g stroke={accent} strokeWidth="1" fill="none" opacity="0.08">
      <circle cx="400" cy="110" r="130" />
    </g>
  </svg>
);

const Home: React.FC = () => {
  const [tactics, setTactics] = useState<TacticSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "featured" | "latest">("latest");
  const [heroActive, setHeroActive] = useState(false);

  useEffect(() => {
    loadTactics();
  }, [activeTab]);

  const loadTactics = async () => {
    setLoading(true);
    try {
      const data = await TacticEntity.list({ sortBy: activeTab });
      setTactics(data);
    } catch {
      setTactics([]);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  const TABS = [
    { value: "latest" as const, label: "Latest", icon: Clock },
    { value: "trending" as const, label: "Trending", icon: TrendingUp },
    { value: "featured" as const, label: "Featured", icon: Award },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>

      {/* Top context bar */}
      <div
        className="glass-bar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 32px",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="kicker">Tactical Dashboard</span>
          <span style={{ color: "var(--surface-high)", fontSize: 10 }}>·</span>
          <span className="kicker" style={{ fontWeight: 400 }}>{dateStr}</span>
        </div>
        <button className="icon-btn" title="Share">
          <Share2 size={14} />
        </button>
      </div>

      <div style={{ padding: "36px 32px 48px", maxWidth: 1280, margin: "0 auto" }}>

        {/* 3D hero — interactive tactics board */}
        <section
          className="hero3d"
          onMouseEnter={() => setHeroActive(true)}
          onMouseLeave={() => setHeroActive(false)}
        >
          <Suspense fallback={null}>
            <TacticsHero3D active={heroActive} />
          </Suspense>

          {/* Overlay copy — lets pointer events pass through to the board */}
          <div className="hero3d-overlay">
            <div className="kicker" style={{ marginBottom: 12, color: "var(--accent-pink)", fontSize: 11 }}>The Offside Trap</div>
            <h1
              className="display-title"
              style={{ fontSize: "2.75rem", fontWeight: 700, margin: 0, lineHeight: 1.12, letterSpacing: "-0.02em" }}
            >
              Design football tactics<br />in motion.
            </h1>
            <p style={{ fontSize: 14.5, color: "var(--on-surface-variant)", marginTop: 14, maxWidth: 460, lineHeight: 1.6 }}>
              Build animated tactical breakdowns, craft 3D lineups, and export
              match-ready visuals — all in one place.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 24, pointerEvents: "auto" }}>
              <Link to="/create-tactics">
                <button className="btn-primary">Open Tactics Studio</button>
              </Link>
              <Link to="/create-lineups">
                <button className="btn-ghost">Create 3D Lineup</button>
              </Link>
            </div>
          </div>

          <div className="hint-pill">
            <MousePointer2 size={11} />
            Move your cursor — watch the press unfold
          </div>
        </section>

        {/* Hero row: Create cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Create New Tactics Studio — big hero card */}
          <Link to="/create-tactics" className="hero-card" style={{ background: "var(--pastel-mint)" }}>
            <PitchArt accent="#0fa45f" />
            <div style={{ position: "relative" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(15,164,95,0.25)",
                color: "var(--accent-mint)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 99,
                marginBottom: 18,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-mint)", display: "inline-block" }} />
                Studio
              </div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "var(--on-surface)",
                margin: 0,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}>
                Create New<br />Tactics Studio
              </h2>
              <p style={{ fontSize: 12.5, color: "var(--on-surface-variant)", marginTop: 10, lineHeight: 1.55, maxWidth: 300 }}>
                Build tactical breakdowns with animation, player markers, and field-of-view tools.
              </p>
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <span className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", fontSize: 12 }}>
                <Plus size={13} strokeWidth={2.5} />
                Create
              </span>
              <ArrowUpRight size={18} className="hero-arrow" />
            </div>
          </Link>

          {/* Create New Lineup */}
          <Link to="/create-lineups" className="hero-card" style={{ background: "var(--pastel-lavender)" }}>
            <PitchArt accent="#6f68f2" flip />
            <div style={{ position: "relative" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(111,104,242,0.30)",
                color: "var(--accent-lavender)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 99,
                marginBottom: 18,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-lavender)", display: "inline-block" }} />
                3D Lineup
              </div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "var(--on-surface)",
                margin: 0,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}>
                Create New<br />Lineup
              </h2>
              <p style={{ fontSize: 12.5, color: "var(--on-surface-variant)", marginTop: 10, lineHeight: 1.55, maxWidth: 280 }}>
                3D perspective field with rotation, tilt, and zoom controls.
              </p>
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#ffffff",
                border: "1.5px solid var(--accent-lavender)",
                color: "var(--accent-lavender)",
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 18px",
                borderRadius: 999,
                fontFamily: "var(--font-display)",
              }}>
                <Plus size={13} strokeWidth={2.5} />
                Create
              </span>
              <ArrowUpRight size={18} className="hero-arrow" />
            </div>
          </Link>

        </div>

        {/* Tabs + Tactics grid */}
        <div style={{ marginTop: 48 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div className="kicker" style={{ marginBottom: 6 }}>Library</div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--on-surface)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}>
                Tactics Library
              </h2>
            </div>
            <div className="seg-tabs">
              {TABS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`seg-tab${activeTab === value ? " active" : ""}`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : tactics.length === 0 ? (
            <div className="empty-state">
              {/* mini pitch glyph */}
              <svg width="56" height="40" viewBox="0 0 56 40" style={{ margin: "0 auto 16px", display: "block", opacity: 0.7 }}>
                <g stroke="var(--outline)" strokeWidth="1.5" fill="none">
                  <rect x="1" y="1" width="54" height="38" rx="3" />
                  <line x1="28" y1="1" x2="28" y2="39" />
                  <circle cx="28" cy="20" r="6" />
                </g>
                <circle cx="28" cy="20" r="1.5" fill="var(--primary)" />
              </svg>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--on-surface)", marginBottom: 6 }}>
                No tactics yet
              </div>
              <p style={{ fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 24 }}>
                Create your first tactic to get started
              </p>
              <Link to="/create-tactics">
                <button className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Plus size={15} strokeWidth={2.5} />
                  Create Tactic
                </button>
              </Link>
            </div>
          ) : (
            <div className="tactics-grid">
              {tactics.map((tactic: TacticSummary) => (
                <TacticCard key={tactic.id} tactic={tactic} />
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default Home;
