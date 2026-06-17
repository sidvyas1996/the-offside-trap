import React, { useState, useEffect, useRef } from "react";
import { TacticEntity } from "../entities/TacticEntity.ts";
import { Link, useNavigate } from "react-router-dom";
import { TacticCard } from "../components/TacticCard";
import TopNav from "../components/TopNav";
import HeroPitch from "../components/HeroPitch";
import type { TacticSummary } from "../../../../packages/shared";
import {
  Plus, ArrowRight, Clock, TrendingUp, Award,
  Clapperboard, Box, Image as ImageIcon,
} from "lucide-react";

const FEATURES = [
  { icon: Clapperboard, bg: "var(--pitch-lime)", title: "Tactics Studio", body: "Animate presses, passing lanes and runs on a live board.", to: "/create-tactics" },
  { icon: Box, bg: "var(--keeper-blue)", title: "3D Lineups", body: "Rotate, tilt and kit out your XI in real perspective.", to: "/create-lineups" },
  { icon: ImageIcon, bg: "var(--card-yellow)", title: "Export anywhere", body: "Match‑ready PNG, JPG and animated clips in a click.", to: "/create-tactics" },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [tactics, setTactics] = useState<TacticSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "featured" | "latest">("latest");
  const [heroActive, setHeroActive] = useState(false);
  const libraryRef = useRef<HTMLDivElement>(null);

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

  const TABS = [
    { value: "latest" as const, label: "Latest", icon: Clock },
    { value: "trending" as const, label: "Trending", icon: TrendingUp },
    { value: "featured" as const, label: "Featured", icon: Award },
  ];

  return (
    <div className="dot-bg" style={{ minHeight: "100vh", padding: "22px clamp(16px, 4vw, 30px) 70px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>

        {/* ── NAV ── */}
        <TopNav />

        {/* ── HERO — perspective pitch as full-bleed background, copy on top ── */}
        <section
          className="hero-stage"
          onMouseEnter={() => setHeroActive(true)}
          onMouseLeave={() => setHeroActive(false)}
        >
          {/* pitch background */}
          <HeroPitch active={heroActive} />
          {/* gentle left scrim for copy legibility */}
          <div className="hero-scrim" />

          {/* copy */}
          <div className="hero-copy">
            <div className="kicker" style={{ fontSize: 13, letterSpacing: "0.16em", marginBottom: 14 }}>
              The Offside Trap · Tactics, in motion
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "clamp(48px, 7vw, 104px)", lineHeight: 0.9, letterSpacing: "-0.035em",
              maxWidth: 720, margin: 0, color: "var(--ink)", textWrap: "balance" as React.CSSProperties["textWrap"],
            }}>
              Out‑coach every opponent.
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 17, lineHeight: 1.5, color: "#3f3b30", margin: "20px 0 0", maxWidth: 420 }}>
              Build animated tactical breakdowns, craft 3D lineups, and export match‑ready visuals — all in one place.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 26 }}>
              <button
                onClick={() => navigate("/create-tactics")}
                style={{
                  background: "var(--ink)", color: "#fff", fontFamily: "var(--font-display)",
                  fontWeight: 800, fontSize: 15, border: "none", padding: "14px 22px",
                  borderRadius: 13, cursor: "pointer",
                }}
              >
                Open Tactics Studio
              </button>
              <button
                onClick={() => navigate("/create-tactics")}
                aria-label="Open Tactics Studio"
                style={{
                  width: 50, height: 50, borderRadius: 13, background: "var(--surface)",
                  border: "1.5px solid var(--ink)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <ArrowRight size={20} strokeWidth={2.2} color="var(--ink)" />
              </button>
            </div>
          </div>
        </section>

        {/* ── FEATURE STRIP ── */}
        <section className="lp-features" style={{ marginTop: 46 }}>
          {FEATURES.map(({ icon: Icon, bg, title, body, to }) => (
            <Link key={title} to={to} className="sleek-card" style={{
              background: "var(--surface-high)", border: "1.5px solid var(--ink)",
              borderRadius: 18, padding: 24, textDecoration: "none", display: "block",
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, background: bg, border: "1.5px solid var(--ink)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Icon size={24} color="var(--ink)" strokeWidth={2.2} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, marginBottom: 6, color: "var(--ink)" }}>
                {title}
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 15, lineHeight: 1.5, color: "#56503f", margin: 0 }}>
                {body}
              </p>
            </Link>
          ))}
        </section>

        {/* ── TACTICS LIBRARY ── */}
        <section ref={libraryRef} style={{ marginTop: 64, scrollMarginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="kicker" style={{ marginBottom: 6 }}>Library</div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 900,
                color: "var(--ink)", margin: 0, letterSpacing: "-0.02em",
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
            <div className="tactics-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : tactics.length === 0 ? (
            <div className="empty-state">
              <svg width="56" height="40" viewBox="0 0 56 40" style={{ margin: "0 auto 16px", display: "block", opacity: 0.8 }}>
                <g stroke="var(--ink)" strokeWidth="2" fill="none">
                  <rect x="1" y="1" width="54" height="38" rx="3" />
                  <line x1="28" y1="1" x2="28" y2="39" />
                  <circle cx="28" cy="20" r="6" />
                </g>
                <circle cx="28" cy="20" r="1.5" fill="var(--ink)" />
              </svg>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
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
        </section>

      </div>
    </div>
  );
};

export default Home;
