import { useCallback, useRef, useState } from "react";
import type { Movement } from "../../../../packages/shared/src";
import { recognizeMovement } from "../utils/movement-gestures";

interface Pt { x: number; y: number }

interface UseMovementCaptureArgs {
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
}

/**
 * Records a drag and turns it into a Movement on release.
 *
 * Capture is deliberately separate from the drag itself: while you draw, the
 * normal drag keeps the marker under your cursor (so you can see the path you
 * are tracing), and on release the object is put back where it started and the
 * shape becomes a movement. `restTo` is what the caller uses to do that restore.
 */
export function useMovementCapture({ movements, setMovements }: UseMovementCaptureArgs) {
  const samplesRef = useRef<Pt[]>([]);
  const targetRef = useRef<Movement['target'] | null>(null);
  const restRef = useRef<Pt | null>(null);
  /** Mirrors samplesRef for rendering the live trail; refs alone won't re-render. */
  const [liveTrail, setLiveTrail] = useState<Pt[]>([]);

  const begin = useCallback((target: Movement['target'], restingPosition: Pt) => {
    targetRef.current = target;
    restRef.current = restingPosition;
    samplesRef.current = [restingPosition];
    setLiveTrail([restingPosition]);
  }, []);

  const sample = useCallback((pt: Pt) => {
    if (!targetRef.current) return;
    samplesRef.current.push(pt);
    setLiveTrail(prev => [...prev, pt]);
  }, []);

  const sameTarget = (a: Movement['target'], b: Movement['target']) =>
    a.kind === 'ball'
      ? b.kind === 'ball'
      : b.kind === 'player' && a.team === b.team && a.playerId === b.playerId;

  /**
   * Finish a capture.
   *
   * Returns the captured target and its resting position when the drag was long
   * enough to become a movement, so the caller can snap that object back — and
   * null when it was just a nudge, leaving the object where it was dropped. That
   * null is what preserves plain repositioning while Movement mode is on.
   *
   * Reporting the target back (rather than letting the caller consult its drag
   * state) keeps the restore honest: the thing that moves back is exactly the
   * thing whose gesture we recorded.
   */
  const end = useCallback((): { target: Movement['target']; restoreTo: Pt } | null => {
    const target = targetRef.current;
    const rest = restRef.current;
    const samples = samplesRef.current;

    targetRef.current = null;
    restRef.current = null;
    samplesRef.current = [];
    setLiveTrail([]);

    if (!target || !rest || samples.length < 2) return null;

    const { movement: recognized } = recognizeMovement(samples);
    if (!recognized) return null;

    // One movement per object: drawing again replaces the previous one, which
    // keeps the panel readable and means a mistake is fixed by redrawing.
    const next: Movement = { id: crypto.randomUUID(), target, ...recognized };
    setMovements(prev => [...prev.filter(m => !sameTarget(m.target, target)), next]);

    return { target, restoreTo: rest };
  }, [setMovements]);

  const cancel = useCallback(() => {
    targetRef.current = null;
    restRef.current = null;
    samplesRef.current = [];
    setLiveTrail([]);
  }, []);

  return {
    begin,
    sample,
    end,
    cancel,
    isCapturing: () => targetRef.current !== null,
    liveTrail,
    movements,
  };
}
