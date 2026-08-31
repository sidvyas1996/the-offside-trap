import { describe, expect, it } from "vitest";

import {
  LANDSCAPE,
  PITCH_MARKINGS,
  PORTRAIT,
  fromPortraitPct,
  projectMarking,
  toPortraitPct,
  type Marking,
} from "../pitch-view";
import { PITCH_LENGTH, PITCH_WIDTH } from "../pitch-geometry";

/**
 * These guard the one claim the mobile board rests on: portrait is a *render*
 * projection, so a tactic authored in either orientation is the same stored
 * data. A sign error here would not crash anything — it would silently save
 * mirrored tactics, which is why the round-trip is asserted rather than eyeballed.
 */
describe("portrait projection", () => {
  const POINTS = [
    { x: 0, y: 0 },
    { x: 100, y: 100 },
    { x: 50, y: 50 },
    { x: 12.5, y: 87.5 },
    { x: 100, y: 0 },
  ];

  it("round-trips stored -> portrait -> stored", () => {
    for (const p of POINTS) {
      expect(fromPortraitPct(toPortraitPct(p))).toEqual(p);
    }
  });

  it("round-trips portrait -> stored -> portrait", () => {
    for (const p of POINTS) {
      expect(toPortraitPct(fromPortraitPct(p))).toEqual(p);
    }
  });

  it("puts the attacking direction up the screen", () => {
    // Stored x=100 is the opposition goal line. On a portrait board that must
    // read as the *top* of the screen, i.e. y=0.
    expect(toPortraitPct({ x: 100, y: 50 })).toEqual({ x: 50, y: 0 });
    // ...and the defending goal line at the bottom.
    expect(toPortraitPct({ x: 0, y: 50 })).toEqual({ x: 50, y: 100 });
  });

  it("keeps the centre spot at the centre", () => {
    expect(toPortraitPct({ x: 50, y: 50 })).toEqual({ x: 50, y: 50 });
  });

  it("exposes the same maths through the projection objects", () => {
    const p = { x: 30, y: 70 };
    expect(PORTRAIT.toPct(p)).toEqual(toPortraitPct(p));
    expect(PORTRAIT.fromPct(PORTRAIT.toPct(p))).toEqual(p);
    // Landscape is the identity, so the studio can run one code path.
    expect(LANDSCAPE.toPct(p)).toEqual(p);
    expect(LANDSCAPE.fromPct(p)).toEqual(p);
  });

  it("maps percentages onto the right SVG axis for each projection", () => {
    const p = { x: 100, y: 100 };
    expect(LANDSCAPE.toX(p)).toBeCloseTo(PITCH_LENGTH);
    expect(LANDSCAPE.toY(p)).toBeCloseTo(PITCH_WIDTH);
    // Portrait swaps which constant bounds which axis.
    expect(PORTRAIT.toX(p)).toBeCloseTo(PITCH_WIDTH);
    expect(PORTRAIT.toY({ x: 0, y: 0 })).toBeCloseTo(PITCH_LENGTH);
  });
});

