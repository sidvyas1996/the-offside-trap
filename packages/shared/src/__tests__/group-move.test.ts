import { describe, expect, it } from "vitest";
import { buildGroupRuns, movingGroups, orderAcross, type GroupMember } from "../group-move";
import { tacticStateFromArrows } from "../migrate-v1";
import type { Player, TacticArrow } from "../index";

let n = 0;
const newId = () => `id-${n++}`;

const backFour: GroupMember[] = [
  { team: 'home', playerId: 2, x: 20, y: 15 },
  { team: 'home', playerId: 3, x: 20, y: 38 },
  { team: 'home', playerId: 4, x: 20, y: 62 },
  { team: 'home', playerId: 5, x: 20, y: 85 },
];

const player = (m: GroupMember): Player =>
  ({ id: m.playerId, x: m.x, y: m.y, name: '', number: m.playerId, position: '' } as unknown as Player);

describe("buildGroupRuns", () => {
  it("gives every member the same run, in the beat, under one group id", () => {
    const out = buildGroupRuns({ members: backFour, delta: { x: 10, y: 0 }, beat: 2, existing: [], newId });
    expect(out).toHaveLength(4);
    expect(new Set(out.map(a => a.groupId)).size).toBe(1);
    for (const [i, a] of out.entries()) {
      expect(a.type).toBe('direct-run');
      expect(a.beat).toBe(2);
      expect(a.from).toEqual({ team: 'home', playerId: backFour[i].playerId });
      expect(a.points).toEqual([{ x: 20, y: backFour[i].y }, { x: 30, y: backFour[i].y }]);
    }
  });

  it("clamps to the pitch and skips members the edge leaves with no move", () => {
    const members: GroupMember[] = [
      { team: 'home', playerId: 1, x: 50, y: 95 },
      { team: 'away', playerId: 9, x: 50, y: 99 },
    ];
    const out = buildGroupRuns({ members, delta: { x: 0, y: 10 }, beat: 1, existing: [], newId });
    expect(out).toHaveLength(1);
    expect(out[0].points[1]).toEqual({ x: 50, y: 100 });
    expect(out[0].from).toEqual({ team: 'home', playerId: 1 });
  });

  it("replaces a member's run in the same beat only", () => {
    const old = (beat: number): TacticArrow => ({
      id: `old-${beat}`, type: 'curved-run', beat,
      points: [{ x: 20, y: 15 }, { x: 25, y: 20 }], from: { team: 'home', playerId: 2 },
    });
    const pass: TacticArrow = { id: 'pass', type: 'pass', beat: 1, points: [{ x: 20, y: 15 }, { x: 40, y: 40 }] };
    const out = buildGroupRuns({
      members: [backFour[0]], delta: { x: 5, y: 0 }, beat: 1, existing: [old(1), old(2), pass], newId,
    });
    expect(out.map(a => a.id)).not.toContain('old-1');
    expect(out.map(a => a.id)).toEqual(expect.arrayContaining(['old-2', 'pass']));
  });

  it("does nothing when nobody moves far enough", () => {
    const existing: TacticArrow[] = [];
    expect(buildGroupRuns({ members: backFour, delta: { x: 1, y: 1 }, beat: 1, existing, newId })).toBe(existing);
  });

  it("compiles to one phase that moves the whole group together", () => {
    const arrows = buildGroupRuns({ members: backFour, delta: { x: 10, y: 0 }, beat: 1, existing: [], newId });
    const { state } = tacticStateFromArrows(arrows, backFour.map(player), [], { x: 50, y: 50 });
    expect(state.phases).toHaveLength(1);
    expect(state.phases[0].actions.map(a => a.actorId).sort()).toEqual(['home:2', 'home:3', 'home:4', 'home:5']);
  });
});

describe("movingGroups", () => {
  it("collects a group's members and drops groups left with one", () => {
    const arrows = buildGroupRuns({ members: backFour, delta: { x: 10, y: 0 }, beat: 3, existing: [], newId });
    const [g] = movingGroups(arrows);
    expect(g.beat).toBe(3);
    expect(g.delta).toEqual({ x: 10, y: 0 });
    expect(g.members.map(m => m.playerId)).toEqual([2, 3, 4, 5]);

    // Three redrawn on their own: the group is down to one and no longer links.
    const solo = arrows.map((a, i) => (i === 0 ? a : { ...a, groupId: undefined }));
    expect(movingGroups(solo)).toEqual([]);
  });
});

describe("orderAcross", () => {
  const pts = [{ x: 20, y: 62 }, { x: 20, y: 15 }, { x: 20, y: 85 }, { x: 20, y: 38 }];

  it("orders across a run up the pitch", () => {
    expect(orderAcross(pts, { x: 10, y: 0 }).map(p => p.y)).toEqual([15, 38, 62, 85]);
  });

  it("orders across a run across the pitch", () => {
    const line = [{ x: 60, y: 50 }, { x: 30, y: 50 }, { x: 45, y: 50 }];
    expect(orderAcross(line, { x: 0, y: 10 }).map(p => p.x)).toEqual([60, 45, 30]);
  });

  it("falls back to the wider spread with no run", () => {
    expect(orderAcross(pts).map(p => p.y)).toEqual([15, 38, 62, 85]);
  });
});
