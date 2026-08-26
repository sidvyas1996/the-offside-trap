import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import type { UserProfile } from "../../../../packages/shared";

/* ------------------------------------------------------------------ */
/* Profile catalogue                                                   */
/* ------------------------------------------------------------------ */

interface ProfileOption {
  id: UserProfile;
  label: string;
  tagline: string;
  /** Card fill. */
  bg: string;
  /** Text colour that sits on the fill. */
  fg: string;
  /** Illustration file in /public/profiles — see the README there. */
  slug: string;
}

const GRID_PROFILES: ProfileOption[] = [
  { id: "COACH", label: "Coach", tagline: "Drill the press", bg: "var(--pitch-lime)", fg: "var(--ink)", slug: "coach" },
  { id: "MANAGER", label: "Manager", tagline: "Run the club", bg: "var(--keeper-blue)", fg: "#ffffff", slug: "manager" },
  { id: "PLAYER", label: "Player", tagline: "Make the runs", bg: "var(--striker-pink)", fg: "var(--ink)", slug: "player" },
  { id: "FAN", label: "Fan", tagline: "Back the team", bg: "var(--whistle-orange)", fg: "var(--ink)", slug: "fan" },
];

const WIDE_PROFILE: ProfileOption = {
  id: "ENTHUSIAST",
  label: "Enthusiast",
  tagline: "Study the tactics, follow the game",
  bg: "var(--card-yellow)",
  fg: "var(--ink)",
  slug: "enthusiast",
};

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

/* ------------------------------------------------------------------ */
/* Avatar — illustration slot with a graceful fallback                 */
/* ------------------------------------------------------------------ */

