/**
 * Keyframe interpolation — the V1 playback path.
 *
 * V2 tactics should be played back through `resolveTimeline` + `positionAt` in
 * compile-tactic.ts, which samples motion directly and never materialises
 * keyframes. This module exists for the tactics that only ever had
 * `animation.keyframes` stored against them, which `migrateTacticToV2` reports
 * as `source: 'keyframes'`.
 *
 * Lifted from apps/web/src/hooks/useAnimation.ts, where it was already
 * module-scope and free of React and the DOM.
 */

import type { FieldSettings, Keyframe, Player } from './index';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  const [rA, gA, bA] = parse(hexA);
  const [rB, gB, bB] = parse(hexB);
  return `#${toHex(lerp(rA, rB, t))}${toHex(lerp(gA, gB, t))}${toHex(lerp(bA, bB, t))}`;
}

export interface InterpolatedFrame {
  players: Player[];
  fieldSettings: FieldSettings;
  oppositionPlayers?: Player[];
}

export function getInterpolatedFrame(
  timeMs: number,
  keyframes: Keyframe[],
): InterpolatedFrame | null {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);

  if (timeMs <= sorted[0].timeMs) {
    return {
      players: sorted[0].players,
      fieldSettings: sorted[0].fieldSettings,
      oppositionPlayers: sorted[0].oppositionPlayers,
    };
  }
  if (timeMs >= sorted[sorted.length - 1].timeMs) {
    const last = sorted[sorted.length - 1];
    return {
      players: last.players,
      fieldSettings: last.fieldSettings,
      oppositionPlayers: last.oppositionPlayers,
    };
  }

  let before = sorted[0];
  let after = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].timeMs <= timeMs && sorted[i + 1].timeMs >= timeMs) {
      before = sorted[i];
      after = sorted[i + 1];
      break;
    }
  }

  const span = after.timeMs - before.timeMs;
  const t = span === 0 ? 0 : (timeMs - before.timeMs) / span;

  const lerpPlayers = (fromPlayers: Player[], toPlayers: Player[]): Player[] => {
    const playerMap = new Map(toPlayers.map((p) => [p.id, p]));
    return fromPlayers.map((p) => {
      const target = playerMap.get(p.id);
      if (!target) return p;
      return { ...p, x: lerp(p.x, target.x, t), y: lerp(p.y, target.y, t) };
    });
  };

  const players = lerpPlayers(before.players, after.players);

  const oppositionPlayers =
    before.oppositionPlayers && after.oppositionPlayers
      ? lerpPlayers(before.oppositionPlayers, after.oppositionPlayers)
      : before.oppositionPlayers || after.oppositionPlayers;

  const fs = before.fieldSettings;
  const fs2 = after.fieldSettings;
  // `lift` must be interpolated alongside the position, not dropped — it is how a
  // lofted pass reads as leaving the ground, and rebuilding the ball as {x,y}
  // would silently flatten every long ball.
  const ball =
    fs.ball && fs2.ball
      ? {
          x: lerp(fs.ball.x, fs2.ball.x, t),
          y: lerp(fs.ball.y, fs2.ball.y, t),
          lift: lerp(fs.ball.lift ?? 0, fs2.ball.lift ?? 0, t),
        }
      : fs.ball || fs2.ball;

  const fieldSettings: FieldSettings = {
    fieldColor: lerpHex(fs.fieldColor, fs2.fieldColor, t),
    playerColor: lerpHex(fs.playerColor, fs2.playerColor, t),
    showPlayerLabels: t < 0.5 ? fs.showPlayerLabels : fs2.showPlayerLabels,
    markerType: t < 0.5 ? fs.markerType : fs2.markerType,
    ...(ball && { ball }),
  };

  return { players, fieldSettings, oppositionPlayers };
}
