import { useEffect, useRef, useState } from "react";

type Side = "user" | "opponent";

type Keyframe = { x: number; y: number };

type Player = {
  n: string;
  side: Side;
  path: [Keyframe, Keyframe, Keyframe];
};

/**
 * Offside-trap demo (3 animated phases with smooth requestAnimationFrame loop):
 * 0 — set: opponent back line sits deep, user attackers on the shoulder.
 * 1 — trap: the red line steps up, attackers are caught beyond the line.
 * 2 — beaten: the ball carrier dribbles through the line before it resets.
 */
const PLAYERS: Player[] = [
  // Opponent (red) back line — steps up together
  { n: "2", side: "opponent", path: [{ x: 60, y: 20 }, { x: 47, y: 20 }, { x: 47, y: 20 }] },
  { n: "5", side: "opponent", path: [{ x: 60, y: 38 }, { x: 47, y: 38 }, { x: 47, y: 38 }] },
  { n: "6", side: "opponent", path: [{ x: 60, y: 58 }, { x: 47, y: 58 }, { x: 47, y: 58 }] },
  { n: "3", side: "opponent", path: [{ x: 60, y: 76 }, { x: 47, y: 76 }, { x: 47, y: 76 }] },
  // Keeper — stays inside six-yard box, slightly downward, edges out as ball comes
  { n: "1", side: "opponent", path: [{ x: 91, y: 53 }, { x: 90, y: 53 }, { x: 88, y: 54 }] },

  // User (blue) attackers — drop back onside as the line steps up
  { n: "7", side: "user", path: [{ x: 66, y: 24 }, { x: 42, y: 26 }, { x: 52, y: 24 }] },
  { n: "9", side: "user", path: [{ x: 72, y: 44 }, { x: 44, y: 44 }, { x: 56, y: 42 }] },
  { n: "11", side: "user", path: [{ x: 66, y: 70 }, { x: 42, y: 68 }, { x: 52, y: 68 }] },

  // 10 times the run behind, 8 plays the through ball
  { n: "10", side: "user", path: [{ x: 30, y: 62 }, { x: 40, y: 58 }, { x: 64, y: 52 }] },
  { n: "8", side: "user", path: [{ x: 24, y: 34 }, { x: 30, y: 40 }, { x: 34, y: 44 }] },
];

// Ball starts at 8's feet, then is played through to 10
const BALL: [Keyframe, Keyframe, Keyframe] = [
  { x: 27, y: 36 },
  { x: 33, y: 42 },
  { x: 67, y: 53 },
];

const CAPTIONS = [
  "Back line sits deep — attackers on the shoulder",
  "Defenders step up, blue drops back onside",
  "8 slides the through ball, 10 runs beyond",
];

