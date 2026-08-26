import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  compileTactic,
  ballLiftAt,
  positionAt,
  resolveTimeline,
  sampleTimes,
  type Timeline,
} from "../compile-tactic";
import { BALL, playerActor, toActor, toPoint, type TacticState } from "../tactic-v2";
import { pitchDistance } from "../pitch-geometry";
import {
  FIXTURES,
  awayRoster,
  buildUpAndCross,
  fieldSettings,
  homeRoster,
} from "./fixtures";

const GOLDEN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "__golden__");
const UPDATE = !!process.env.UPDATE_GOLDEN;

const H = (n: number) => playerActor('home', n);

const r2 = (n: number) => Math.round(n * 100) / 100;
const rms = (n: number) => Math.round(n);

/**
 * A reviewable summary of a compiled timeline.
 *
 * Deliberately not the raw Keyframe[]: a 20s move is ~500 keyframes carrying a
 * full eleven-player roster each, which is unreadable as a diff and would make the
 * golden file useless as a review artefact. The digest keeps what a human can
 * actually check — when each phase runs, what each actor does, and where everyone
 * is at every instant that matters — and the keyframes are covered by invariants
 * instead.
 */
function digest(timeline: Timeline, state: TacticState) {
  const actors = [...new Set(timeline.segments.map(s => s.actorId))].sort();
  return {
    totalMs: rms(timeline.totalMs),
    resetStartMs: rms(timeline.resetStartMs),
    phases: timeline.phaseStartsMs.map((start, i) => ({
      id: state.phases[i]?.id,
      startMs: rms(start),
      endMs: rms(timeline.phaseEndsMs[i]),
      durationMs: rms(timeline.phaseEndsMs[i] - start),
    })),
    criticalMs: timeline.criticalMs.map(rms),
    warnings: timeline.warnings,
    segments: timeline.segments.map(s => ({
      actorId: s.actorId,
      kind: s.kind,
      actionId: s.actionId,
      startMs: rms(s.startMs),
      endMs: rms(s.endMs),
      motion: s.motion,
      traversals: s.traversals,
      points: s.points.map(p => `${r2(p.x)},${r2(p.y)}`),
    })),
    posesAtCriticalInstants: timeline.criticalMs.map(t => ({
      tMs: rms(t),
      at: Object.fromEntries(
        actors.map(a => {
          const p = positionAt(timeline.segments, a, t, state.initialBoard[a] ?? { x: 50, y: 50 });
          return [a, `${r2(p.x)},${r2(p.y)}`];
        }),
      ),
    })),
  };
}

function assertGolden(name: string, actual: unknown) {
  const file = path.join(GOLDEN_DIR, `${name}.json`);
  const serialized = `${JSON.stringify(actual, null, 2)}\n`;
  if (UPDATE || !fs.existsSync(file)) {
    fs.mkdirSync(GOLDEN_DIR, { recursive: true });
    fs.writeFileSync(file, serialized);
    return;
  }
  expect(serialized).toBe(fs.readFileSync(file, "utf8"));
}

// ---------------------------------------------------------------------------
// The golden files
// ---------------------------------------------------------------------------

describe("golden timelines", () => {
  for (const { name, state } of FIXTURES) {
    it(`${name} compiles to a stable timeline`, () => {
      assertGolden(name, digest(resolveTimeline(state()), state()));
    });
  }
});

// ---------------------------------------------------------------------------
// Invariants that must hold for every fixture
// ---------------------------------------------------------------------------

