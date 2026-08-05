import { useState, useRef, useCallback, useEffect } from "react";
import type { Player, Keyframe, AnimationData, FieldSettings } from "../../../../packages/shared/src";

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

export function getInterpolatedFrame(
  timeMs: number,
  keyframes: Keyframe[]
): { players: Player[]; fieldSettings: FieldSettings; oppositionPlayers?: Player[] } | null {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);

  if (timeMs <= sorted[0].timeMs) {
    return { players: sorted[0].players, fieldSettings: sorted[0].fieldSettings, oppositionPlayers: sorted[0].oppositionPlayers };
  }
  if (timeMs >= sorted[sorted.length - 1].timeMs) {
    const last = sorted[sorted.length - 1];
    return { players: last.players, fieldSettings: last.fieldSettings, oppositionPlayers: last.oppositionPlayers };
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
    const playerMap = new Map(toPlayers.map(p => [p.id, p]));
    return fromPlayers.map(p => {
      const target = playerMap.get(p.id);
      if (!target) return p;
      return { ...p, x: lerp(p.x, target.x, t), y: lerp(p.y, target.y, t) };
    });
  };

  const players = lerpPlayers(before.players, after.players);

  const oppositionPlayers =
    before.oppositionPlayers && after.oppositionPlayers
      ? lerpPlayers(before.oppositionPlayers, after.oppositionPlayers)
      : (before.oppositionPlayers || after.oppositionPlayers);

  const fs = before.fieldSettings;
  const fs2 = after.fieldSettings;
  const ball =
    fs.ball && fs2.ball
      ? { x: lerp(fs.ball.x, fs2.ball.x, t), y: lerp(fs.ball.y, fs2.ball.y, t) }
      : (fs.ball || fs2.ball);
  const fieldSettings: FieldSettings = {
    fieldColor: lerpHex(fs.fieldColor, fs2.fieldColor, t),
    playerColor: lerpHex(fs.playerColor, fs2.playerColor, t),
    showPlayerLabels: t < 0.5 ? fs.showPlayerLabels : fs2.showPlayerLabels,
    markerType: t < 0.5 ? fs.markerType : fs2.markerType,
    ...(ball && { ball }),
  };

  return { players, fieldSettings, oppositionPlayers };
}

interface UseAnimationOptions {
  onFrame?: (players: Player[], fieldSettings: FieldSettings, oppositionPlayers?: Player[]) => void;
  /**
   * Loop forever instead of stopping at the end. A tactic is a repeating
   * pattern, so this is the default for on-screen playback. Compiled animations
   * open and close on the same pose, which is what makes the wrap seamless.
   */
  loop?: boolean;
}

export function useAnimation(options: UseAnimationOptions = {}) {
  const { loop = true } = options;
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDuration] = useState(5000);
  const [fps, setFps] = useState(24);

  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const onFrameRef = useRef(options.onFrame);
  onFrameRef.current = options.onFrame;

  // rAF playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastTimestampRef.current = null;
      }
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const elapsed = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      setCurrentTimeMs(prev => {
        const next = prev + elapsed;
        if (next < durationMs) return next;
        if (loop) return next % durationMs;
        setIsPlaying(false);
        return durationMs;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, durationMs, loop]);

  // Call onFrame whenever currentTimeMs changes during playback
  useEffect(() => {
    if (!isPlaying || !onFrameRef.current) return;
    const frame = getInterpolatedFrame(currentTimeMs, keyframes);
    if (frame) {
      onFrameRef.current(frame.players, frame.fieldSettings, frame.oppositionPlayers);
    }
  }, [currentTimeMs, isPlaying, keyframes]);

  const addKeyframe = useCallback(
    (players: Player[], fieldSettings: FieldSettings, oppositionPlayers?: Player[], label?: string) => {
      const id = crypto.randomUUID();
      setKeyframes(prev => {
        const filtered = prev.filter(k => Math.abs(k.timeMs - currentTimeMs) > 50);
        return [...filtered, { id, timeMs: currentTimeMs, players, fieldSettings, oppositionPlayers, label }]
          .sort((a, b) => a.timeMs - b.timeMs);
      });
    },
    [currentTimeMs]
  );

  const removeKeyframe = useCallback((id: string) => {
    setKeyframes(prev => prev.filter(k => k.id !== id));
  }, []);

  const updateKeyframeTime = useCallback((id: string, newTimeMs: number) => {
    setKeyframes(prev =>
      prev
        .map(k => k.id === id ? { ...k, timeMs: Math.max(0, Math.min(durationMs, newTimeMs)) } : k)
        .sort((a, b) => a.timeMs - b.timeMs)
    );
  }, [durationMs]);

  const seekTo = useCallback((timeMs: number) => {
    setCurrentTimeMs(Math.max(0, Math.min(durationMs, timeMs)));
  }, [durationMs]);

  const play = useCallback(() => {
    if (currentTimeMs >= durationMs) setCurrentTimeMs(0);
    setIsPlaying(true);
  }, [currentTimeMs, durationMs]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const getAnimation = useCallback((): AnimationData => ({
    durationMs,
    fps,
    keyframes,
  }), [durationMs, fps, keyframes]);

  const loadAnimation = useCallback((data: AnimationData) => {
    setKeyframes(data.keyframes || []);
    if (data.durationMs) setDuration(data.durationMs);
    if (data.fps) setFps(data.fps);
    setCurrentTimeMs(0);
  }, []);

  return {
    keyframes,
    /**
     * Replace the compiled keyframes without disturbing the playhead, so
     * re-compiling after a movement edit doesn't yank playback back to 0.
     */
    setKeyframes,
    currentTimeMs,
    isPlaying,
    durationMs,
    fps,
    addKeyframe,
    removeKeyframe,
    updateKeyframeTime,
    seekTo,
    play,
    pause,
    setDuration,
    setFps,
    getAnimation,
    loadAnimation,
    getInterpolatedFrame: (t: number) => getInterpolatedFrame(t, keyframes),
  };
}
