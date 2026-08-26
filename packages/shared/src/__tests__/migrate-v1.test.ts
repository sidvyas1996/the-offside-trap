import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { migrateTacticToV2, type MigrationResult } from "../migrate-v1";
import { positionAt, resolveTimeline } from "../compile-tactic";
import { BALL, playerActor, type Action, type TacticState } from "../tactic-v2";
import { pitchDistance } from "../pitch-geometry";
import {
  V1_FIXTURES,
  arrowDrivenTactic,
  bothSourcesTactic,
  gestureAuthoredTactic,
  legacyBallMovementTactic,
  pausedMidAnimationTactic,
  presetTactic,
  staticDiagram,
  windowedTactic,
} from "./v1-fixtures";

const GOLDEN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "__golden__");
const UPDATE = !!process.env.UPDATE_GOLDEN;

const H = (n: number) => playerActor('home', n);
const r2 = (n: number) => Math.round(n * 100) / 100;

const codes = (result: MigrationResult) => result.warnings.map(w => w.code);
const findAction = (state: TacticState, id: string): Action | undefined => {
  for (const phase of state.phases) {
    const a = phase.actions.find(x => x.id === id);
    if (a) return a;
  }
  return undefined;
};
const phaseIndexOf = (state: TacticState, actionId: string): number =>
  state.phases.findIndex(p => p.actions.some(a => a.id === actionId));

function digest(result: MigrationResult) {
  return {
    source: result.source,
    staticOnly: result.staticOnly,
    warnings: result.warnings,
    initialBoard: Object.fromEntries(
      Object.entries(result.state.initialBoard)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, `${r2(v.x)},${r2(v.y)}`]),
    ),
    phases: result.state.phases.map(p => ({
      id: p.id,
      holdMs: p.holdMs,
      actions: p.actions.map(a => ({
        id: a.id,
        actorId: a.actorId,
        to:
          a.to.kind === 'point'
            ? `point ${r2(a.to.at.x)},${r2(a.to.at.y)}`
            : a.to.kind === 'actor'
              ? `actor ${a.to.actorId}`
              : 'origin',
        via: a.via?.map(v => `${r2(v.x)},${r2(v.y)}`),
        speed: a.speed,
        durationMs: a.durationMs,
        holdMs: a.holdMs,
        repeat: a.repeat,
        constraint: a.constraint,
        isLofted: a.isLofted,
      })),
    })),
  };
}

function assertGolden(name: string, actual: unknown) {
  const file = path.join(GOLDEN_DIR, `migrate-${name}.json`);
  const serialized = `${JSON.stringify(actual, null, 2)}\n`;
  if (UPDATE || !fs.existsSync(file)) {
    fs.mkdirSync(GOLDEN_DIR, { recursive: true });
    fs.writeFileSync(file, serialized);
    return;
  }
  expect(serialized).toBe(fs.readFileSync(file, "utf8"));
}

// ---------------------------------------------------------------------------
// Goldens
// ---------------------------------------------------------------------------

describe("golden migrations", () => {
  for (const { name, tactic } of V1_FIXTURES) {
    it(`${name} migrates to a stable V2 state`, () => {
      assertGolden(name, digest(migrateTacticToV2(tactic())));
    });
  }
});

// ---------------------------------------------------------------------------
// The rule that protects the existing database
// ---------------------------------------------------------------------------