describe.each(FIXTURES)("invariants: $name", ({ state }) => {
  const built = state();
  const timeline = resolveTimeline(built);

  /**
   * The one invariant everything else rests on: the board at t=0 and the board at
   * t=totalMs are identical, so playback wrapping round is a no-op and an exported
   * MP4 has no visible jump. This is what the hidden reset phase exists to buy,
   * and it broke silently three times in V1 because nothing asserted it.
   */
  it("closes the loop: every actor is home at totalMs", () => {
    const actors = [...new Set(timeline.segments.map(s => s.actorId))];
    for (const a of actors) {
      const fallback = built.initialBoard[a] ?? { x: 50, y: 50 };
      const start = positionAt(timeline.segments, a, 0, fallback);
      const end = positionAt(timeline.segments, a, timeline.totalMs, fallback);
      expect(pitchDistance(start, end), `${a} is not home at the seam`).toBeLessThan(0.01);
    }
  });

  it("has no actor in two places at once", () => {
    const byActor = new Map<string, typeof timeline.segments>();
    for (const s of timeline.segments) {
      const list = byActor.get(s.actorId) ?? [];
      list.push(s);
      byActor.set(s.actorId, list);
    }
    for (const [actorId, list] of byActor) {
      const sorted = [...list].sort((a, b) => a.startMs - b.startMs);
      for (let i = 1; i < sorted.length; i++) {
        expect(
          sorted[i].startMs,
          `${actorId} has overlapping segments`,
        ).toBeGreaterThanOrEqual(sorted[i - 1].endMs - 1e-6);
      }
    }
  });

  it("has well-formed segments", () => {
    for (const s of timeline.segments) {
      expect(s.startMs).toBeGreaterThanOrEqual(0);
      expect(s.endMs).toBeGreaterThanOrEqual(s.startMs);
      expect(s.endMs).toBeLessThanOrEqual(timeline.totalMs + 1e-6);
      expect(s.points.length).toBeGreaterThanOrEqual(2);
      for (const p of s.points) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      }
      if (s.motion === 'one-way') expect(s.traversals).toBe(1);
    }
  });

  it("runs its phases in order, without gaps it did not ask for", () => {
    for (let i = 0; i < timeline.phaseStartsMs.length; i++) {
      expect(timeline.phaseEndsMs[i]).toBeGreaterThanOrEqual(timeline.phaseStartsMs[i]);
      if (i > 0) {
        const gap = timeline.phaseStartsMs[i] - timeline.phaseEndsMs[i - 1];
        const declared = built.phases[i].holdMs ?? 0;
        expect(gap).toBeCloseTo(declared, 6);
      }
    }
    expect(timeline.resetStartMs).toBeGreaterThanOrEqual(
      timeline.phaseEndsMs[timeline.phaseEndsMs.length - 1] ?? 0,
    );
  });

  /**
   * Every instant that carries meaning has to be a real rendered frame. Without
   * this a rendezvous at 2410ms sits between the 2375 and 2416 samples and gets
   * interpolated *through* — the ball and the runner never coincide on any frame.
   */
  it("pins every critical instant as an exact sample", () => {
    const times = new Set(sampleTimes(timeline, 24));
    for (const c of timeline.criticalMs) {
      expect(times.has(Math.round(c)), `${Math.round(c)}ms was not sampled`).toBe(true);
    }
  });

  it("emits keyframes covering the whole loop, with a full roster", () => {
    const players = homeRoster();
    const compiled = compileTactic(built, {
      players,
      oppositionPlayers: awayRoster(),
      fieldSettings: fieldSettings(),
    });

    expect(compiled.keyframes.length).toBeGreaterThan(1);
    expect(compiled.keyframes[0].timeMs).toBe(0);
    expect(compiled.keyframes[compiled.keyframes.length - 1].timeMs).toBe(compiled.durationMs);

    for (let i = 1; i < compiled.keyframes.length; i++) {
      expect(compiled.keyframes[i].timeMs).toBeGreaterThan(compiled.keyframes[i - 1].timeMs);
    }
    for (const kf of compiled.keyframes) {
      // The backend keyframe schema requires exactly eleven players, satisfied by
      // construction because every keyframe carries the whole roster.
      expect(kf.players).toHaveLength(players.length);
      expect(kf.oppositionPlayers).toHaveLength(11);
      expect(kf.fieldSettings.ball).toBeDefined();
    }
  });

  /**
   * Regression: the first cut derived the reset from a football speed, so the ball
   * ending 90m upfield jogged home over 30 seconds — a 8.9s move inside a 39.7s
   * animation, 78% of it housekeeping. V1's reset was 10-30% and that was already
   * the complaint.
   */
  it("never lets the reset dominate the loop", () => {
    if (timeline.totalMs === 0) return;
    const resetMs = timeline.totalMs - timeline.resetStartMs;
    expect(resetMs).toBeLessThanOrEqual(1200 + 1e-6);
    expect(resetMs / timeline.totalMs).toBeLessThan(0.35);
  });

  it("is deterministic", () => {
    const a = compileTactic(state(), { players: homeRoster(), fieldSettings: fieldSettings() });
    const b = compileTactic(state(), { players: homeRoster(), fieldSettings: fieldSettings() });
    expect(JSON.stringify(a.keyframes)).toBe(JSON.stringify(b.keyframes));
  });
});

