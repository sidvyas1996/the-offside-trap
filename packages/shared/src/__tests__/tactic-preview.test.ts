import { describe, expect, it } from "vitest";
import { buildTacticPreview, PREVIEW_MAX_FRAMES, sampleIndices } from "../tactic-preview";
import type { Player } from "../index";

const squad = (dx = 0): Player[] =>
  Array.from({ length: 11 }, (_, i) => ({ id: i + 1, x: 10 + i * 7 + dx, y: 50, number: i + 1, ...(i === 0 && { position: "GK" }) }));

const keyframes = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `kf-${i}`,
    timeMs: i * 100,
    players: squad(i),
    fieldSettings: { fieldColor: "#123456", playerColor: "#000", showPlayerLabels: true, markerType: "circle" as const, ball: { x: 5 + i, y: 50 } },
  }));

describe("sampleIndices", () => {
  it("keeps everything when it already fits", () => {
    expect(sampleIndices(3, 12)).toEqual([0, 1, 2]);
  });

  it("thins evenly and always keeps the first and last", () => {
    const idx = sampleIndices(240, PREVIEW_MAX_FRAMES);
    expect(idx).toHaveLength(PREVIEW_MAX_FRAMES);
    expect(idx[0]).toBe(0);
    expect(idx[idx.length - 1]).toBe(239);
  });
});

describe("buildTacticPreview", () => {
  it("treats a tactic with no animation as a lineup, with no frames or ball", () => {
    const p = buildTacticPreview({ players: squad(), fieldSettings: { fieldColor: "#123456", ball: { x: 5, y: 50 } } });
    expect(p.kind).toBe("lineup");
    expect(p.frames).toBeUndefined();
    expect(p.ball).toBeUndefined();
    expect(p.home).toHaveLength(11);
    expect(p.home[0].label).toBe("GK");
    expect(p.home[1].label).toBe("2");
    expect(p.colors.fieldColor).toBe("#123456");
    // Unstyled kits fall back to the studio defaults.
    expect(p.colors.home.bg).toBe("#111827");
  });

  it("samples an animation down to a handful of poses that start and end where it does", () => {
    const p = buildTacticPreview({
      players: squad(),
      fieldSettings: { fieldColor: "#19a974", ball: { x: 5, y: 50 } },
      animation: { durationMs: 23900, fps: 24, keyframes: keyframes(240) },
    });
    expect(p.kind).toBe("animated");
    expect(p.frames).toHaveLength(PREVIEW_MAX_FRAMES);
    expect(p.frames![0].t).toBe(0);
    expect(p.frames![p.frames!.length - 1].t).toBe(1);
    // Last pose is the last keyframe's: everyone 239 along, ball too.
    expect(p.frames![p.frames!.length - 1].home[0]).toEqual([10 + 239, 50]);
    expect(p.frames![p.frames!.length - 1].ball).toEqual([5 + 239, 50]);
    expect(p.durationMs).toBe(23900);
  });

  it("matches players by id, not by their order in a keyframe", () => {
    const kfs = keyframes(2);
    kfs[1].players = [...kfs[1].players].reverse();
    const p = buildTacticPreview({ players: squad(), animation: { durationMs: 100, fps: 24, keyframes: kfs } });
    expect(p.frames![1].home[0]).toEqual([11, 50]);
  });

  it("includes the opposition only when there is one, and parses JSON strings", () => {
    const withOpp = buildTacticPreview({ players: JSON.stringify(squad()), oppositionPlayers: JSON.stringify(squad()) });
    expect(withOpp.away).toHaveLength(11);
    expect(withOpp.colors.away.bg).toBe("#ff6fae");
    const without = buildTacticPreview({ players: squad(), oppositionPlayers: null });
    expect(without.away).toBeUndefined();
  });
});
