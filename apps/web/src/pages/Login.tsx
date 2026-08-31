import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../components/Logo";

type Mode = "signin" | "signup";

/* Decorative brutalist confetti behind the card */
const Shapes: React.FC = () => (
  <>
    <div style={{ position: "absolute", top: -70, left: -70, width: 230, height: 230, borderRadius: "50%", background: "var(--playmaker-purple)", border: "var(--border-w) solid var(--ink)", opacity: 0.9 }} />
    <div style={{ position: "absolute", bottom: -60, right: -40, width: 190, height: 190, borderRadius: "50%", background: "var(--card-yellow)", border: "var(--border-w) solid var(--ink)" }} />
    <div style={{ position: "absolute", top: "18%", right: "12%", width: 52, height: 52, background: "var(--striker-pink)", border: "var(--border-w) solid var(--ink)", borderRadius: 14, transform: "rotate(14deg)", boxShadow: "var(--card-shadow)" }} />
    <div style={{ position: "absolute", bottom: "16%", left: "10%", width: 44, height: 44, background: "var(--pitch-lime)", border: "var(--border-w) solid var(--ink)", borderRadius: "50%", boxShadow: "var(--card-shadow)" }} />
  </>
);

/**
 * Sign in / create account. On success the caller is sent to the onboarding
 * profile picker if they have not chosen a profile yet, otherwise to wherever
 * they were originally headed.
 *
 * NOTE: the backend's /auth/login does not verify the password today (there is
 * no password column on User) — it issues a token for any known email. The
 * field is here for when hashing lands; do not read it as real authentication.
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const isSignup = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignup && !username)) {
      setErrorMsg(
        isSignup ? "Fill in every field to join." : "Enter your email and password.",
      );
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const user = isSignup
        ? await signUp(email, password, username)
        : await signIn(email, password);

      // First login (or any account without a profile) lands on onboarding.
      navigate(user?.profile ? from : "/onboarding", { replace: true });
    } catch (error: any) {
      setErrorMsg(
        error?.response?.data?.error ||
          error?.message ||
          "Something went wrong. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="dot-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Shapes />

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          position: "relative",
        }}
      >
        {/* Brand pill */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "var(--ink)",
              color: "var(--pitch-lime)",
              border: "var(--border-w) solid var(--ink)",
              borderRadius: 999,
              padding: "8px 20px",
              boxShadow: "4px 4px 0 rgba(21,20,15,0.25)",
              transform: "rotate(-2deg)",
            }}
          >
            <Logo size={22} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>
              THE OFFSIDE TRAP
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--surface-container)",
            border: "var(--border-w) solid var(--ink)",
            borderRadius: 24,
            boxShadow: "var(--card-shadow-hover)",
            padding: "34px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: 28,
                letterSpacing: "-0.03em",
                color: 'var(--on-surface)',
              }}
            >
              {isSignup ? "Join the squad." : "Back on the pitch."}
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "var(--on-surface-variant)", fontWeight: 600 }}>
              {isSignup
                ? "Create an account to build, animate and share your tactics."
                : "Sign in to build, animate and share your tactics."}
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--pastel-pink)",
                border: "var(--border-w) solid var(--ink)",
                borderRadius: 14,
                padding: "10px 14px",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--striker-pink)",
                  border: "var(--border-w) solid var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: 13,
                  color: 'var(--on-surface)',
                }}
              >
                !
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="login-email" className="auth-label">
                  Email
                </label>
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="coach@club.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                />
              </div>

              {isSignup && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="login-username" className="auth-label">
                    Username
                  </label>
                  <input
                    id="login-username"
                    className="auth-input"
                    type="text"
                    placeholder="gegenpress_gus"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    minLength={3}
                    maxLength={20}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMsg("");
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label htmlFor="login-password" className="auth-label">
                    Password
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => setErrorMsg("Password resets aren't set up yet — ask an admin.")}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--playmaker-purple)",
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                        cursor: "pointer",
                      }}
                    >
                      Forgot it?
                    </button>
                  )}
                </div>
                <input
                  id="login-password"
                  className="auth-input"
                  type="password"
                  placeholder="••••••••"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading && <span className="auth-spinner" />}
              <span>
                {loading
                  ? isSignup
                    ? "Creating account…"
                    : "Signing in…"
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
              </span>
            </button>
          </form>
        </div>

        <p style={{ margin: 0, textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--on-surface-variant)" }}>
          {isSignup ? "Already have an account? " : "No account yet? "}
          <button
            type="button"
            className="auth-textlink"
            style={{ fontSize: 13 }}
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setErrorMsg("");
            }}
          >
            {isSignup ? "Sign in" : "Join the squad"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
