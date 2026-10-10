/**
 * Group move: several players dragged together as one gesture.
 *
 * A group move is nothing new to the engine. It is one run arrow per selected
 * player, all in the current beat and all with the same displacement, so it
 * compiles, plays and saves exactly like runs drawn one at a time.
 */

import type { TacticArrow } from './index';

type Team = 'home' | 'away';
type Point = { x: number; y: number };

export interface GroupMember {
  team: Team;
  playerId: number;
  x: number;
  y: number;
}

/** Shortest move worth a run, in pitch percent: the arrow tool's own threshold. */
export const MIN_RUN_DISTANCE = 2;

const BALL_TYPES = new Set<TacticArrow['type']>(['pass', 'dribble', 'long-ball', 'target-zone']);

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

/** The beat an arrow plays in; absent or junk means beat 1. */
export const beatOfArrow = (a: TacticArrow) => Math.max(1, Math.floor(a.beat ?? 1));

/**
 * Whether `a` is `who`'s run in `beat`. A player is in one place, so they get
 * one run per beat, and a new one replaces it.
 */
export function isPlayersRunInBeat(
  a: TacticArrow,
  who: { team: Team; playerId: number; x: number; y: number },
  beat: number,
): boolean {
  if (BALL_TYPES.has(a.type) || beatOfArrow(a) !== beat) return false;
  return a.from
    ? a.from.team === who.team && a.from.playerId === who.playerId
    // Arrows saved before refs were bound: their start snapped to the marker.
    : a.points[0]?.x === who.x && a.points[0]?.y === who.y;
}

export interface GroupRunsInput {
  members: GroupMember[];
  delta: Point;
  beat: number;
  color?: string;
  existing: TacticArrow[];
  /** Injected for tests; defaults to crypto.randomUUID. */
  newId?: () => string;
}

/**
 * The arrow list after a group move: each member's run in this beat replaced
 * by one that moves them by `delta`, clamped to the pitch. A member the pitch
 * edge leaves with almost no move gets no run (and keeps any it had).
 */
export function buildGroupRuns({
  members, delta, beat, color, existing, newId = () => crypto.randomUUID(),
}: GroupRunsInput): TacticArrow[] {
  const groupId = newId();
  const runs: TacticArrow[] = [];
  const moved: GroupMember[] = [];

  for (const m of members) {
    const end = { x: clampPct(m.x + delta.x), y: clampPct(m.y + delta.y) };
    if (Math.hypot(end.x - m.x, end.y - m.y) <= MIN_RUN_DISTANCE) continue;
    moved.push(m);
    runs.push({
      id: newId(),
      type: 'direct-run',
      points: [{ x: m.x, y: m.y }, end],
      ...(color && { color }),
      beat,
      from: { team: m.team, playerId: m.playerId },
      groupId,
    });
  }

  if (runs.length === 0) return existing;
  const kept = existing.filter(a => !moved.some(m => isPlayersRunInBeat(a, m, beat)));
  return [...kept, ...runs];
}

// ---------------------------------------------------------------------------
// Group links: the dashed line that shows a group moving as one unit.
// ---------------------------------------------------------------------------

type PlayerRef = { team: Team; playerId: number };

export interface MovingGroup {
  groupId: string;
  beat: number;
  members: PlayerRef[];
  /** The group's shared displacement, for ordering the link across the run. */
  delta: Point;
}

/**
 * The groups a set of arrows holds, with at least two members still in them.
 * A member whose run was redrawn on its own has left the group, since the new
 * run carries no groupId.
 */
export function movingGroups(arrows: TacticArrow[]): MovingGroup[] {
  const byId = new Map<string, MovingGroup>();
  for (const a of arrows) {
    if (!a.groupId || !a.from || a.points.length < 2) continue;
    let g = byId.get(a.groupId);
    if (!g) {
      g = {
        groupId: a.groupId,
        beat: beatOfArrow(a),
        members: [],
        delta: { x: a.points[1].x - a.points[0].x, y: a.points[1].y - a.points[0].y },
      };
      byId.set(a.groupId, g);
    }
    g.members.push(a.from);
  }
  return [...byId.values()].filter(g => g.members.length >= 2);
}

/**
 * Points in the order a line through them should join them: across the run,
 * so a back four stepping up links 3–6–5–2 rather than zigzagging in the order
 * they were picked. With no run yet, along whichever axis they spread more.
 */
export function orderAcross<T extends Point>(points: T[], dir?: Point | null): T[] {
  const len = dir ? Math.hypot(dir.x, dir.y) : 0;
  let key: (p: Point) => number;
  if (dir && len > 1e-6) {
    // Perpendicular to the run.
    key = p => -dir.y * p.x + dir.x * p.y;
  } else {
    const spread = (f: (p: Point) => number) => Math.max(...points.map(f)) - Math.min(...points.map(f));
    key = spread(p => p.x) > spread(p => p.y) ? p => p.x : p => p.y;
  }
  return [...points].sort((a, b) => key(a) - key(b));
}
