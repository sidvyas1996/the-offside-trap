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

      {/* Main app — sidebar layout */}
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
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
        width: 220,
        flexShrink: 0,
        background: "var(--surface-container)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 20px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--outline)", marginBottom: 4 }}>
          The Offside Trap
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--primary)", lineHeight: 1.2 }}>
          Tactical<br />Platform
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--on-surface)" : "var(--on-surface-variant)",
                background: active ? "var(--surface-high)" : "transparent",
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              <Icon
                size={16}
                style={{ color: active ? "var(--primary)" : "var(--outline)", flexShrink: 0 }}
              />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* New Project button */}
      <div style={{ padding: "16px 12px 24px" }}>
        <NavLink
          to="/create-tactics"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary-light), var(--primary))",
            color: "var(--on-primary)",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          <Plus size={15} />
          New Project
        </NavLink>
        {/* User avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "8px 4px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--surface-high)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "var(--primary)",
            flexShrink: 0,
          }}>
            SV
          </div>
          <div>
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