// ---------------------------------------------------------------------------
// The behaviours V2 exists to fix
// ---------------------------------------------------------------------------

describe("physics-grounded timing", () => {
  it("gives a short run and a long run their own durations", () => {
    const timeline = resolveTimeline(buildUpAndCross());
    const shift = timeline.segments.find(s => s.actionId === 'a1-cm-shift')!;
    const overlap = timeline.segments.find(s => s.actionId === 'a1-rb-overlap')!;

    // The V1 bug: both of these consumed the whole beat, so the four-unit shift
    // rendered as slow motion beside a forty-unit sprint.
    expect(shift.endMs - shift.startMs).toBeLessThan(2000);
    expect(overlap.endMs - overlap.startMs).toBeGreaterThan(5000);
  });

  it("holds the ball still during a hold, then plays it", () => {
    const timeline = resolveTimeline(buildUpAndCross());
    const pass = timeline.segments.find(s => s.actionId === 'a1-gk-pass')!;
    expect(pass.startMs).toBeCloseTo(800, 6);

    const atStart = positionAt(timeline.segments, BALL, 0, { x: 6, y: 50 });
    const atHoldEnd = positionAt(timeline.segments, BALL, 799, { x: 6, y: 50 });
    expect(pitchDistance(atStart, atHoldEnd)).toBeLessThan(0.01);
  });

  it("lets a continuous run outlive its phase without stretching it", () => {
    const timeline = resolveTimeline(buildUpAndCross());
    const overlap = timeline.segments.find(s => s.actionId === 'a1-rb-overlap')!;

    // Phase 1 is sized by the pass, not by the overlap.
    expect(timeline.phaseEndsMs[0]).toBeLessThan(overlap.endMs);
    // And the overlap is still going once phase 2 has started — never clipped.
    expect(overlap.endMs).toBeGreaterThan(timeline.phaseStartsMs[1]);
  });

  it("waits for a continuous run before resetting", () => {
    const timeline = resolveTimeline(buildUpAndCross());
    for (const s of timeline.segments) {
      if (s.kind === 'reset') continue;
      expect(s.endMs).toBeLessThanOrEqual(timeline.resetStartMs + 1e-6);
    }
  });
});

