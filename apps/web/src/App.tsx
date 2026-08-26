import React from "react";
import { Routes, Route, Navigate, BrowserRouter, useLocation, NavLink } from "react-router-dom";
import { LayoutDashboard, Swords, Users, Settings, Plus } from "lucide-react";
import Home from "./pages/Home";
import TacticsDetails from "./pages/TacticsDetails.tsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import CreateTactics from "./pages/CreateTactics.tsx";
import Login from "./pages/Login.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import CreateLineups from "./pages/CreateLineups.tsx";
import ExportPreview from "./pages/ExportPreview.tsx";
import TacticsExportPreview from "./pages/TacticsExportPreview.tsx";
import { CreateTacticsProvider } from "./contexts/CreateTacticsContext";
import Logo from "./components/Logo";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

/** Full-page hold while the session is being restored. */
const AuthLoading: React.FC = () => (
  <div
    className="dot-bg"
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 15,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--outline)",
    }}
  >
    Warming up…
  </div>
);

/**
 * Gate for the app proper: needs a session, and a profile chosen. A signed-in
 * user who has not picked a profile yet is sent to onboarding first.
 */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!user.profile) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

/** Gate for onboarding itself: needs a session, but no profile yet. */
const RequireSession: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Export preview routes — no layout */}
      <Route path="/export-preview" element={<ExportPreview />} />
      <Route path="/tactics-export-preview" element={<TacticsExportPreview />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route
        path="/onboarding"
        element={
          <RequireSession>
            <Onboarding />
          </RequireSession>
        }
      />

      {/* Studio routes — full-screen, no sidebar */}
      <Route
        path="/create"
        element={
          <RequireAuth>
            <CreateTacticsProvider>
              <CreateTactics />
            </CreateTacticsProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/create-tactics"
        element={
          <RequireAuth>
            <CreateTacticsProvider>
              <CreateTactics />
            </CreateTacticsProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/create-lineups"
        element={
          <RequireAuth>
            <CreateTacticsProvider>
              <CreateLineups />
            </CreateTacticsProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/edit-tactics/:id"
        element={
          <RequireAuth>
            <CreateTacticsProvider>
              <CreateTactics />
            </CreateTacticsProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/edit-lineups/:id"
        element={
          <RequireAuth>
            <CreateTacticsProvider>
              <CreateLineups />
            </CreateTacticsProvider>
          </RequireAuth>
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
        {/* Logo mark */}
        <Logo size={40} bordered />
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
