import { useEffect, useRef, useState } from "react";

export interface CameraPose {
  rotation: number;
  tilt: number;
  zoom: number;
}

const DURATION_MS = 260;

/** Solves `cubic-bezier(x1, y1, x2, y2)` for progress `t`, as CSS does. */
const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const bez = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 * s + 3 * b * (1 - s) * s ** 2 + s ** 3;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Bisection on x(s) = t; x is monotonic for control points in [0, 1].
    let lo = 0;
    let hi = 1;
    let s = t;
    for (let i = 0; i < 24; i++) {
      s = (lo + hi) / 2;
      if (bez(x1, x2, s) < t) lo = s;
      else hi = s;
    }
    return bez(y1, y2, s);
  };
};

const ease = cubicBezier(0.22, 1, 0.36, 1);

/**
 * The camera pose, eased toward `target` one frame at a time.
 *
 * The board and the marker overlay must both be drawn from this one value.
 * Left to CSS, the board's transform and the markers' left/top each ran their
 * own transition: the board swings points along arcs while a left/top ease
 * moves them in straight lines, so the team visibly trailed the turf whenever
 * the camera moved. Tweening the pose itself keeps every frame of the two
 * layers on the same camera.
 *
 * Rotation takes the short way round, so crossing 0° on the dial is a small
 * turn rather than a full spin. The first pose is applied without easing.
 * `moving` is true while a tween is in flight.
 */
export function useCameraTween(target: CameraPose): CameraPose & { moving: boolean } {
  const [pose, setPose] = useState(target);
  const [moving, setMoving] = useState(false);
  const poseRef = useRef(target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const from = poseRef.current;
    const turn = ((((target.rotation - from.rotation) % 360) + 540) % 360) - 180;
    const to = { rotation: from.rotation + turn, tilt: target.tilt, zoom: target.zoom };
    if (turn === 0 && to.tilt === from.tilt && to.zoom === from.zoom) {
      setMoving(false);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const k = ease(Math.min((now - start) / DURATION_MS, 1));
      const next = {
        rotation: from.rotation + (to.rotation - from.rotation) * k,
        tilt: from.tilt + (to.tilt - from.tilt) * k,
        zoom: from.zoom + (to.zoom - from.zoom) * k,
      };
      poseRef.current = next;
      setPose(next);
      frame.current = k < 1 ? requestAnimationFrame(step) : null;
      if (k >= 1) setMoving(false);
    };
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(step);
    setMoving(true);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [target.rotation, target.tilt, target.zoom]);

  return { ...pose, moving };
}