describe("rendezvous", () => {
  it("puts the runner and the ball in the same place at the same instant", () => {
    const timeline = resolveTimeline(buildUpAndCross());
    const cross = timeline.segments.find(s => s.actionId === 'a3-cross')!;
    const run = timeline.segments.find(s => s.actionId === 'a3-st-attack')!;

    expect(run.endMs).toBeCloseTo(cross.endMs, 6);

    const ball = positionAt(timeline.segments, BALL, cross.endMs, { x: 0, y: 0 });
    const striker = positionAt(timeline.segments, H(9), cross.endMs, { x: 0, y: 0 });
    expect(pitchDistance(ball, striker)).toBeLessThan(0.01);
  });

  it("lets physics win when the rendezvous is impossible, and says so", () => {
    const state: TacticState = {
      schemaVersion: 2,
      initialBoard: {
        [H(6)]: { x: 38, y: 50 },
        [H(8)]: { x: 44, y: 30 },
        [H(9)]: { x: 20, y: 80 },
        [BALL]: { x: 38, y: 50 },
      },
      phases: [
        {
          id: 'p1',
          actions: [
            { id: 'square', actorId: BALL, to: toPoint({ x: 44, y: 30 }), speed: 'pass' },
            {
              id: 'hopeless',
              actorId: H(9),
              to: toPoint({ x: 46, y: 26 }),
              constraint: 'arrive-with-ball',
            },
          ],
        },
      ],
    };
    const timeline = resolveTimeline(state);

    const warning = timeline.warnings.find(w => w.code === 'constraint-unreachable');
    expect(warning?.actionId).toBe('hopeless');

    // Flat out, and therefore late — not teleported to make the constraint true.
    const ball = timeline.segments.find(s => s.actionId === 'square')!;
    const run = timeline.segments.find(s => s.actionId === 'hopeless')!;
    expect(run.endMs).toBeGreaterThan(ball.endMs);
  });
});

describe("position ownership", () => {
  /**
   * Rule 2, and the regression test for the design's sharpest edge.
   *
   * Editing where phase 1 ends must re-anchor phase 4's *start* — the arrow follows
   * the player — while leaving phase 4's destination exactly where it was aimed. A
   * delta-summing model gets the start right and silently drags the destination
   * off the pitch landmark it was drawn to.
   */
  it("re-anchors a later origin without moving its destination", () => {
    const before = resolveTimeline(buildUpAndCross());

    const edited = buildUpAndCross();
    const stAttack = edited.phases[2].actions.find(a => a.id === 'a3-st-attack')!;
    stAttack.to = toPoint({ x: 84, y: 30 });
    const cross = edited.phases[2].actions.find(a => a.id === 'a3-cross')!;
    cross.to = toPoint({ x: 84, y: 30 });
    const after = resolveTimeline(edited);

    const carryBefore = before.segments.find(s => s.actionId === 'a4-st-carry')!;
    const carryAfter = after.segments.find(s => s.actionId === 'a4-st-carry')!;

    // The origin moved with the player...
    expect(pitchDistance(carryBefore.points[0], carryAfter.points[0])).toBeGreaterThan(1);
    // ...and the destination did not move at all.
    const destBefore = carryBefore.points[carryBefore.points.length - 1];
    const destAfter = carryAfter.points[carryAfter.points.length - 1];
    expect(destAfter).toEqual(destBefore);
    expect(destAfter).toEqual({ x: 94, y: 46 });
  });

  it("follows a receiver who moved in an earlier phase", () => {
    const timeline = resolveTimeline(buildUpAndCross());
    const pass = timeline.segments.find(s => s.actionId === 'a2-cb-to-cm')!;
    const dest = pass.points[pass.points.length - 1];

    // The midfielder shifted from {38,50} to {36,53} in phase 1; the pass has to be
    // played to where he is now, not to where he was when the arrow was drawn.
    expect(dest).toEqual({ x: 36, y: 53 });
  });

  it("keeps home #7 and away #7 apart", () => {
    const state = FIXTURES.find(f => f.name === 'with-opposition')!.state();
    const timeline = resolveTimeline(state);
    const home = timeline.segments.filter(s => s.actorId === 'home:7' && s.kind === 'travel');
    const away = timeline.segments.filter(s => s.actorId === 'away:7' && s.kind === 'travel');
    expect(home).toHaveLength(1);
    expect(away).toHaveLength(1);
    expect(home[0].actionId).toBe('a1-home7');
    expect(away[0].actionId).toBe('a1-away7');
  });
});

