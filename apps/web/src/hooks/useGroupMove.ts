import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// Runtime values come from the source: the package's dist is CommonJS, which
// Vite serves as-is, so named imports from it fail in the browser.
import { buildGroupRuns, MIN_RUN_DISTANCE, type GroupMember } from "../../../../packages/shared/src/group-move";
import type { Player, TacticArrow } from "../../../../packages/shared";
import { pitchDistance } from "../utils/pitch.ts";

type Team = "home" | "away";
type Point = { x: number; y: number };

const keyOf = (team: Team, playerId: number) => `${team}:${playerId}`;

interface Drag {
  kind: "move" | "marquee";
  origin: Point;
  /** The player the press landed on, if any. */
  hit: GroupMember | null;
}

interface UseGroupMoveArgs {
  enabled: boolean;
  players: Player[];
  oppositionPlayers: Player[];
  showOpposition: boolean;
  toFieldPct: (clientX: number, clientY: number) => Point;
  grabRadius: number;
  currentBeat: number;
  color?: string;
  setArrows: (update: (prev: TacticArrow[]) => TacticArrow[]) => void;
}

/**
 * Group move: pick several players, then drag one of them and every picked
 * player gets the same run in the current beat.
 *
 * Click a player to toggle them, drag on open pitch to box-select, click open
 * pitch (or Esc) to clear. The runs themselves are ordinary run arrows (see
 * `buildGroupRuns`), so they compile, play and save like any other.
 */
export function useGroupMove({
  enabled, players, oppositionPlayers, showOpposition, toFieldPct, grabRadius,
  currentBeat, color, setArrows,
}: UseGroupMoveArgs) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [drag, setDrag] = useState<Drag | null>(null);
  const [current, setCurrent] = useState<Point | null>(null);
  /** The player under the pointer: this layer sits over the markers, so they can't see the hover themselves. */
  const [hovered, setHovered] = useState<string | null>(null);
  const previewIds = useRef(0);

  const everyone = useMemo<GroupMember[]>(() => [
    ...players.map(p => ({ team: "home" as const, playerId: p.id, x: p.x, y: p.y })),
    ...(showOpposition
      ? oppositionPlayers.map(p => ({ team: "away" as const, playerId: p.id, x: p.x, y: p.y }))
      : []),
  ], [players, oppositionPlayers, showOpposition]);

  // Leaving the mode drops the selection, so coming back starts clean.
  useEffect(() => {
    if (!enabled) { setSelected(new Set()); setDrag(null); setCurrent(null); setHovered(null); }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(new Set()); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  const memberAt = useCallback((pt: Point) => {
    let nearest: GroupMember | null = null;
    let min = grabRadius;
    for (const m of everyone) {
      const d = pitchDistance(m, pt);
      if (d < min) { min = d; nearest = m; }
    }
    return nearest;
  }, [everyone, grabRadius]);

  /** Who moves: the selection, plus the player the drag started on. */
  const movers = useCallback((hit: GroupMember | null) => {
    const keys = new Set(selected);
    if (hit) keys.add(keyOf(hit.team, hit.playerId));
    return everyone.filter(m => keys.has(keyOf(m.team, m.playerId)));
  }, [selected, everyone]);

  const dragDistance = drag && current ? Math.hypot(current.x - drag.origin.x, current.y - drag.origin.y) : 0;
  const isDragging = dragDistance > MIN_RUN_DISTANCE;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    // Keep receiving moves if the pointer leaves the board mid-drag.
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const pt = toFieldPct(e.clientX, e.clientY);
    const hit = memberAt(pt);
    setDrag({ kind: hit ? "move" : "marquee", origin: pt, hit });
    setCurrent(pt);
  }, [enabled, toFieldPct, memberAt]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const pt = toFieldPct(e.clientX, e.clientY);
    if (drag) { setCurrent(pt); return; }
    const m = memberAt(pt);
    const k = m ? keyOf(m.team, m.playerId) : null;
    setHovered(prev => (prev === k ? prev : k));
  }, [drag, toFieldPct, memberAt]);

  const onPointerLeave = useCallback(() => setHovered(null), []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!drag) return;
    const end = toFieldPct(e.clientX, e.clientY);
    const moved = Math.hypot(end.x - drag.origin.x, end.y - drag.origin.y) > MIN_RUN_DISTANCE;

    if (!moved) {
      // A click: toggle who it landed on, or clear on open pitch.
      if (drag.hit) {
        const k = keyOf(drag.hit.team, drag.hit.playerId);
        setSelected(prev => {
          const next = new Set(prev);
          if (next.has(k)) next.delete(k); else next.add(k);
          return next;
        });
      } else {
        setSelected(new Set());
      }
    } else if (drag.kind === "move") {
      const members = movers(drag.hit);
      const delta = { x: end.x - drag.origin.x, y: end.y - drag.origin.y };
      setArrows(prev => buildGroupRuns({ members, delta, beat: currentBeat, color, existing: prev }));
      // Keep them picked, so a redraw (which replaces the runs) is one drag away.
      setSelected(new Set(members.map(m => keyOf(m.team, m.playerId))));
    } else {
      const minX = Math.min(drag.origin.x, end.x), maxX = Math.max(drag.origin.x, end.x);
      const minY = Math.min(drag.origin.y, end.y), maxY = Math.max(drag.origin.y, end.y);
      setSelected(prev => {
        const next = new Set(prev);
        for (const m of everyone) {
          if (m.x >= minX && m.x <= maxX && m.y >= minY && m.y <= maxY) next.add(keyOf(m.team, m.playerId));
        }
        return next;
      });
    }
    setDrag(null);
    setCurrent(null);
  }, [drag, toFieldPct, movers, setArrows, currentBeat, color, everyone]);

  const onPointerCancel = useCallback(() => { setDrag(null); setCurrent(null); setHovered(null); }, []);

  /** Ghost runs while a group drag is in progress. */
  const previewArrows = useMemo<TacticArrow[]>(() => {
    if (!drag || drag.kind !== "move" || !current || !isDragging) return [];
    const delta = { x: current.x - drag.origin.x, y: current.y - drag.origin.y };
    return buildGroupRuns({
      members: movers(drag.hit), delta, beat: currentBeat, color, existing: [],
      newId: () => `group-preview-${previewIds.current++}`,
    });
  }, [drag, current, isDragging, movers, currentBeat, color]);

  /** The box being dragged out, in pitch coordinates. */
  const marquee = drag?.kind === "marquee" && current && isDragging ? { a: drag.origin, b: current } : null;

  /**
   * Who is picked right now, linked before the drag so the unit is visible as
   * it is built. Mid-drag it includes the grabbed player and orders across the
   * run being dragged.
   */
  const pendingLink = useMemo(() => {
    const members = drag?.kind === "move" ? movers(drag.hit) : movers(null);
    const delta = drag?.kind === "move" && current && isDragging
      ? { x: current.x - drag.origin.x, y: current.y - drag.origin.y }
      : null;
    return { points: members.map(m => ({ x: m.x, y: m.y })), delta };
  }, [drag, current, isDragging, movers]);

  const isSelected = useCallback(
    (team: Team, playerId: number) => selected.has(keyOf(team, playerId)),
    [selected],
  );

  const isHovered = useCallback(
    (team: Team, playerId: number) => hovered === keyOf(team, playerId),
    [hovered],
  );

  return {
    isSelected,
    isHovered,
    /** Something grabbable is under the pointer (or being dragged). */
    overPlayer: hovered !== null || drag?.kind === "move",
    selectedCount: selected.size,
    previewArrows,
    pendingLink,
    marquee,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave },
  };
}