describe("projectMarking", () => {
  it("is a no-op in landscape", () => {
    for (const m of PITCH_MARKINGS) {
      expect(projectMarking(m, false)).toBe(m);
    }
  });

  it("keeps every marking inside the portrait canvas", () => {
    // A transposed marking that falls outside 350x622 means the quarter-turn
    // used the wrong extent — the failure mode is lines drawn off the pitch.
    for (const m of PITCH_MARKINGS) {
      const q = projectMarking(m, true);
      const xs: number[] = [];
      const ys: number[] = [];
      switch (q.kind) {
        case "rect":
          xs.push(q.x, q.x + q.w);
          ys.push(q.y, q.y + q.h);
          break;
        case "line":
          xs.push(q.x1, q.x2);
          ys.push(q.y1, q.y2);
          break;
        case "arc":
          xs.push(q.x1, q.x2);
          ys.push(q.y1, q.y2);
          break;
        case "circle":
        case "dot":
          xs.push(q.cx - q.r, q.cx + q.r);
          ys.push(q.cy - q.r, q.cy + q.r);
          break;
      }
      for (const x of xs) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(PITCH_WIDTH);
      }
      for (const y of ys) {
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(PITCH_LENGTH);
      }
    }
  });

  it("transposes the halfway line from vertical to horizontal", () => {
    const halfway = PITCH_MARKINGS.find(
      (m): m is Extract<Marking, { kind: "line" }> => m.kind === "line",
    )!;
    // Landscape: constant x, varying y. Portrait: the other way round.
    expect(halfway.x1).toBe(halfway.x2);
    const q = projectMarking(halfway, true) as Extract<Marking, { kind: "line" }>;
    expect(q.y1).toBe(q.y2);
    expect(q.x1).not.toBe(q.x2);
    // The halfway line stays at the midpoint of the long axis.
    expect(q.y1).toBeCloseTo(PITCH_LENGTH / 2);
  });

  it("keeps arc sweep — the quarter turn is a rotation, not a reflection", () => {
    // (x, y) -> (y, L - x) has determinant +1, so handedness is preserved.
    // Flipping sweep here is what made the penalty Ds bulge into their own boxes.
    const arcs = PITCH_MARKINGS.filter(
      (m): m is Extract<Marking, { kind: "arc" }> => m.kind === "arc",
    );
    expect(arcs.length).toBeGreaterThan(0);
    for (const a of arcs) {
      const q = projectMarking(a, true) as Extract<Marking, { kind: "arc" }>;
      expect(q.sweep).toBe(a.sweep);
    }
  });

  /**
   * Apex of an SVG arc — the point furthest from its chord.
   *
   * Sweep decides which side of the chord the centre sits on; the apex is
   * directly opposite it. Asserting on the apex tests what a reader can actually
   * see (which way the curve bulges) rather than restating the flag.
   */
  const arcApex = (a: Extract<Marking, { kind: "arc" }>) => {
    const mid = { x: (a.x1 + a.x2) / 2, y: (a.y1 + a.y2) / 2 };
    const vx = a.x2 - a.x1;
    const vy = a.y2 - a.y1;
    const d = Math.hypot(vx, vy);
    const h = Math.sqrt(Math.max(0, a.r * a.r - (d / 2) ** 2));
    const ux = vx / d;
    const uy = vy / d;
    // sweep 1 puts the centre on one perpendicular, sweep 0 on the other.
    const nx = a.sweep === 1 ? -uy : uy;
    const ny = a.sweep === 1 ? ux : -ux;
    const cx = mid.x + h * nx;
    const cy = mid.y + h * ny;
    const back = Math.hypot(mid.x - cx, mid.y - cy) || 1;
    return { x: cx + ((mid.x - cx) / back) * a.r, y: cy + ((mid.y - cy) / back) * a.r };
  };

  it("bulges the penalty Ds away from their own goal, in both orientations", () => {
    const ds = PITCH_MARKINGS.filter(
      (m): m is Extract<Marking, { kind: "arc" }> =>
        m.kind === "arc" && m.r === 30,
    );
    expect(ds).toHaveLength(2);

    for (const d of ds) {
      // Landscape: the D opens toward the halfway line, so its apex must be
      // nearer the centre of the pitch than the chord it springs from.
      const flat = arcApex(d);
      const flatMid = { x: (d.x1 + d.x2) / 2, y: (d.y1 + d.y2) / 2 };
      expect(Math.abs(flat.x - PITCH_LENGTH / 2)).toBeLessThan(
        Math.abs(flatMid.x - PITCH_LENGTH / 2),
      );

      // Portrait: same statement, now about the vertical axis.
      const q = projectMarking(d, true) as Extract<Marking, { kind: "arc" }>;
      const tall = arcApex(q);
      const tallMid = { x: (q.x1 + q.x2) / 2, y: (q.y1 + q.y2) / 2 };
      expect(Math.abs(tall.y - PITCH_LENGTH / 2)).toBeLessThan(
        Math.abs(tallMid.y - PITCH_LENGTH / 2),
      );
    }
  });

  it("curls corner arcs into the pitch, in both orientations", () => {
    const corners = PITCH_MARKINGS.filter(
      (m): m is Extract<Marking, { kind: "arc" }> =>
        m.kind === "arc" && m.r === 10,
    );
    expect(corners).toHaveLength(4);
    const centre = { x: PITCH_LENGTH / 2, y: PITCH_WIDTH / 2 };
    const portraitCentre = { x: PITCH_WIDTH / 2, y: PITCH_LENGTH / 2 };

    for (const c of corners) {
      const flat = arcApex(c);
      const flatMid = { x: (c.x1 + c.x2) / 2, y: (c.y1 + c.y2) / 2 };
      expect(Math.hypot(flat.x - centre.x, flat.y - centre.y)).toBeLessThan(
        Math.hypot(flatMid.x - centre.x, flatMid.y - centre.y),
      );

      const q = projectMarking(c, true) as Extract<Marking, { kind: "arc" }>;
      const tall = arcApex(q);
      const tallMid = { x: (q.x1 + q.x2) / 2, y: (q.y1 + q.y2) / 2 };
      expect(Math.hypot(tall.x - portraitCentre.x, tall.y - portraitCentre.y)).toBeLessThan(
        Math.hypot(tallMid.x - portraitCentre.x, tallMid.y - portraitCentre.y),
      );
    }
  });
});