describe("possession", () => {
  it("carries the ball with the man on it, with no second action to keep in step", () => {
    const timeline = resolveTimeline(buildUpAndCross());
    const carry = timeline.segments.find(s => s.actionId === 'a4-st-carry')!;
    const ballCarry = timeline.segments.find(s => s.actionId === 'a4-st-carry:carry')!;

    expect(ballCarry.actorId).toBe(BALL);
    expect(ballCarry.startMs).toBe(carry.startMs);
    expect(ballCarry.endMs).toBe(carry.endMs);

    const mid = (carry.startMs + carry.endMs) / 2;
    const ball = positionAt(timeline.segments, BALL, mid, { x: 0, y: 0 });
    const striker = positionAt(timeline.segments, H(9), mid, { x: 0, y: 0 });
    expect(pitchDistance(ball, striker)).toBeLessThan(0.01);
  });
});

describe("possession", () => {
  /**
   * Regression. Possession used to go to the nearest marker, so a cross into the box
   * was collected by whichever body happened to be closest — and on a cross that is
   * usually the defender marking the striker. In the migration fixture the
   * opposition centre-back beat the striker to it by 0.05 pitch units, which
   * silently killed the following phase's carry.
   *
   * A ball played into space belongs to whoever *ran onto it*.
   */
  it("gives a ball into space to the runner, not to the nearest bystander", () => {
    const state: TacticState = {
      schemaVersion: 2,
      initialBoard: {
        [H(5)]: { x: 16, y: 38 },
        [H(9)]: { x: 70, y: 50 },
        // Standing marginally closer to the delivery than the striker will finish.
        [playerActor('away', 5)]: { x: 84, y: 38 },
        [BALL]: { x: 16, y: 38 },
      },
      phases: [
        {
          id: 'p1',
          actions: [
            { id: 'cross', actorId: BALL, to: toPoint({ x: 84, y: 42 }), speed: 'lofted' },
            {
              id: 'attack',
              actorId: H(9),
              to: toPoint({ x: 86, y: 40 }),
              constraint: 'arrive-with-ball',
            },
          ],
        },
        { id: 'p2', actions: [{ id: 'finish', actorId: H(9), to: toPoint({ x: 94, y: 46 }) }] },
      ],
    };
    const timeline = resolveTimeline(state);

    // The striker is on the ball, so his run in phase 2 takes it with him.
    const ballCarry = timeline.segments.find(s => s.actionId === 'finish:carry');
    expect(ballCarry?.actorId).toBe(BALL);

    const carry = timeline.segments.find(s => s.actionId === 'finish')!;
    const mid = (carry.startMs + carry.endMs) / 2;
    expect(
      pitchDistance(
        positionAt(timeline.segments, BALL, mid, { x: 0, y: 0 }),
        positionAt(timeline.segments, H(9), mid, { x: 0, y: 0 }),
      ),
    ).toBeLessThan(0.01);
  });

  it("still lets the ball be played to an opponent when that is what was drawn", () => {
    const away5 = playerActor('away', 5);
    const timeline = resolveTimeline({
      schemaVersion: 2,
      initialBoard: {
        [H(5)]: { x: 16, y: 38 },
        [away5]: { x: 60, y: 38 },
        [BALL]: { x: 16, y: 38 },
      },
      phases: [
        { id: 'p1', actions: [{ id: 'gift', actorId: BALL, to: toActor(away5), speed: 'pass' }] },
        { id: 'p2', actions: [{ id: 'break', actorId: away5, to: toPoint({ x: 30, y: 50 }) }] },
      ],
    });
    // An explicit pass to an opponent is an interception the coach drew, so he keeps
    // it and carries it away.
    expect(timeline.segments.find(s => s.actionId === 'break:carry')?.actorId).toBe(BALL);
  });
});

