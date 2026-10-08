/**
 * The little picture a tactic card draws: who stands where, in what colours,
 * and — for an animated tactic — a handful of poses to replay on hover.
 *
 * Built on the server from the full tactic so the list endpoint never ships a
 * whole animation (hundreds of keyframes, each a full field snapshot) just to
 * wiggle a thumbnail. A card's preview is a couple of kilobytes.
 */

import type { AnimationData, Ball, FieldSettings, Player } from './index';

export type TacticKind = 'animated' | 'lineup';

export interface PreviewMarker {
  x: number;
  y: number;
  /** What the marker shows: the position if set, else the shirt number. */
  label: string;
}

export interface PreviewColors {
  fieldColor: string;
  home: { bg: string; border: string; text: string };
  away: { bg: string; border: string; text: string };
}

/** One sampled pose. Positions are `[x, y]` in the same order as the markers. */
export interface PreviewFrame {
  /** 0–1 through the animation. */
  t: number;
  home: [number, number][];
  away?: [number, number][];
  ball?: [number, number];
}

export interface TacticPreview {
  kind: TacticKind;
  home: PreviewMarker[];
  away?: PreviewMarker[];
  ball?: Ball;
  colors: PreviewColors;
  /** Animated only: sampled poses, first and last always included. */
  frames?: PreviewFrame[];
  /** Animated only: the real running time, which the card compresses. */
  durationMs?: number;
}

/** Most poses a card replays. Enough to read the move; small enough to ship. */
export const PREVIEW_MAX_FRAMES = 12;

// The studio's own defaults (FootballFieldContext), so an unstyled tactic looks
// the same on its card as on the board.
const DEFAULT_FIELD = '#19a974';
const DEFAULT_HOME = { bg: '#111827', border: '#ffffff', text: '#ffffff' };
const DEFAULT_AWAY = { bg: '#ff6fae', border: '#ffffff', text: '#111827' };

const round1 = (n: number) => Math.round(n * 10) / 10;

const parse = <T>(v: unknown): T | null => {
  if (v == null) return null;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return null; }
  }
  return v as T;
};

const markerOf = (p: Player): PreviewMarker => ({
  x: round1(p.x),
  y: round1(p.y),
  label: p.position || String(p.number ?? ''),
});

const kitOf = (fs: FieldSettings | null, fallback: typeof DEFAULT_HOME) => ({
  bg: fs?.markerBgColor || fallback.bg,
  border: fs?.markerBorderColor || fallback.border,
  text: fs?.markerTextColor || fallback.text,
});

/**
 * Indices of up to `max` items spread evenly through `count`, always keeping
 * the first and the last so the replay starts and lands where the move does.
 */
export function sampleIndices(count: number, max: number): number[] {
  if (count <= max) return Array.from({ length: count }, (_, i) => i);
  const out = new Set<number>();
  for (let i = 0; i < max; i++) out.add(Math.round((i * (count - 1)) / (max - 1)));
  return [...out].sort((a, b) => a - b);
}

/**
 * Positions of `roster` in `snapshot`, matched by id so a keyframe that lists
 * players in another order (or drops one) cannot shuffle the markers. A player
 * missing from the snapshot holds their base spot.
 */
function poseOf(roster: PreviewMarker[], ids: number[], snapshot: Player[] | undefined): [number, number][] {
  const byId = new Map((snapshot ?? []).map(p => [p.id, p]));
  return roster.map((m, i) => {
    const p = byId.get(ids[i]);
    return p ? [round1(p.x), round1(p.y)] : [m.x, m.y];
  });
}

export interface TacticPreviewSource {
  players: unknown;
  fieldSettings?: unknown;
  oppositionPlayers?: unknown;
  oppositionFieldSettings?: unknown;
  animation?: unknown;
}

export function buildTacticPreview(row: TacticPreviewSource): TacticPreview {
  const players = parse<Player[]>(row.players) ?? [];
  const fs = parse<FieldSettings>(row.fieldSettings);
  const opp = parse<Player[]>(row.oppositionPlayers) ?? [];
  const oppFs = parse<FieldSettings>(row.oppositionFieldSettings);
  const animation = parse<AnimationData>(row.animation);

  const home = players.map(markerOf);
  const away = opp.length > 0 ? opp.map(markerOf) : undefined;
  const keyframes = animation?.keyframes ?? [];
  const kind: TacticKind = keyframes.length >= 2 ? 'animated' : 'lineup';

  const preview: TacticPreview = {
    kind,
    home,
    ...(away && { away }),
    // A lineup has no ball; a tactic's lives in its field settings.
    ...(kind === 'animated' && fs?.ball && { ball: { x: round1(fs.ball.x), y: round1(fs.ball.y) } }),
    colors: {
      fieldColor: fs?.fieldColor || DEFAULT_FIELD,
      home: kitOf(fs, DEFAULT_HOME),
      away: kitOf(oppFs, DEFAULT_AWAY),
    },
  };

  if (kind === 'animated') {
    const homeIds = players.map(p => p.id);
    const awayIds = opp.map(p => p.id);
    const first = keyframes[0].timeMs;
    const span = Math.max(1, keyframes[keyframes.length - 1].timeMs - first);
    preview.durationMs = animation?.durationMs ?? span;
    preview.frames = sampleIndices(keyframes.length, PREVIEW_MAX_FRAMES).map(i => {
      const kf = keyframes[i];
      const b = kf.fieldSettings?.ball;
      return {
        t: Math.round(((kf.timeMs - first) / span) * 1000) / 1000,
        home: poseOf(home, homeIds, kf.players),
        ...(away && { away: poseOf(away, awayIds, kf.oppositionPlayers) }),
        ...(b && { ball: [round1(b.x), round1(b.y)] as [number, number] }),
      };
    });
  }

  return preview;
}
