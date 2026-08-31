import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { TacticEntity } from "../entities/TacticEntity";
import { useIsMobile } from "../hooks/useMediaQuery";
import Logo from "../components/Logo";
import type { UserProfile } from "../../../../packages/shared/src";

/** Role label + the accent it carries on the card. */
const ROLE_META: Record<UserProfile, { label: string; accent: string }> = {
  COACH: { label: "Coach", accent: "var(--pitch-lime)" },
  MANAGER: { label: "Manager", accent: "var(--playmaker-purple)" },
  PLAYER: { label: "Player", accent: "var(--whistle-orange)" },
  FAN: { label: "Fan", accent: "var(--card-yellow)" },
  ENTHUSIAST: { label: "Enthusiast", accent: "var(--striker-pink)" },
};


/**
 * The card's foil grain.
 *
 * One dot per tile, sized as a fraction of the tile so the two grids below stay
 * proportional if the pitch is tuned. Kept small: at this size the dots read as
 * surface texture, and much larger they read as polka dots.
 */
const DOT_PITCH = 5;
/** Painted-dot geometry. Pitch is the grid spacing; MAX_R the radius under the light. */
const DOT_MAX_R = 2.9;
const DOT_TILE =
  "radial-gradient(circle at 50% 50%, #000 0 34%, transparent 38%)";


/**
 * Squad number.
 *
 * There is no number on the account, so it is hashed from the user id: stable
 * for a given user, and obviously arbitrary rather than pretending to be a
 * stat. Swap this for a real field the moment one exists.
 */
const squadNumber = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % 99) + 1;
};

const initialsOf = (name: string) =>
  name.trim().slice(0, 2).toUpperCase() || "??";

/**
 * Holographic profile card.
 *
 * The sheen is driven by pointer position written into two CSS custom
 * properties rather than by React state: it updates on every pointermove, and
 * re-rendering the card tree at that rate would drop frames for a purely visual
 * effect. Setting the variables on the element skips React entirely.
 *
 * `pointerType === 'mouse'` gates it — a finger sits *on* the thing it is
 * lighting, so on touch the sheen is hidden under the fingertip and the card
 * just renders flat.
 */