describe("cyclic drills", () => {
  it("keeps a shuttle and a circuit, and needs no reset for either", () => {
    const state = FIXTURES.find(f => f.name === 'shuttle-and-circuit')!.state();
    const timeline = resolveTimeline(state);

    const shuttle = timeline.segments.find(s => s.actionId === 'a1-shuttle')!;
    expect(shuttle.motion).toBe('out-and-back');
    expect(shuttle.traversals).toBe(3);

    const circuit = timeline.segments.find(s => s.actionId === 'a1-circuit')!;
    expect(circuit.motion).toBe('circuit');
    expect(circuit.traversals).toBe(2);

    // Both end where they began, so there is nothing to walk back.
    expect(timeline.segments.filter(s => s.kind === 'reset')).toHaveLength(0);
    expect(timeline.resetStartMs).toBeCloseTo(timeline.totalMs, 6);
  });

  it("returns a shuttle to its start at every turn of the cycle", () => {
    const state = FIXTURES.find(f => f.name === 'shuttle-and-circuit')!.state();
    const timeline = resolveTimeline(state);
    const shuttle = timeline.segments.find(s => s.actionId === 'a1-shuttle')!;
    const home = shuttle.points[0];
    const span = shuttle.endMs - shuttle.startMs;

    for (let k = 0; k <= 3; k++) {
      const at = positionAt(
        timeline.segments,
        shuttle.actorId,
        shuttle.startMs + (span * k) / 3,
        home,
      );
      expect(pitchDistance(at, home)).toBeLessThan(0.01);
    }
  });
});

describe("timeScale", () => {
  it("compresses every duration without touching a single ratio", () => {
    const plain = resolveTimeline(buildUpAndCross());
    const fast = resolveTimeline(buildUpAndCross(), { timeScale: 2.5 });

    expect(fast.totalMs).toBeCloseTo(plain.totalMs / 2.5, 6);
    for (let i = 0; i < plain.segments.length; i++) {
      expect(fast.segments[i].startMs).toBeCloseTo(plain.segments[i].startMs / 2.5, 6);
      expect(fast.segments[i].endMs).toBeCloseTo(plain.segments[i].endMs / 2.5, 6);
      expect(fast.segments[i].points).toEqual(plain.segments[i].points);
    }
  });
});

describe("bad input", () => {
  it("warns rather than throwing on an unparseable actor", () => {
    const timeline = resolveTimeline({
      schemaVersion: 2,
      initialBoard: { [BALL]: { x: 50, y: 50 } },
      phases: [
        { id: 'p1', actions: [{ id: 'x', actorId: 'striker', to: toPoint({ x: 60, y: 50 }) }] },
      ],
    });
    expect(timeline.warnings.map(w => w.code)).toContain('unknown-actor');
    expect(timeline.segments).toHaveLength(0);
    expect(timeline.totalMs).toBe(0);
  });

  it("refuses a ball speed on a player and falls back", () => {
    const timeline = resolveTimeline({
      schemaVersion: 2,
      initialBoard: { [H(9)]: { x: 50, y: 50 } },
      phases: [
        {
          id: 'p1',
          actions: [
            // 'driven' is 22 m/s. Silently accepted, this centre-forward outruns a car.
            { id: 'x', actorId: H(9), to: toPoint({ x: 70, y: 50 }), speed: 'driven' },
          ],
        },
      ],
    });
    expect(timeline.warnings.map(w => w.code)).toContain('speed-kind-mismatch');
    const run = timeline.segments.find(s => s.actionId === 'x')!;
    expect(run.endMs - run.startMs).toBeGreaterThan(3000);
  });

  it("survives an empty tactic", () => {
    const timeline = resolveTimeline({
      schemaVersion: 2,
      initialBoard: {},
      phases: [],
    });
    expect(timeline.totalMs).toBe(0);
    expect(timeline.segments).toHaveLength(0);
  });
});

