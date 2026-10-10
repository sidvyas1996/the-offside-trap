import React from "react";
import type { Player } from "../../../../packages/shared";
import { orderAcross, type MovingGroup } from "../../../../packages/shared/src/group-move";
import { LANDSCAPE, type PitchProjection } from "../utils/pitch";

type Point = { x: number; y: number };

interface GroupLinksProps {
  groups: MovingGroup[];
  /** The players being picked for a group move, linked before the drag. */
  pending?: { points: Point[]; delta?: Point | null };
  players: Player[];
  oppositionPlayers: Player[];
  /** Dim groups from other beats, as the arrows are. */
  activeBeat?: number;
  /** Name labels hang under the markers, so the line has to stop short of them too. */
  showLabels?: boolean;
  /** Beat badges sit above a running player's marker. */
  showBadges?: boolean;
  /**
   * SVG units per unscaled marker pixel. Markers and labels are sized in pixels
   * (times the board's marker scale) while this layer is in pitch units, so the
   * gap around a player has to be converted at the board's current size.
   */
  markerPxToUnits: number;
  projection?: PitchProjection;
}

const LINK_COLOR = '#ffffff';

/**
 * The space a player takes up, in unscaled marker pixels from its centre: the
 * marker with its outline and selection ring, and the name label hanging below
 * it (measured off PlayerMarker). The line stops at the edge of this box, so it
 * runs between players instead of over them.
 */
const PLAYER_BOX_PX = { halfWidth: 26, above: 26, below: 26, belowWithLabel: 50 };
/** Top of ArrowOverlay's BeatBadge above the marker centre, in SVG units (cy - 14, r 8, stroke). */
const BADGE_TOP_UNITS = 24;

type Box = { halfWidth: number; above: number; below: number };

/** How far along d (as a fraction) a line leaving p in direction d clears p's box. */
const exitFraction = (d: Point, box: Box) => {
  const fx = d.x === 0 ? Infinity : box.halfWidth / Math.abs(d.x);
  const fy = d.y === 0 ? Infinity : (d.y > 0 ? box.below : box.above) / Math.abs(d.y);
  return Math.min(fx, fy);
};

/** The visible part of a link between two players, or null if they are too close for any. */
function clipSegment(a: Point, b: Point, box: Box): [Point, Point] | null {
  const d = { x: b.x - a.x, y: b.y - a.y };
  const s = exitFraction(d, box);
  const e = exitFraction({ x: -d.x, y: -d.y }, box);
  if (s + e >= 1) return null;
  return [
    { x: a.x + d.x * s, y: a.y + d.y * s },
    { x: b.x - d.x * e, y: b.y - d.y * e },
  ];
}

/**
 * The dashed line through a group that moves as one unit.
 *
 * Drawn through the players' *live* positions, so it travels with them in
 * playback: a back four stepping up shows as one line stepping up, and a line
 * that breaks shape shows that too.
 */
const GroupLinks: React.FC<GroupLinksProps> = ({
  groups, pending, players, oppositionPlayers, activeBeat,
  showLabels = true, showBadges = false, markerPxToUnits, projection = LANDSCAPE,
}) => {
  const k = markerPxToUnits;
  const box: Box = {
    halfWidth: PLAYER_BOX_PX.halfWidth * k,
    above: Math.max(PLAYER_BOX_PX.above * k, showBadges ? BADGE_TOP_UNITS : 0),
    below: (showLabels ? PLAYER_BOX_PX.belowWithLabel : PLAYER_BOX_PX.below) * k,
  };

  const positionOf = (team: 'home' | 'away', id: number) =>
    (team === 'home' ? players : oppositionPlayers).find(p => p.id === id);

  const toSegments = (pts: Point[], delta?: Point | null) => {
    const svg = orderAcross(pts, delta).map(p => ({ x: projection.toX(p), y: projection.toY(p) }));
    const out: [Point, Point][] = [];
    for (let i = 1; i < svg.length; i++) {
      const seg = clipSegment(svg[i - 1], svg[i], box);
      if (seg) out.push(seg);
    }
    return out;
  };

  const lines = groups.flatMap(g => {
    const pts = g.members.map(m => positionOf(m.team, m.playerId)).filter((p): p is Player => !!p);
    if (pts.length < 2) return [];
    const dimmed = activeBeat !== undefined && g.beat !== activeBeat;
    return [{ key: g.groupId, segments: toSegments(pts, g.delta), opacity: dimmed ? 0.25 : 0.85 }];
  });
  if (pending && pending.points.length >= 2) {
    lines.push({ key: 'pending', segments: toSegments(pending.points, pending.delta), opacity: 0.85 });
  }
  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={projection.viewBox}
      style={{ zIndex: 15, pointerEvents: 'none', overflow: 'visible' }}
    >
      {lines.map(l => (
        <g key={l.key} opacity={l.opacity} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' }}>
          {l.segments.map(([a, b], i) => (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={LINK_COLOR}
              strokeWidth={2}
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}
    </svg>
  );
};

export default GroupLinks;
