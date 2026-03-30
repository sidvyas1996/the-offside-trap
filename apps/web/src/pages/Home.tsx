import React, { useState, useEffect } from "react";
import { TacticEntity } from "../entities/TacticEntity.ts";
import { Link } from "react-router-dom";
import { TacticCard } from "../components/TacticCard";
import type { TacticSummary } from "../../../../packages/shared";
import { Plus, ArrowUpRight, Clock, TrendingUp, Award, Share2 } from "lucide-react";

const Home: React.FC = () => {
  const [tactics, setTactics] = useState<TacticSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "featured" | "latest">("latest");

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
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 32px",
        background: "var(--surface-low)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--outline)", textTransform: "uppercase" }}>
            Tactical Dashboard
          </span>
          <span style={{ color: "var(--surface-high)", fontSize: 10 }}>·</span>
          <span style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--outline)", textTransform: "uppercase" }}>
            {dateStr}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--outline)", padding: 6, borderRadius: 6, display: "flex" }}>
            <Share2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: "32px 32px 0" }}>

        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "2.25rem",
            fontWeight: 700,
            color: "var(--on-surface)",
            margin: 0,
            lineHeight: 1.15,
          }}>
            Tactical Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "var(--on-surface-variant)", marginTop: 6 }}>
            Manage your high-performance tactical breakdowns and match preparations.
          </p>
        </div>

        {/* Hero row: Create cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Create New Tactics Studio — big hero card */}
          <Link
            to="/create-tactics"
            style={{
              gridColumn: "span 1",
              background: "var(--surface-highest)",
              borderRadius: 16,
              padding: 28,
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 220,
              position: "relative",
              overflow: "hidden",
              transition: "background 0.2s",
            }}
          >
            {/* Decorative pitch background */}
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 80% 50%, rgba(206,252,34,0.06) 0%, transparent 60%)",
              pointerEvents: "none",
            }} />
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(206,252,34,0.12)",
                color: "var(--primary)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 99,
                marginBottom: 16,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} />
                Studio
              </div>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--on-surface)",
                margin: 0,
                lineHeight: 1.3,
              }}>
                CREATE NEW<br />TACTICS STUDIO
              </h2>
              <p style={{ fontSize: 12, color: "var(--on-surface-variant)", marginTop: 8, lineHeight: 1.5 }}>
                Build tactical breakdowns with animation, player markers, and field-of-view tools.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "linear-gradient(135deg, var(--primary-light), var(--primary))",
                color: "var(--on-primary)",
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 14px",
                borderRadius: 8,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                <Plus size={13} />
                Create
              </div>
              <ArrowUpRight size={16} style={{ color: "var(--outline)" }} />
            </div>
          </Link>

          {/* Create New Lineup */}
          <Link
            to="/create-lineups"
            style={{
              background: "var(--surface-high)",
              borderRadius: 16,
              padding: 24,
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 220,
              position: "relative",
              overflow: "hidden",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 20% 80%, rgba(199,236,194,0.05) 0%, transparent 60%)",
              pointerEvents: "none",
            }} />
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(199,236,194,0.10)",
                color: "#c7ecc2",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 99,
                marginBottom: 16,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c7ecc2", display: "inline-block" }} />
                3D Lineup
              </div>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--on-surface)",
                margin: 0,
                lineHeight: 1.3,
              }}>
                CREATE NEW<br />LINEUP
              </h2>
              <p style={{ fontSize: 12, color: "var(--on-surface-variant)", marginTop: 8, lineHeight: 1.5 }}>
                3D perspective field with rotation, tilt, and zoom controls.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(199,236,194,0.12)",
                color: "#c7ecc2",
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 14px",
                borderRadius: 8,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                <Plus size={13} />
                Create
              </div>
              <ArrowUpRight size={16} style={{ color: "var(--outline)" }} />
            </div>
          </Link>

        </div>

        {/* Tabs + Tactics grid */}
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--on-surface)",
              margin: 0,
            }}>
              Tactics Library
            </h2>
            <div style={{ display: "flex", gap: 4, background: "var(--surface-low)", padding: 4, borderRadius: 10 }}>
              {TABS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 14px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: activeTab === value ? 600 : 400,
                    background: activeTab === value ? "var(--surface-highest)" : "transparent",
                    color: activeTab === value ? "var(--on-surface)" : "var(--on-surface-variant)",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: "var(--surface-highest)", borderRadius: 14, height: 200, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : tactics.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "var(--surface-low)",
              borderRadius: 16,
            }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--on-surface)", marginBottom: 8 }}>
                No tactics yet
              </div>
              <p style={{ fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 20 }}>
                Create your first tactic to get started
              </p>
              <Link to="/create-tactics">
                <button className="btn-primary">Create Tactic</button>
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
