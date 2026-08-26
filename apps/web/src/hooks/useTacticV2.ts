import { useCallback, useMemo } from "react";
import {
  BALL,
  compileTactic,
  playerActor,
  positionAt,
  tacticStateFromArrows,
  type Ball,
  type CompileWarning,
  type FieldSettings,
  type Keyframe,
  type Player,
  type TacticArrow,
  type TacticState,
  type Timeline,
} from "../../../../packages/shared/src";

/**
 * The V2 phase model, derived from what is on the board.
 *
 * Two things make this different from the V1 recompile effect it replaces:
 *
 * 1. It takes the *authored* board rather than the live one. V1 read `players`
 *    directly, which is also what playback writes into — so pausing mid-animation
 *    and recompiling baked the displacement into the tactic. Here the board is an
 *    explicit input, and the caller is responsible for passing the authored one.
 * 2. Time is an output. Phase length comes from distance over speed, so a short
 *    shift no longer takes as long as a forty-metre overlap just because they
 *    share a beat.
 *
 * An arrow's `beat` is its phase number, so the arrows already carry the running
 * order and nothing new has to be stored to sequence them.
 */

export interface AuthoredBoard {
  players: Player[];
  oppositionPlayers: Player[];
  ball: Ball;
}

interface UseTacticV2Args {
  arrows: TacticArrow[];
  board: AuthoredBoard;
  fieldSettings: FieldSettings;
  /** Off leaves the arrows as static annotation, exactly as V1's `fromArrows` did. */
  enabled: boolean;
  fps: number;
  /**
   * Divides every duration. Real football speeds put a full move at 10-25s, which
   * is honest but much slower than the fixed 5s loop V1 crammed everything into,
   * so playback is compressed while every ratio is left intact.
   */
  timeScale: number;
}

export interface TacticV2 {
  state: TacticState;
  timeline: Timeline;
  keyframes: Keyframe[];
  durationMs: number;
  /** How many phases the arrows describe. 0 when nothing animates. */
  phaseCount: number;
  /** Compiler warnings, surfaced so an impossible rendezvous is visible. */
  warnings: CompileWarning[];
  /** The board as it stands at the start of phase `n` (1-based). */
  boardAtPhase: (n: number) => AuthoredBoard;
  /** Absolute ms at which phase `n` (1-based) begins. */
  phaseStartMs: (n: number) => number;
}

export function useTacticV2({
  arrows,
  board,
  fieldSettings,
  enabled,
  fps,
  timeScale,
}: UseTacticV2Args): TacticV2 {
  const { players, oppositionPlayers, ball } = board;

  const state = useMemo(
    () =>
      enabled
        ? tacticStateFromArrows(arrows, players, oppositionPlayers, ball).state
        : { schemaVersion: 2 as const, initialBoard: {}, phases: [] },
    [enabled, arrows, players, oppositionPlayers, ball],
  );

  const compiled = useMemo(
    () =>
      compileTactic(state, {
        players,
        ...(oppositionPlayers.length > 0 && { oppositionPlayers }),
        fieldSettings,
        fps,
        timeScale,
      }),
    // fieldSettings is rebuilt every render by its owner; the geometry that
    // matters is already covered by `state`, and the visual fields it carries are
    // copied into every keyframe verbatim rather than affecting timing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, players, oppositionPlayers, fps, timeScale],
  );

  const { timeline } = compiled;

  const phaseStartMs = useCallback(
    (n: number) => {
      if (n <= 1) return 0;
      const idx = n - 1;
      if (idx < timeline.phaseStartsMs.length) return timeline.phaseStartsMs[idx];
      // Stepping past the last phase is how you start a new one, and the board there
      // is the board once everything has finished — not t=0. `resetStartMs` is
      // exactly that moment: every action done, nothing walked home yet.
      return timeline.resetStartMs;
    },
    [timeline],
  );

  /**
   * The pose at the start of a phase — the whole point of Step.
   *
   * Drawing phase 3 means drawing from where the players actually are once phases
   * 1 and 2 have played, so the board has to be able to show that. Positions come
   * from the timeline; identity (name, number, cards) comes from the roster, which
   * is why this returns players rather than bare points.
   */
  const boardAtPhase = useCallback(
    (n: number): AuthoredBoard => {
      const t = phaseStartMs(n);
      const pose = (roster: Player[], team: 'home' | 'away'): Player[] =>
        roster.map(p => {
          const { x, y } = positionAt(timeline.segments, playerActor(team, p.id), t, {
            x: p.x,
            y: p.y,
          });
          return { ...p, x, y };
        });
      return {
        players: pose(players, 'home'),
        oppositionPlayers: pose(oppositionPlayers, 'away'),
        ball: positionAt(timeline.segments, BALL, t, ball),
      };
    },
    [timeline, players, oppositionPlayers, ball, phaseStartMs],
  );

  return {
    state,
    timeline,
    keyframes: compiled.keyframes,
    durationMs: compiled.durationMs,
    phaseCount: timeline.phaseStartsMs.length,
    warnings: timeline.warnings,
    boardAtPhase,
    phaseStartMs,
  };
}
