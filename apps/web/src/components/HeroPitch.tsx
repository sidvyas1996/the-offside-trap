import React, { useEffect, useRef } from "react";

/**
 * Landing-hero pitch — an exact copy of the Lineup/Studio CSS-perspective
 * field (same 550×350 markings, grass-green + mown stripes). Markers are
 * children of the transformed pitch (true perspective scale) but counter-
 * rotated to billboard upright. On hover the home XI attacks toward the goal.
 *
 * The tilt eases down as the page scrolls (pitch flattens), driven via a
 * CSS var on the board so markers stay upright without re-rendering.
 */

const ROT = 0;          // rotateZ — landscape orientation, goals left & right
const TILT_TOP = 30;    // tilt at the top of the page
const TILT_FLAT = 12;   // tilt once scrolled past the hero
const TILT_RANGE = 520; // px of scroll over which it flattens
const SCALE = 1.15;

const RING = { lime: "#c6f24e", blue: "#4d7cff", pink: "#ff6fae", orange: "#ff6b3d" } as const;
type Ring = keyof typeof RING;

interface Player { n: number; ring: Ring; gk?: boolean; rest: [number, number]; attack: [number, number] }

/* Field-local %: x = own-goal(0) → attacking-goal(100), y = touchline 0→100 */
const HOME: Player[] = [
  { n: 1, ring: "orange", gk: true, rest: [6, 50], attack: [13, 50] },
  { n: 2, ring: "lime", rest: [24, 16], attack: [40, 18] },
  { n: 5, ring: "lime", rest: [21, 39], attack: [38, 40] },
  { n: 6, ring: "lime", rest: [21, 61], attack: [38, 60] },
  { n: 3, ring: "lime", rest: [24, 84], attack: [40, 82] },
  { n: 4, ring: "blue", rest: [44, 28], attack: [61, 30] },
  { n: 8, ring: "blue", rest: [42, 50], attack: [60, 50] },
  { n: 7, ring: "blue", rest: [44, 72], attack: [61, 70] },
  { n: 11, ring: "pink", rest: [64, 30], attack: [83, 32] },
  { n: 9, ring: "pink", rest: [66, 50], attack: [87, 50] },
  { n: 10, ring: "pink", rest: [64, 70], attack: [83, 68] },
];

const OPP: { rest: [number, number]; attack: [number, number] }[] = [
  { rest: [92, 50], attack: [95, 50] },
  { rest: [80, 30], attack: [86, 32] },
  { rest: [80, 70], attack: [86, 68] },
  { rest: [70, 40], attack: [78, 42] },
  { rest: [70, 60], attack: [78, 58] },
];

const MARKER_TRANSITION = "left 0.7s cubic-bezier(0.22,0.8,0.25,1), top 0.7s cubic-bezier(0.22,0.8,0.25,1)";

const HeroPitch: React.FC<{ active?: boolean }> = ({ active = false }) => {
  const boardRef = useRef<HTMLDivElement>(null);

  // Scroll-driven tilt: flatten the pitch as the page scrolls.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    const apply = () => {
      const el = boardRef.current;
      if (!el) return;
      const p = reduce ? 0 : Math.min(1, Math.max(0, window.scrollY / TILT_RANGE));
      const tilt = TILT_TOP + (TILT_FLAT - TILT_TOP) * p;
      el.style.transform = `rotateX(${tilt}deg) rotateZ(${ROT}deg) scale(${SCALE})`;
      el.style.setProperty("--mtilt", String(-tilt)); // billboards counter the live tilt
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="hero-pitch">
      <div
        ref={boardRef}
        className="hp-board"
        style={{
          transform: `rotateX(${TILT_TOP}deg) rotateZ(${ROT}deg) scale(${SCALE})`,
          ["--mrot" as string]: String(-ROT),
          ["--mtilt" as string]: String(-TILT_TOP),
        } as React.CSSProperties}
      >
        {/* Pitch surface (green + markings) — masked so its edges melt into the page */}
        <div className="hp-surface">
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.32 }} viewBox="0 0 550 350">
            <g stroke="white" strokeWidth="2.5" fill="none">
              <rect x="20" y="20" width="510" height="310" />
              <line x1="275" y1="20" x2="275" y2="330" />
              <circle cx="275" cy="175" r="40" />
              <rect x="20" y="90" width="70" height="170" />
              <rect x="460" y="90" width="70" height="170" />
              <rect x="20" y="135" width="30" height="80" />
              <rect x="500" y="135" width="30" height="80" />
              <path d="M 90 155 A 30 30 0 0 1 90 195" />
              <path d="M 460 155 A 30 30 0 0 0 460 195" />
              <path d="M 20 30 A 10 10 0 0 0 30 20" />
              <path d="M 520 20 A 10 10 0 0 0 530 30" />
              <path d="M 30 330 A 10 10 0 0 0 20 320" />
              <path d="M 530 320 A 10 10 0 0 0 520 330" />
            </g>
            <circle cx="275" cy="175" r="3" fill="white" />
            <circle cx="65" cy="175" r="3" fill="white" />
            <circle cx="485" cy="175" r="3" fill="white" />
          </svg>
        </div>

        {/* Opposition — same marker size as the home team, solid black */}
        {OPP.map((o, i) => {
          const [x, y] = active ? o.attack : o.rest;
          return (
            <div key={`o${i}`} className="hp-marker" style={{ left: `${x}%`, top: `${y}%`, transition: MARKER_TRANSITION }}>
              <div className="hp-billboard">
                <div className="hp-dot hp-opp" />
              </div>
            </div>
          );
        })}

        {/* Home XI — line-coded rings, surge up-pitch on hover */}
        {HOME.map((pl) => {
          const [x, y] = active ? pl.attack : pl.rest;
          return (
            <div key={pl.n} className="hp-marker" style={{ left: `${x}%`, top: `${y}%`, transition: MARKER_TRANSITION }}>
              <div className="hp-billboard">
                <div
                  className="hp-dot"
                  style={{
                    background: "#fbf5e9",
                    border: `3px solid ${RING[pl.ring]}`,
                    boxShadow: pl.gk
                      ? `0 0 0 1.5px #15140f, 0 0 14px ${RING.orange}`
                      : "0 0 0 1.5px #15140f, 0 3px 6px rgba(0,0,0,0.32)",
                  }}
                >
                  {pl.n}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeroPitch;
