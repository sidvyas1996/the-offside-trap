import React from "react";
import { Routes, Route, Navigate, BrowserRouter, useLocation, NavLink } from "react-router-dom";
import { LayoutDashboard, Swords, Users, Settings, Plus } from "lucide-react";
import Home from "./pages/Home";
import TacticsDetails from "./pages/TacticsDetails.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import CreateTactics from "./pages/CreateTactics.tsx";
import CreateLineups from "./pages/CreateLineups.tsx";
import ExportPreview from "./pages/ExportPreview.tsx";
import TacticsExportPreview from "./pages/TacticsExportPreview.tsx";
import { CreateTacticsProvider } from "./contexts/CreateTacticsContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Export preview routes — no layout */}
      <Route path="/export-preview" element={<ExportPreview />} />
      <Route path="/tactics-export-preview" element={<TacticsExportPreview />} />

      {/* Studio routes — full-screen, no sidebar */}
      <Route
        path="/create"
        element={
          <CreateTacticsProvider>
            <CreateTactics />
          </CreateTacticsProvider>
        }
      />
      <Route
        path="/create-tactics"
        element={
          <CreateTacticsProvider>
            <CreateTactics />
          </CreateTacticsProvider>
        }
      />
      <Route
        path="/create-lineups"
        element={
          <CreateTacticsProvider>
            <CreateLineups />
          </CreateTacticsProvider>
        }
      />
      <Route
        path="/edit-tactics/:id"
        element={
          <CreateTacticsProvider>
            <CreateTactics />
          </CreateTacticsProvider>
        }
      />
      <Route
        path="/edit-lineups/:id"
        element={
          <CreateTacticsProvider>
            <CreateLineups />
          </CreateTacticsProvider>
        }
      />

      {/* Landing page — standalone, no sidebar */}
      <Route path="/" element={<Home />} />

      {/* Main app — sidebar layout */}
      <Route
        path="/tactics/:id"
        element={
          <Layout>
            <TacticsDetails />
          </Layout>
        }
      />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/create-tactics", icon: Swords, label: "Tactics Studio" },
  { to: "/create-lineups", icon: Users, label: "Lineup Creator" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        background: "var(--surface-container)",
        borderRight: "2px solid var(--ink)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        {/* Logo mark — pitch glyph */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "var(--primary)",
          border: "2.5px solid var(--ink)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "3px 3px 0 var(--ink)",
        }}>
          <svg width="20" height="15" viewBox="0 0 28 20">
            <g stroke="var(--ink)" strokeWidth="2.4" fill="none">
              <rect x="1" y="1" width="26" height="18" rx="2" />
              <line x1="14" y1="1" x2="14" y2="19" />
              <circle cx="14" cy="10" r="3.5" />
            </g>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--outline)" }}>
            The Offside Trap
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--on-surface)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            Tactical Platform
          </div>
        </div>
      </div>

      <div style={{ height: 2, background: "var(--ink)", margin: "0 16px 14px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        <div className="kicker" style={{ padding: "0 12px", marginBottom: 8 }}>Menu</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className={`nav-item${active ? " active" : ""}`}>
              <Icon size={16} className="nav-icon" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* New Project button */}
      <div style={{ padding: "16px 16px 20px" }}>
        <NavLink
          to="/create-tactics"
          className="btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 11,
            fontSize: 13,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Project
        </NavLink>
        {/* User avatar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginTop: 14,
          padding: "10px 12px", borderRadius: 12,
          background: "var(--surface-low)", border: "2px solid var(--ink)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", position: "relative",
            background: "var(--keeper-blue)",
            border: "2px solid var(--ink)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--ink)",
            flexShrink: 0,
          }}>
            SV
            <span style={{
              position: "absolute", right: -2, bottom: -2, width: 9, height: 9,
              borderRadius: "50%", background: "var(--grass-green)",
              border: "2px solid var(--surface-low)",
            }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface)" }}>Analyst</div>
            <div style={{ fontSize: 10, color: "var(--on-surface-variant)" }}>Free plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--surface)" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
};

export default App;