const COLORS: Record<Side, { body: string; trim: string; ink: string }> = {
  user: {
    body: "var(--color-token-home, #4d7cff)",
    trim: "var(--color-token-home-ring, rgba(255, 255, 255, 0.7))",
    ink: "var(--color-token-home-ink, #ffffff)",
  },
  opponent: {
    body: "var(--color-token-key, #ff4d4d)",
    trim: "var(--color-token-key-ring, rgba(255, 255, 255, 0.8))",
    ink: "var(--color-token-key-ink, #ffffff)",
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(f: number) {
  return f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
}

function sample(path: [Keyframe, Keyframe, Keyframe], p: number): Keyframe {
  const clamped = Math.max(0, Math.min(1, p));
  const t = clamped * 2;
  const i = t < 1 ? 0 : 1;
  const from = path[i] as Keyframe;
  const to = path[i + 1] as Keyframe;
  const f = Math.min(Math.max(t - i, 0), 1);
  const eased = easeInOutCubic(f);
  return { x: lerp(from.x, to.x, eased), y: lerp(from.y, to.y, eased) };
}

function Jersey({ n, side, delay }: { n: string; side: Side; delay: string }) {
  const c = COLORS[side];
  return (
    <svg
      className="pitch-jersey"
      viewBox="0 0 40 40"
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      <path
        d="M14 5 L20 8 L26 5 L36 10 L32 18 L29 16.5 L29 35 Q20 37 11 35 L11 16.5 L8 18 L4 10 Z"
        fill={c.body}
        stroke={c.trim}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 5 L20 11 L26 5" fill="none" stroke={c.trim} strokeWidth="1.4" strokeLinejoin="round" />
      {n && (
        <text className="pitch-jersey-num" x="20" y="27" textAnchor="middle" fill={c.ink}>
          {n}
        </text>
      )}
    </svg>
  );
}

// Total loop duration: 9.2 seconds (2.4s Phase 0->1, 2.4s Phase 1->2, 2.4s Phase 2 hold, 2.0s smooth reset)
const PHASE_DURATIONS = [2400, 2400, 2400, 2000]; 
const TOTAL_CYCLE = PHASE_DURATIONS.reduce((a, b) => a + b, 0); // 9200ms

export function TacticsPitch() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;

    const frame = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) % TOTAL_CYCLE;

      let currentPhase = 0;
      let currentP = 0;

      if (elapsed < PHASE_DURATIONS[0]) {
        // Phase 0: 0 -> 0.5 (Set -> Trap)
        currentPhase = 0;
        const norm = elapsed / PHASE_DURATIONS[0];
        currentP = norm * 0.5;
      } else if (elapsed < PHASE_DURATIONS[0] + PHASE_DURATIONS[1]) {
        // Phase 1: 0.5 -> 1.0 (Trap -> Beaten)
        currentPhase = 1;
        const norm = (elapsed - PHASE_DURATIONS[0]) / PHASE_DURATIONS[1];
        currentP = 0.5 + norm * 0.5;
      } else if (elapsed < PHASE_DURATIONS[0] + PHASE_DURATIONS[1] + PHASE_DURATIONS[2]) {
        // Phase 2: Hold at 1.0 (Beaten)
        currentPhase = 2;
        currentP = 1.0;
      } else {
        // Smooth Reset: 1.0 -> 0.0
        currentPhase = 0;
        const resetElapsed = elapsed - (PHASE_DURATIONS[0] + PHASE_DURATIONS[1] + PHASE_DURATIONS[2]);
        const norm = resetElapsed / PHASE_DURATIONS[3];
        const easedReset = easeInOutCubic(norm);
        currentP = 1.0 - easedReset;
      }

      setPhase(currentPhase);
      setProgress(currentP);

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, []);

  const ball = sample(BALL, progress);

  return (
    <div ref={ref} className="pitch-scene relative w-full">
      <div className="pitch-glow" aria-hidden="true" />
      <div className="pitch-tilt">
        <div className="pitch-surface">
          <div className="pitch-stripes" aria-hidden="true" />
          <div className="pitch-lines" aria-hidden="true">
            <span className="pitch-halfway" />
            <span className="pitch-circle" />
            <span className="pitch-spot" />
            <span className="pitch-box pitch-box-left" />
            <span className="pitch-box pitch-box-right" />
            <span className="pitch-six pitch-six-left" />
            <span className="pitch-six pitch-six-right" />
          </div>

          <div className="pitch-tokens">
            {PLAYERS.map((pl, i) => {
              const pos = sample(pl.path, progress);
              return (
                <span
                  key={`${pl.side}-${pl.n}-${i}`}
                  className="pitch-token"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <Jersey n={pl.n} side={pl.side} delay={`${(i % 7) * 0.45}s`} />
                </span>
              );
            })}

            <span
              className="pitch-token pitch-ball"
              style={{ left: `${ball.x}%`, top: `${ball.y}%`, zIndex: 10 }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <p className="pitch-caption" aria-live="polite">
        <span className="pitch-caption-step">{phase + 1}/3</span>
        {CAPTIONS[phase]}
      </p>
    </div>
  );
}

export default TacticsPitch;
