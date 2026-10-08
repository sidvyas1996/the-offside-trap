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

/**
 * How long a looping animation rests on its final pose before replaying.
 *
 * Without a pause the move restarts the instant it lands, so it reads as one
 * endless shuffle rather than a pattern you can watch, take in and watch again.
 */
export const LOOP_DELAY_MS = 5000;

interface UseAnimationOptions {
  onFrame?: (players: Player[], fieldSettings: FieldSettings, oppositionPlayers?: Player[]) => void;
  /**
   * Initial playback mode: repeat (with a {@link LOOP_DELAY_MS} rest between
   * runs) or play once and stop on the final pose. Changeable later via
   * `setLoop`. Arrow animations end on the move's final pose rather than
   * rewinding, so a loop rests there and then cuts back to the start.
   */
  loop?: boolean;
  /**
   * Rest on the final pose between loops. Defaults to {@link LOOP_DELAY_MS},
   * which suits watching a tactic; an editor passes 0 so iterating on a move
   * isn't a wait.
   */
  loopDelayMs?: number;
}

export function useAnimation(options: UseAnimationOptions = {}) {
  const loopDelayMs = Math.max(0, options.loopDelayMs ?? LOOP_DELAY_MS);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [currentTimeMs, setCurrentTimeMsState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDuration] = useState(5000);
  const [fps, setFps] = useState(24);
  const [loop, setLoop] = useState(options.loop ?? true);
  /** Time left in the rest between loops; 0 while the animation is running. */
  const [loopDelayRemainingMs, setLoopDelayRemainingMs] = useState(0);

  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const onFrameRef = useRef(options.onFrame);
  onFrameRef.current = options.onFrame;
  // The playhead and the rest are read and advanced inside the rAF tick, so they
  // live in refs; state mirrors them for rendering. Advancing via a setState
  // updater instead would run side effects (stopping, starting the rest) inside
  // it, which StrictMode invokes twice.
  const timeRef = useRef(0);
  const delayRef = useRef(0);
  const keyframesRef = useRef(keyframes);
  keyframesRef.current = keyframes;

  const setCurrentTimeMs = useCallback((t: number) => {
    timeRef.current = t;
    setCurrentTimeMsState(t);
  }, []);

  const clearLoopDelay = useCallback(() => {
    delayRef.current = 0;
    setLoopDelayRemainingMs(0);
  }, []);

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

      if (delayRef.current > 0) {
        // Resting on the final pose between loops.
        delayRef.current = Math.max(0, delayRef.current - elapsed);
        setLoopDelayRemainingMs(delayRef.current);
        if (delayRef.current === 0) setCurrentTimeMs(0);
      } else {
        const next = timeRef.current + elapsed;
        if (next < durationMs) {
          setCurrentTimeMs(next);
        } else {
          // Land exactly on the final pose rather than wrapping past it, so the
          // rest (or the stop) shows where the move actually finishes. Pushed
          // here directly: when playback stops on this same tick, the onFrame
          // effect below never sees it, and the board would freeze a frame short.
          setCurrentTimeMs(durationMs);
          const last = getInterpolatedFrame(durationMs, keyframesRef.current);
          if (last) onFrameRef.current?.(last.players, last.fieldSettings, last.oppositionPlayers);
          if (loop && loopDelayMs > 0) {
            delayRef.current = loopDelayMs;
            setLoopDelayRemainingMs(loopDelayMs);
          } else if (loop) {
            setCurrentTimeMs(0);
          } else {
            setIsPlaying(false);
            return;
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, durationMs, loop, loopDelayMs, setCurrentTimeMs]);

  // Switching to play-once mid-rest has nothing left to wait for.
  useEffect(() => {
    if (!loop && delayRef.current > 0) {
      clearLoopDelay();
      setIsPlaying(false);
    }
  }, [loop, clearLoopDelay]);

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
    clearLoopDelay();
    setCurrentTimeMs(Math.max(0, Math.min(durationMs, timeMs)));
  }, [durationMs, clearLoopDelay, setCurrentTimeMs]);

  const play = useCallback(() => {
    if (timeRef.current >= durationMs) setCurrentTimeMs(0);
    setIsPlaying(true);
  }, [durationMs, setCurrentTimeMs]);

  // A pause during the rest drops it: the playhead is at the end, so the next
  // play starts the move over rather than sitting out the remainder.
  const pause = useCallback(() => {
    clearLoopDelay();
    setIsPlaying(false);
  }, [clearLoopDelay]);

  const getAnimation = useCallback((): AnimationData => ({
    durationMs,
    fps,
    keyframes,
    loop,
  }), [durationMs, fps, keyframes, loop]);

  /**
   * Deliberately leaves `loop` alone: presets and recompiles load through here
   * too and always carry `loop: true`, which would undo the viewer's choice.
   * Pages hydrating a saved tactic call `setLoop` themselves.
   */
  const loadAnimation = useCallback((data: AnimationData) => {
    setKeyframes(data.keyframes || []);
    if (data.durationMs) setDuration(data.durationMs);
    if (data.fps) setFps(data.fps);
    clearLoopDelay();
    setCurrentTimeMs(0);
  }, [clearLoopDelay, setCurrentTimeMs]);

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
    /** Repeat (resting `loopDelayMs` between runs) or play once. */
    loop,
    loopDelayMs,
    setLoop,
    /** Countdown to the next run while resting between loops; 0 otherwise. */
    loopDelayRemainingMs,
    getAnimation,
    loadAnimation,
    getInterpolatedFrame: (t: number) => getInterpolatedFrame(t, keyframes),
  };
}
