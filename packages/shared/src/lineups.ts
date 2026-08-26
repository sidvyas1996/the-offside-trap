/**
 * Default rosters and the pitch palette.
 *
 * Copied from apps/web/src/utils/default-lineup-*.ts and colors.ts so the mobile
 * client can render a board before any tactic has loaded, and so both clients
 * agree on what "the default 4-3-3" is.
 *
 * These are functions rather than arrays because the caller mutates the players
 * it is handed; returning a fresh array each call is what stops one screen's
 * edits leaking into the next.
 */

import type { Player } from './index';

// ── Pitch palette ───────────────────────────────────────────────────────────
// The same values apps/web/src/utils/colors.ts declares, lifted here so the
// pitch geometry and its palette travel together.

/** Grass Green, from the design-language palette. */
export const DEFAULT_FOOTBALL_FIELD_COLOUR = '#19a974';
/** Darker grass, the mown-stripe shade. */
export const FOOTBALL_FIELD_STRIPE_COLOUR = '#169d6c';
/** Dark navy for player circles. */
export const DEFAULT_PLAYER_COLOUR = '#111827';
/** Pitch markings. */
export const PITCH_LINE_COLOUR = 'rgba(255,255,255,0.85)';

// ── Rosters ─────────────────────────────────────────────────────────────────

/** Home 4-3-3, attacking right in stored coordinates. */
export const defaultLineupSingle = (): Player[] => [
  { id: 1, x: 5, y: 50, number: 1 },
  { id: 2, x: 20, y: 85, number: 2 },
  { id: 3, x: 20, y: 65, number: 5 },
  { id: 4, x: 20, y: 35, number: 6 },
  { id: 5, x: 20, y: 15, number: 3 },
  { id: 6, x: 45, y: 65, number: 4 },
  { id: 7, x: 45, y: 35, number: 8 },
  { id: 8, x: 65, y: 80, number: 7 },
  { id: 9, x: 65, y: 50, number: 10 },
  { id: 10, x: 65, y: 20, number: 11 },
  { id: 11, x: 80, y: 50, number: 9 },
];

/** Mirrored 4-3-3 facing left. IDs are 101-111 so they cannot collide with home. */
export const defaultLineupOpposition = (): Player[] => [
  { id: 101, x: 95, y: 50, number: 1 }, // GK
  { id: 102, x: 80, y: 15, number: 2 }, // RB
  { id: 103, x: 80, y: 35, number: 5 }, // CB
  { id: 104, x: 80, y: 65, number: 6 }, // CB
  { id: 105, x: 80, y: 85, number: 3 }, // LB
  { id: 106, x: 55, y: 35, number: 4 }, // CM
  { id: 107, x: 55, y: 65, number: 8 }, // CM
  { id: 108, x: 35, y: 20, number: 7 }, // RW
  { id: 109, x: 35, y: 50, number: 10 }, // CAM
  { id: 110, x: 35, y: 80, number: 11 }, // LW
  { id: 111, x: 20, y: 50, number: 9 }, // ST
];

/**
 * Positional labels for a 4-3-3, indexed to match `defaultLineupSingle`.
 *
 * The stored `Player` has an optional `position` that most saved tactics leave
 * empty, but the mobile lineup screen prints a role pill under every jersey. This
 * is the fallback so that screen has something to show rather than a blank chip.
 */
export const DEFAULT_ROLES_433 = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'RW', 'AM', 'LW', 'ST'];

/**
 * Best-effort role for a player, preferring whatever was actually saved.
 *
 * Falls back on shirt number, which is the convention the default roster follows
 * and the one a coach reading the board will assume.
 */
export function roleFor(player: Player, index: number): string {
  if (player.position) return player.position;
  const byNumber: Record<number, string> = {
    1: 'GK',
    2: 'RB',
    3: 'LB',
    4: 'DM',
    5: 'CB',
    6: 'CB',
    7: 'RW',
    8: 'CM',
    9: 'ST',
    10: 'AM',
    11: 'LW',
  };
  return byNumber[player.number] ?? DEFAULT_ROLES_433[index] ?? '';
}