describe("lofted balls and struck easing", () => {
  /** Keeper hits a lofted diagonal; nobody else moves. */
  const loftedState: TacticState = {
    schemaVersion: 2,
    initialBoard: { [BALL]: { x: 10, y: 50 }, [H(1)]: { x: 10, y: 50 } },
    phases: [{
      id: 'p1',
      actions: [{
        id: 'cross', actorId: BALL, to: toPoint({ x: 85, y: 25 }),
        speed: 'lofted', isLofted: true,
      }],
    }],
  };

  /** Same geometry, played along the deck. */
  const flatState: TacticState = {
    ...loftedState,
    phases: [{
      id: 'p1',
      actions: [{ id: 'square', actorId: BALL, to: toPoint({ x: 85, y: 25 }), speed: 'pass' }],
    }],
  };

  it("marks a lofted leg on the segment, and a flat one not", () => {
    const lofted = resolveTimeline(loftedState).segments.find(s => s.actorId === BALL)!;
    const flat = resolveTimeline(flatState).segments.find(s => s.actorId === BALL)!;
    expect(lofted.lofted).toBe(true);
    expect(flat.lofted).toBeUndefined();
    // Both are played, so both are struck.
    expect(lofted.struck).toBe(true);
    expect(flat.struck).toBe(true);
  });

  it("arcs the ball up and back down over a lofted leg", () => {
    const { segments } = resolveTimeline(loftedState);
    const leg = segments.find(s => s.actorId === BALL)!;
    const at = (f: number) => ballLiftAt(segments, leg.startMs + (leg.endMs - leg.startMs) * f);

    expect(at(0)).toBeCloseTo(0, 9);
    expect(at(0.5)).toBeCloseTo(1, 9);
    expect(at(1)).toBeCloseTo(0, 9);
    // Rises, peaks, falls — symmetric about the midpoint.
    expect(at(0.25)).toBeGreaterThan(at(0));
    expect(at(0.25)).toBeCloseTo(at(0.75), 9);
    expect(at(0.5)).toBeGreaterThan(at(0.25));
  });

  it("keeps a flat pass on the ground throughout", () => {
    const { segments } = resolveTimeline(flatState);
    const leg = segments.find(s => s.actorId === BALL)!;
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      expect(ballLiftAt(segments, leg.startMs + (leg.endMs - leg.startMs) * f)).toBe(0);
    }
  });

  it("carries lift into the compiled keyframes, and omits it when flat", () => {
    const lofted = compileTactic(loftedState, {
      players: homeRoster(), oppositionPlayers: [], fieldSettings: fieldSettings(),
    });
    const lifts = lofted.keyframes.map(k => k.fieldSettings.ball?.lift ?? 0);
    expect(Math.max(...lifts)).toBeGreaterThan(0.95);
    expect(lifts[0]).toBe(0);

    const flat = compileTactic(flatState, {
      players: homeRoster(), oppositionPlayers: [], fieldSettings: fieldSettings(),
    });
    expect(flat.keyframes.every(k => k.fieldSettings.ball?.lift === undefined)).toBe(true);
  });

  /**
   * A struck ball leaves the boot at its quickest; a carried one moves like the
   * player who has it. Easing them identically makes a pass look pushed.
   */
  it("eases a struck ball out, and a carried one both ends", () => {
    const { segments } = resolveTimeline(flatState);
    const leg = segments.find(s => s.actorId === BALL)!;
    const x = (f: number) => positionAt(segments, BALL, leg.startMs + (leg.endMs - leg.startMs) * f, { x: 10, y: 50 }).x;
    const first = x(0.5) - x(0);
    const second = x(1) - x(0.5);
    expect(second).toBeGreaterThan(0);
    expect(first).toBeGreaterThan(second * 1.4);

    // A carry: the man on the ball runs, and the ball is copied onto his segment.
    const carryState: TacticState = {
      schemaVersion: 2,
      initialBoard: { [BALL]: { x: 10, y: 50 }, [H(1)]: { x: 10, y: 50 } },
      phases: [{
        id: 'p1',
        actions: [{ id: 'carry', actorId: H(1), to: toPoint({ x: 60, y: 50 }), speed: 'run' }],
      }],
    };
    const carrySegs = resolveTimeline(carryState).segments;
    const ballCarry = carrySegs.find(s => s.actorId === BALL)!;
    expect(ballCarry.struck).toBeUndefined();
    const cx = (f: number) => positionAt(carrySegs, BALL, ballCarry.startMs + (ballCarry.endMs - ballCarry.startMs) * f, { x: 10, y: 50 }).x;
    expect(Math.abs((cx(0.5) - cx(0)) - (cx(1) - cx(0.5)))).toBeLessThan(1.5);
  });
});