const ProfileAvatar: React.FC<{ slug: string; label: string; size: number }> = ({
  slug,
  label,
  size,
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--surface-high)",
        border: "2.5px solid var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {failed ? (
        /* Placeholder head-and-shoulders glyph until the artwork is dropped in */
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8.5" r="4" stroke="var(--ink)" strokeWidth="2" />
          <path d="M4.5 21c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <img
          src={`/profiles/${slug}.png`}
          alt={`${label} avatar`}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Radio pip                                                           */
/* ------------------------------------------------------------------ */

const Pip: React.FC<{ selected: boolean; size?: number }> = ({ selected, size = 26 }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: selected ? "var(--ink)" : "var(--surface-high)",
      border: "2.5px solid var(--ink)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transition: "background 0.12s",
    }}
  >
    {selected && <Check size={size * 0.55} strokeWidth={3.5} color="var(--pitch-lime)" />}
  </span>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateMe } = useAuth();

  const [selected, setSelected] = useState<UserProfile | null>(user?.profile ?? null);
  const [username, setUsername] = useState(user?.username ?? "");
  const [availability, setAvailability] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const trimmed = username.trim();
  const unchanged = trimmed === (user?.username ?? "");

  const formatError = useMemo(() => {
    if (!trimmed) return "";
    if (trimmed.length < 3) return "At least 3 characters";
    if (trimmed.length > 20) return "20 characters max";
    if (!USERNAME_RE.test(trimmed)) return "Letters, numbers and underscores only";
    return "";
  }, [trimmed]);

  /* Debounced uniqueness check */
  useEffect(() => {
    if (formatError || !trimmed) {
      setAvailability("idle");
      return;
    }
    if (unchanged) {
      setAvailability("free");
      return;
    }

    setAvailability("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/users/username-available", { params: { username: trimmed } });
        setAvailability(res.data.data.available ? "free" : "taken");
      } catch {
        // Network/validation hiccup — let the submit call be the source of truth
        setAvailability("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [trimmed, formatError, unchanged]);

  const canContinue =
    !!selected && !!trimmed && !formatError && availability !== "taken" && !submitting;

  const handleContinue = async () => {
    if (!canContinue || !selected) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      await updateMe({
        profile: selected,
        ...(unchanged ? {} : { username: trimmed }),
      });
      navigate("/", { replace: true });
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setAvailability("taken");
        setErrorMsg("That username is already taken.");
      } else {
        setErrorMsg(
          error?.response?.data?.error || "Could not save your profile. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cardBase = (isSelected: boolean): React.CSSProperties => ({
    border: "2.5px solid var(--ink)",
    borderRadius: 22,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--font-body)",
    boxShadow: isSelected ? "6px 6px 0 var(--ink)" : "3px 3px 0 var(--ink)",
    transform: isSelected ? "translate(-3px, -3px)" : "none",
    transition: "box-shadow 0.12s, transform 0.12s",
  });

  return (
    <div
      className="dot-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "clamp(24px, 6vw, 56px) 20px 40px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* ── Heading ── */}
        <div className="kicker" style={{ marginBottom: 10 }}>
          Welcome to the squad 👋
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(38px, 11vw, 52px)",
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            margin: "0 0 14px",
          }}
        >
          Choose your profile
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.45,
            color: "var(--on-surface-variant)",
            margin: "0 0 26px",
          }}
        >
          Pick the role that fits you best. You can change it later.
        </p>

        {/* ── Profile cards ── */}
        <div role="radiogroup" aria-label="Profile">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {GRID_PROFILES.map((p) => {
              const isSelected = selected === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(p.id)}
                  style={{
                    ...cardBase(isSelected),
                    background: p.bg,
                    padding: "18px 14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", top: 10, right: 10 }}>
                    <Pip selected={isSelected} size={22} />
                  </span>
                  <ProfileAvatar slug={p.slug} label={p.label} size={92} />
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 21,
                      letterSpacing: "-0.02em",
                      color: p.fg,
                      lineHeight: 1.1,
                    }}
                  >
                    {p.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: p.fg, opacity: 0.85, marginTop: -6 }}>
                    {p.tagline}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wide card */}
          {(() => {
            const isSelected = selected === WIDE_PROFILE.id;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(WIDE_PROFILE.id)}
                style={{
                  ...cardBase(isSelected),
                  background: WIDE_PROFILE.bg,
                  width: "100%",
                  marginTop: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <ProfileAvatar slug={WIDE_PROFILE.slug} label={WIDE_PROFILE.label} size={76} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 21,
                      letterSpacing: "-0.02em",
                      color: WIDE_PROFILE.fg,
                      lineHeight: 1.1,
                    }}
                  >
                    {WIDE_PROFILE.label}
                  </span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: WIDE_PROFILE.fg, opacity: 0.85, marginTop: 3 }}>
                    {WIDE_PROFILE.tagline}
                  </span>
                </span>
                <Pip selected={isSelected} />
              </button>
            );
          })()}
        </div>

        {/* ── Username ── */}
        <div style={{ marginTop: 26 }}>
          <label
            htmlFor="onboarding-username"
            className="kicker"
            style={{ display: "block", marginBottom: 8 }}
          >
            Pick a username
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--surface-high)",
              border: "2.5px solid var(--ink)",
              borderRadius: 14,
              padding: "0 14px",
              boxShadow: "3px 3px 0 var(--ink)",
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--outline)" }}>
              @
            </span>
            <input
              id="onboarding-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="gegenpress_gus"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={20}
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "13px 0",
                fontFamily: "var(--font-body)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            />
            {availability === "free" && !formatError && (
              <Check size={18} strokeWidth={3} color="var(--grass-green)" />
            )}
          </div>

          <div style={{ minHeight: 20, marginTop: 7, fontSize: 13, fontWeight: 600 }}>
            {formatError ? (
              <span style={{ color: "var(--whistle-orange)" }}>{formatError}</span>
            ) : availability === "checking" ? (
              <span style={{ color: "var(--on-surface-variant)" }}>Checking…</span>
            ) : availability === "taken" ? (
              <span style={{ color: "var(--whistle-orange)" }}>That username is taken.</span>
            ) : availability === "free" && !unchanged ? (
              <span style={{ color: "var(--grass-green)" }}>Nice one — that's free.</span>
            ) : (
              <span style={{ color: "var(--on-surface-variant)" }}>
                This is how other managers will find you.
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              marginTop: 12,
              padding: "11px 14px",
              borderRadius: 12,
              border: "2.5px solid var(--ink)",
              background: "var(--pastel-pink)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ── Continue ── */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          style={{
            width: "100%",
            marginTop: 22,
            padding: "17px 22px",
            borderRadius: 999,
            border: "2.5px solid var(--ink)",
            background: "var(--ink)",
            color: "#ffffff",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 19,
            letterSpacing: "0.01em",
            cursor: canContinue ? "pointer" : "not-allowed",
            opacity: canContinue ? 1 : 0.45,
            boxShadow: canContinue ? "0 6px 0 var(--pitch-lime)" : "none",
            transition: "opacity 0.12s, box-shadow 0.12s",
          }}
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
