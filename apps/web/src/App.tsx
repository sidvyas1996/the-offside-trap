import React from "react";
import { Routes, Route, Navigate, BrowserRouter, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import TacticsDetails from "./pages/TacticsDetails.tsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import CreateTactics from "./pages/CreateTactics.tsx";
import Login from "./pages/Login.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Profile from "./pages/Profile.tsx";
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
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Home />} />

      {/* Tactic details — carries the TopNav pill itself, like the landing page */}
      <Route path="/tactics/:id" element={<TacticsDetails />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