const HoloCard: React.FC<{
  name: string;
  handle: string;
  role: UserProfile | null | undefined;
  avatar?: string | null;
  number: number;
}> = ({ name, handle, role, avatar, number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef({ w: 0, h: 0, dpr: 1 });
  const [lit, setLit] = useState(false);
  const meta = role ? ROLE_META[role] : null;
  const portrait = avatar || (role ? `/profiles/${role.toLowerCase()}.png` : null);
  const [portraitFailed, setPortraitFailed] = useState(false);

  /**
   * Repaint the shimmer for a pointer position, in card-local pixels.
   *
   * Called straight from the pointermove handler rather than from a rAF loop:
   * pointermove is already delivered at most once per frame, so a loop would add
   * a frame of lag and keep burning cycles once the pointer stops.
   */
  const paint = useCallback((px: number, py: number, w: number, h: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    // Cap DPR at 2 — beyond that the dot count quadruples for detail nobody can
    // see at this size.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const surface = surfaceRef.current;
    if (surface.w !== w || surface.h !== h || surface.dpr !== dpr) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      surfaceRef.current = { w, h, dpr };
    }
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const reach = Math.max(w, h) * 0.5;
    // Walk only the cells the light can reach; the rest are transparent anyway.
    const gx0 = Math.max(0, Math.floor((px - reach) / DOT_PITCH));
    const gx1 = Math.min(Math.ceil(w / DOT_PITCH), Math.ceil((px + reach) / DOT_PITCH));
    const gy0 = Math.max(0, Math.floor((py - reach) / DOT_PITCH));
    const gy1 = Math.min(Math.ceil(h / DOT_PITCH), Math.ceil((py + reach) / DOT_PITCH));

    for (let gy = gy0; gy < gy1; gy++) {
      for (let gx = gx0; gx < gx1; gx++) {
        const cx = gx * DOT_PITCH + DOT_PITCH / 2;
        const cy = gy * DOT_PITCH + DOT_PITCH / 2;
        const d = Math.hypot(cx - px, cy - py);
        if (d >= reach) continue;
        const t = 1 - d / reach;

        // Per-cell noise, hashed from the grid index so a cell keeps the same
        // value frame to frame — otherwise the field would boil as you move.
        const hash = (((gx * 73856093) ^ (gy * 19349663)) >>> 0) % 1024 / 1024;

        // The dissolve: a cell survives only if its noise falls under the
        // falloff, so cells drop out progressively instead of all fading together.
        const survival = Math.pow(t, 1.6);
        if (hash > survival * 1.25) continue;

        const radius = DOT_MAX_R * Math.pow(t, 0.85) * (0.5 + hash * 0.8);
        if (radius < 0.15) continue;

        // Diagonal hue banding that slides with the pointer — the rainbow sweep.
        // ~2.2deg per px puts a full spectrum in roughly 160px, so a card this
        // size shows two bands. At the old 0.55 a cycle was wider than the card
        // and every dot came out near the same hue, which screen-blended to grey.
        const hue = ((cx + cy) * 2.2 + px * 0.9 + py * 0.5) % 360;
        ctx.globalAlpha = Math.min(1, survival * 1.35);
        ctx.fillStyle = `hsl(${hue}, 100%, 68%)`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    paint(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
    // Tilt is subtle on purpose — the sheen is the effect, the tilt only sells
    // that the card is a physical surface catching light.
    const tiltX = ((e.clientY - r.top) / r.height - 0.5) * -6;
    const tiltY = ((e.clientX - r.left) / r.width - 0.5) * 6;
    el.style.setProperty("--tilt", `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`);
    if (!lit) setLit(true);
  }, [lit, paint]);

  const onLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.setProperty("--tilt", "none");
    setLit(false);
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (cv && ctx) ctx.clearRect(0, 0, cv.width, cv.height);
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onLeave}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 380,
        aspectRatio: "3 / 4",
        borderRadius: 22,
        overflow: "hidden",
        background: "var(--surface-container)",
        border: "var(--border-w) solid var(--ink)",
        boxShadow: "var(--card-shadow-hover)",
        transform: "var(--tilt, none)",
        transition: "transform 0.18s ease",
        // The sheen reads the pointer from these; defaults keep it centred.
        ["--mx" as string]: "50%",
        ["--my" as string]: "50%",
      }}
    >
      {/* Decorative shapes, behind the portrait */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-12%", left: "-18%", width: "70%", height: "45%",
          background: meta?.accent ?? "var(--pitch-lime)", borderRadius: "0 0 60% 0", opacity: 0.9,
        }} />
        <div style={{
          position: "absolute", top: "18%", right: "-14%", width: "48%", height: "34%",
          background: "var(--card-yellow)", borderRadius: "50% 0 0 50%", opacity: 0.85,
        }} />
      </div>

      {/* Portrait */}
      {portrait && !portraitFailed ? (
        <img
          src={portrait}
          alt=""
          onError={() => setPortraitFailed(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        // No portrait: the initials become the artwork, so they need to read
        // against the card rather than against the accent shapes behind them.
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 76,
          color: "var(--on-surface)",
          textShadow: "3px 3px 0 var(--ink)",
          letterSpacing: "-0.03em",
        }}>
          {initialsOf(name)}
        </div>
      )}

      {/* Foil grain: always on, barely there. A real card catches a little light
          across its whole surface, so the dots exist before the pointer does —
          the sheen below then lights the same grid rather than introducing
          texture out of nowhere. */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          opacity: 0.16,
          mixBlendMode: "overlay",
          backgroundImage: DOT_TILE,
          backgroundSize: `${DOT_PITCH}px ${DOT_PITCH}px`,
        }}
      />

      {/* Holographic sheen, painted.
          CSS masks can tile a dot but cannot vary a dot's size or drop it out
          per cell, so the shimmer could only ever fade as a whole. Here each
          cell's radius, alpha and survival are functions of its distance from
          the pointer, which is what produces the dissolve: dots are fat and
          dense under the light and thin out to nothing before the edge. */}
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          pointerEvents: "none",
          opacity: lit ? 1 : 0,
          transition: "opacity 0.25s ease",
          // `screen` rather than `color-dodge`: dodge divides by the inverse of
          // the blend colour, so against a near-black card it has almost nothing
          // to brighten and the specks come out muddy. Screen adds light, which
          // is what foil does on a dark surface.
          mixBlendMode: "screen",
        }}
      />

      {/* Squad number, top right — over the sheen so the foil catches it. */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: 8, right: 14, zIndex: 2,
          fontFamily: "var(--font-display)", fontWeight: 900,
          fontSize: 60, lineHeight: 1, letterSpacing: "-0.05em",
          color: "var(--primary)",
          textShadow: "3px 3px 0 var(--ink)",
        }}
      >
        {number}
      </div>

      {/* Identity block */}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          background: "var(--ink)", borderRadius: 14, padding: "10px 14px",
          border: "var(--border-w) solid var(--ink)", boxShadow: "var(--card-shadow)",
        }}>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20,
            letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {name}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
            @{handle}
          </div>
        </div>

        {meta && (
          <div style={{
            alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8,
            background: meta.accent, color: "var(--ink)",
            borderRadius: 12, padding: "7px 12px",
            border: "var(--border-w) solid var(--ink)", boxShadow: "var(--card-shadow)",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12.5,
          }}>
            {meta.label}
            <span aria-hidden style={{ opacity: 0.5 }}>•</span>
            The Offside Trap
          </div>
        )}
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const name = user?.username ?? "Your profile";
  const handle = user?.username ?? "you";
  const num = squadNumber(user?.id ?? handle);

  /**
   * Only the tactics count is real. Saves and shares are not recorded anywhere
   * yet, so they render as em dashes rather than plausible-looking numbers —
   * a made-up "1.2k" in a shipped profile is indistinguishable from a true one.
   */
  const [tacticCount, setTacticCount] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    TacticEntity.list()
      .then((res: any) => {
        if (!alive) return;
        const all = res?.tactics ?? res?.data?.tactics ?? (Array.isArray(res) ? res : []);
        setTacticCount(all.filter((t: any) => t?.author?.id === user?.id).length);
      })
      .catch(() => alive && setTacticCount(0));
    return () => { alive = false; };
  }, [user?.id]);

  const stats: Array<{ value: string; label: string }> = [
    { value: tacticCount === null ? "…" : String(tacticCount), label: "Tactics" },
    { value: "—", label: "Saves" },
    { value: "—", label: "Shares" },
  ];

  return (
    <div className="dot-bg" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "16px 16px 32px" : "28px 24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isMobile ? 20 : 28 }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0, cursor: "pointer",
              background: "var(--surface-container)", border: "var(--border-w) solid var(--ink)",
              boxShadow: "var(--card-shadow)", color: "var(--on-surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="kicker" style={{ marginBottom: 1 }}>Profile</div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: isMobile ? 18 : 26, letterSpacing: "-0.02em",
              color: "var(--on-surface)", margin: 0,
            }}>
              {name}
            </h1>
          </div>
          <Logo size={34} bordered />
        </div>

        <div style={{
          display: "flex", flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 22 : 34, alignItems: isMobile ? "stretch" : "flex-start",
        }}>
          <div style={{ flex: isMobile ? undefined : "0 0 380px", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 14 }}>
              <HoloCard name={name} handle={handle} role={user?.profile} avatar={user?.avatar} number={num} />

              <div style={{ display: "flex", gap: 10 }}>
                {stats.map(({ value, label }) => (
                  <div
                    key={label}
                    style={{
                      flex: 1, minWidth: 0, textAlign: "center",
                      background: "var(--surface-container)",
                      border: "var(--border-w) solid var(--ink)",
                      boxShadow: "var(--card-shadow)",
                      borderRadius: 14, padding: "12px 6px",
                    }}
                  >
                    <div style={{
                      fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22,
                      color: "var(--primary)", lineHeight: 1.1,
                    }}>
                      {value}
                    </div>
                    <div style={{
                      fontSize: 9.5, fontWeight: 800, letterSpacing: "0.12em",
                      textTransform: "uppercase", color: "var(--caption)", marginTop: 4,
                    }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              background: "var(--surface-container)", border: "var(--border-w) solid var(--ink)",
              boxShadow: "var(--card-shadow)", borderRadius: 16, padding: 16,
            }}>
              <div className="kicker" style={{ marginBottom: 10 }}>Account</div>
              {[
                ["Username", user?.username ?? "—"],
                ["Email", user?.email ?? "—"],
                ["Role", user?.profile ? ROLE_META[user.profile].label : "Not set"],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between", gap: 16,
                  padding: "9px 0", borderBottom: "1px solid var(--hairline)",
                }}>
                  <span style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
                </div>
              ))}
              {/* Only true where there is a cursor — the sheen is mouse-gated. */}
              {!isMobile && (
                <p style={{ fontSize: 12, color: "var(--outline)", margin: "12px 0 0" }}>
                  Move your cursor across the card to catch the light.
                </p>
              )}
            </div>

            <button
              onClick={() => { signOut(); navigate("/"); }}
              style={{
                alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8,
                background: "var(--surface-container)", color: "var(--on-surface)",
                border: "var(--border-w) solid var(--ink)", boxShadow: "var(--card-shadow)",
                borderRadius: 12, padding: "10px 16px", cursor: "pointer",
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
              }}
            >
              <LogOut size={15} strokeWidth={2.4} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