describe("static diagrams", () => {
  /**
   * The single most important assertion in this file. `fromArrows` exists because
   * tactics drawn before arrows carried motion must keep them as decoration; a
   * converter that ignores it makes every old diagram in the database start
   * animating the moment someone opens it.
   */
  it("never animates a tactic that had no animation", () => {
    const result = migrateTacticToV2(staticDiagram());
    expect(result.source).toBe('none');
    expect(result.staticOnly).toBe(true);
    expect(result.state.phases).toEqual([]);
    expect(codes(result)).toContain('static-diagram-preserved');
  });

  it("still recovers the board from a tactic it refuses to animate", () => {
    const { state } = migrateTacticToV2(staticDiagram());
    expect(state.initialBoard[H(2)]).toEqual({ x: 22, y: 12 });
    expect(state.initialBoard[BALL]).toEqual({ x: 6, y: 50 });
  });

  it("prefers arrows over movements, exactly as V1 played them", () => {
    // CreateTactics compiled `fromArrows ? arrowsToMotion(...) : movements`, so a
    // tactic with both played the arrows. Converting the movements instead would
    // migrate it to an animation it never had.
    const result = migrateTacticToV2(bothSourcesTactic());
    expect(result.source).toBe('arrows');
    expect(findAction(result.state, 'arrow-ar-only')).toBeDefined();
    expect(findAction(result.state, 'movement-0')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Arrows
// ---------------------------------------------------------------------------

describe("arrows", () => {
  const result = migrateTacticToV2(arrowDrivenTactic());

  it("turns beats into phases, in order", () => {
    expect(result.source).toBe('arrows');
    expect(result.state.phases.map(p => p.id)).toEqual(['beat-1', 'beat-2', 'beat-3']);
  });

  it("keeps everything in one beat in one phase", () => {
    const beat1 = result.state.phases[0].actions.map(a => a.id).sort();
    expect(beat1).toEqual(['arrow-ar-overlap', 'arrow-ar-pass']);
  });

  it("carries tempo across as speed", () => {
    expect(findAction(result.state, 'arrow-ar-overlap')?.speed).toBe('sprint');
    // curved-run implies 'run' when no tempo was set.
    expect(findAction(result.state, 'arrow-ar-arc')?.speed).toBe('run');
  });

  it("binds a pass to its receiver rather than to a coordinate", () => {
    expect(findAction(result.state, 'arrow-ar-pass')?.to).toEqual({
      kind: 'actor',
      actorId: H(5),
    });
  });

  it("gives a long ball a lofted arc and a curved run its bend", () => {
    const cross = findAction(result.state, 'arrow-ar-cross')!;
    expect(cross.speed).toBe('lofted');
    expect(cross.isLofted).toBe(true);
    // Sampled along the curve rather than reduced to a single midpoint: `via` is
    // walked as a polyline, so one waypoint animates two straight legs with a
    // corner at the apex.
    expect(cross.via!.length).toBeGreaterThan(4);

    expect(findAction(result.state, 'arrow-ar-arc')!.via!.length).toBeGreaterThan(4);
  });

  /**
   * V1 pushed the Bézier *control point* onto the path, which is not on the curve —
   * the animation bulged about twice as far as the drawn arrow. Every waypoint must
   * sit *on* the curve, and the apex specifically a quarter of the way from the
   * chord midpoint toward the control point, which is the check that catches a
   * control point sneaking back in.
   */
  it("puts every curve waypoint on the curve, not on its control point", () => {
    const arc = findAction(result.state, 'arrow-ar-arc')!;
    const from = { x: 70, y: 50 };
    const to = { x: 86, y: 40 };
    const chordMid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const control = { x: chordMid.x + (-dy / len) * len * 0.28, y: chordMid.y + (dx / len) * len * 0.28 };

    const via = arc.via!;
    // Samples are evenly spaced in t across the interior of the curve.
    via.forEach((w, i) => {
      const t = (i + 1) / (via.length + 1);
      const inv = 1 - t;
      const bx = inv * inv * from.x + 2 * inv * t * control.x + t * t * to.x;
      const by = inv * inv * from.y + 2 * inv * t * control.y + t * t * to.y;
      expect(Math.hypot(w.x - bx, w.y - by)).toBeLessThan(1e-9);
    });

    // B(0.5) sits exactly halfway between the chord midpoint and the control point.
    const apex = via[Math.floor((via.length - 1) / 2)];
    const offset = Math.hypot(apex.x - chordMid.x, apex.y - chordMid.y);
    const controlOffset = Math.hypot(control.x - chordMid.x, control.y - chordMid.y);
    expect(offset).toBeCloseTo(controlOffset / 2, 6);
  });

  it("makes a dribble the carrier's run and lets the ball follow", () => {
    const carry = findAction(result.state, 'arrow-ar-carry')!;
    expect(carry.actorId).toBe(H(9));

    // Proof the ball actually goes with him, rather than being left behind.
    const timeline = resolveTimeline(result.state);
    const ballCarry = timeline.segments.find(s => s.actionId === 'arrow-ar-carry:carry');
    expect(ballCarry?.actorId).toBe(BALL);
  });

  it("keeps an orphan arrow and a target marker as annotation", () => {
    expect(findAction(result.state, 'arrow-ar-orphan')).toBeUndefined();
    expect(codes(result)).toContain('orphan-arrow');
    expect(codes(result)).toContain('target-zone-skipped');
  });
});

// ---------------------------------------------------------------------------
// Movements + passes
// ---------------------------------------------------------------------------

describe("gesture-authored movements", () => {
  const result = migrateTacticToV2(gestureAuthoredTactic());

  it("makes the pass chain the running order", () => {
    expect(result.source).toBe('movements');
    expect(findAction(result.state, 'leg-1')?.actorId).toBe(BALL);
    expect(findAction(result.state, 'leg-2')?.actorId).toBe(BALL);
    expect(phaseIndexOf(result.state, 'leg-1')).toBe(0);
    expect(phaseIndexOf(result.state, 'leg-2')).toBe(1);
  });

  it("preserves timing as drawn", () => {
    // travelMs and holdMs are real recorded durations; a speed enum would quantise
    // them away, which is what `durationMs` exists to prevent.
    expect(findAction(result.state, 'leg-1')?.durationMs).toBe(900);
    expect(findAction(result.state, 'leg-1')?.holdMs).toBe(700);
    expect(findAction(result.state, 'leg-2')?.durationMs).toBe(1500);
    expect(findAction(result.state, 'leg-2')?.holdMs).toBe(400);
  });

  it("reads the deprecated syncToPassNode as a rendezvous", () => {
    const onto = findAction(result.state, 'movement-2')!;
    expect(onto.constraint).toBe('arrive-with-ball');
    // Node 2 is reached by leg 2, which is phase index 1.
    expect(phaseIndexOf(result.state, 'movement-2')).toBe(1);
  });

  it("opens a phase for a cue that fires once the chain is done", () => {
    // 'reaches' node 2 means "set off when the ball gets there" — after leg 2, so it
    // cannot share leg 2's phase without firing too early.
    expect(phaseIndexOf(result.state, 'movement-3')).toBe(2);
    expect(findAction(result.state, 'movement-3')?.constraint).toBeUndefined();
    expect(codes(result)).not.toContain('cue-out-of-range');
  });

  it("keeps a shuttle as a repeating out-and-back", () => {
    const shuttle = findAction(result.state, 'movement-0')!;
    expect(shuttle.repeat).toBe(3);
    expect(shuttle.to).toEqual({ kind: 'point', at: { x: 58, y: 24 } });
    expect(shuttle.via).toBeUndefined();
  });

  it("keeps a closed circuit as a circuit, without duplicating its origin", () => {
    const circuit = findAction(result.state, 'movement-1')!;
    expect(circuit.to).toEqual({ kind: 'origin' });
    expect(circuit.repeat).toBe(2);
    // The recognizer closed the path; the closing point is the origin, so it must
    // not appear again as a waypoint.
    expect(circuit.via).toEqual([{ x: 58, y: 66 }, { x: 58, y: 80 }]);
  });

  it("turns a loop-fraction delay into a wait", () => {
    // delay 0.25 of a 6000ms loop.
    expect(findAction(result.state, 'movement-1')?.holdMs).toBe(1500);
  });

  it("drops V1's explicit closing leg, because the reset does that job now", () => {
    expect(codes(result)).toContain('closing-leg-dropped');
    const legs = result.state.phases.flatMap(p => p.actions).filter(a => a.id.startsWith('leg-'));
    expect(legs).toHaveLength(2);
  });
});

describe("windowed movements", () => {
  const result = migrateTacticToV2(windowedTactic());

  it("uses the windows as the running order", () => {
    expect(result.state.phases).toHaveLength(2);
    expect(phaseIndexOf(result.state, 'movement-0')).toBe(0);
    expect(phaseIndexOf(result.state, 'movement-1')).toBe(1);
  });

  it("pairs each pass leg with its window", () => {
    expect(phaseIndexOf(result.state, 'leg-1')).toBe(0);
    expect(phaseIndexOf(result.state, 'leg-2')).toBe(1);
  });

  it("ignores the delay on a windowed movement", () => {
    // A window *was* the timing in V1, so delay never applied to one.
    for (const a of result.state.phases.flatMap(p => p.actions)) {
      if (a.id.startsWith('movement-')) expect(a.holdMs).toBeUndefined();
    }
  });
});

describe("legacy and edge data", () => {
  it("converts a ball Movement and says it was legacy", () => {
    const result = migrateTacticToV2(legacyBallMovementTactic());
    const action = findAction(result.state, 'movement-0')!;
    expect(action.actorId).toBe(BALL);
    expect(codes(result)).toContain('legacy-ball-movement');
  });

  /**
   * V1 playback wrote interpolated positions straight into `players`, so a tactic
   * saved while paused has a displaced roster. The movement path is the authored
   * truth — reading `players` naively bakes the displacement in permanently.
   */
  it("takes the resting board from movement paths, not from a displaced roster", () => {
    const { state } = migrateTacticToV2(pausedMidAnimationTactic());
    expect(state.initialBoard[H(8)]).toEqual({ x: 44, y: 30 });
  });

  it("takes the ball's resting position from the start of the pass chain", () => {
    const { state } = migrateTacticToV2({
      ...gestureAuthoredTactic(),
      fieldSettings: { ...gestureAuthoredTactic().fieldSettings!, ball: { x: 99, y: 1 } },
    });
    expect(state.initialBoard[BALL]).toEqual({ x: 6, y: 50 });
  });

  it("survives a tactic with no animation at all", () => {
    const result = migrateTacticToV2({ players: [], animation: null, arrows: null });
    expect(result.staticOnly).toBe(true);
    expect(result.state.phases).toEqual([]);
    expect(result.state.schemaVersion).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

describe("preset keyframes", () => {
  const result = migrateTacticToV2(presetTactic());

  it("recovers a phase per pose", () => {
    expect(result.source).toBe('keyframes');
    expect(codes(result)).toContain('keyframes-converted');
    // Four keyframes, one of which is a pause, so two phases move.
    expect(result.state.phases).toHaveLength(2);
  });

  it("names phases after the preset's own labels", () => {
    expect(result.state.phases.map(p => p.id)).toEqual([
      'Keeper to centre-back',
      'Centre-back into the pivot',
    ]);
  });

  it("uses recorded durations, not speeds", () => {
    for (const action of result.state.phases.flatMap(p => p.actions)) {
      expect(action.durationMs).toBe(1600);
      expect(action.speed).toBeUndefined();
    }
  });

  it("turns a pose where nothing moves into a hold", () => {
    // The preset holds its shape from 1600ms to 3200ms; that stillness is real and
    // has to survive, or the move plays 1.6s short.
    expect(result.state.phases[1].holdMs).toBe(1600);
  });

  it("only moves the actors that actually moved", () => {
    const first = result.state.phases[0].actions.map(a => a.actorId).sort();
    expect(first).toEqual([BALL, H(5)]);
  });

  it("reproduces the original total duration", () => {
    const timeline = resolveTimeline(result.state);
    expect(timeline.resetStartMs).toBe(4800);
  });
});

// ---------------------------------------------------------------------------
// Everything the converter emits has to be valid V2
// ---------------------------------------------------------------------------

describe.each(V1_FIXTURES)("compiles cleanly: $name", ({ tactic }) => {
  const result = migrateTacticToV2(tactic());
  const timeline = resolveTimeline(result.state);

  it("produces no compiler errors", () => {
    // A converter that emits unknown actors or zero-length actions has lost data,
    // even though the compiler tolerates both.
    const bad = timeline.warnings.filter(
      w => w.code === 'unknown-actor' || w.code === 'no-start-position',
    );
    expect(bad).toEqual([]);
  });

  it("closes the loop", () => {
    const actors = [...new Set(timeline.segments.map(s => s.actorId))];
    for (const a of actors) {
      const fallback = result.state.initialBoard[a] ?? { x: 50, y: 50 };
      const start = positionAt(timeline.segments, a, 0, fallback);
      const end = positionAt(timeline.segments, a, timeline.totalMs, fallback);
      expect(pitchDistance(start, end), `${a} is not home at the seam`).toBeLessThan(0.01);
    }
  });

  it("is idempotent to migrate twice", () => {
    expect(JSON.stringify(migrateTacticToV2(tactic()).state)).toBe(
      JSON.stringify(result.state),
    );
  });

  it("references only actors it gave a starting position", () => {
    for (const phase of result.state.phases) {
      for (const action of phase.actions) {
        expect(result.state.initialBoard[action.actorId], action.actorId).toBeDefined();
        if (action.to.kind === 'actor') {
          expect(result.state.initialBoard[action.to.actorId]).toBeDefined();
        }
      }
    }
  });
});
