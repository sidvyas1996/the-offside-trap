import { useCallback, useRef, useState } from "react";
import type { Movement, PassNode, PassSequence } from "../../../../packages/shared/src";
import {
  recognizeMovement, recognizePassLeg, DWELL_MIN_MS, type TimedPt,
} from "../utils/movement-gestures";
import { pitchDistance } from "../utils/pitch";

interface Pt { x: number; y: number }

/** How close a marker must be to the ball to count as standing on it. */
const CARRY_RADIUS = 4;

/**
 * How close a run must finish to a ball played into space to be treated as a run
 * onto it. Generous on purpose: you are aiming at a ghost, not a pixel.
 */
const RENDEZVOUS_RADIUS = 9;

/** Who a leg ended on, resolved by the caller from the drop point. */
export interface PlayerRef { team: 'home' | 'away'; playerId: number }

/**
 * What a drag is recording.
 *
 * A player drag becomes a Movement. A ball drag becomes a leg appended to the
 * passing move — passes are a chain, not a cyclic motion, so they never go
 * through the Movement path.
 */
export type CaptureTarget =
  | { kind: 'movement'; target: Movement['target'] }
  | { kind: 'pass' }
  | { kind: 'dribble'; carrier: PlayerRef };

interface UseMovementCaptureArgs {
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  passes: PassSequence;
  setPasses: React.Dispatch<React.SetStateAction<PassSequence>>;
  /** Where the ball currently is, used before any chain exists. */
  ball: Pt;
  /** Loop length, so a dwell in milliseconds can become a fraction of the loop. */
  durationMs: number;
  /** Resolves a drop point to a player, or null when it landed in space. */
  resolvePlayerAt: (pt: Pt) => PlayerRef | null;
}

/**
 * Records a drag and turns it into a movement or a pass leg on release.
 *
 * Capture is deliberately separate from the drag itself: while you draw, the
 * normal drag keeps the marker under your cursor so you can see the path you are
 * tracing, and on release the object is put back where it started.
 */
export function useMovementCapture({
  movements,
  setMovements,
  passes,
  setPasses,
  ball,
  durationMs,
  resolvePlayerAt,
}: UseMovementCaptureArgs) {
  const samplesRef = useRef<TimedPt[]>([]);
  const captureRef = useRef<CaptureTarget | null>(null);
  const restRef = useRef<Pt | null>(null);
  /** Mirrors samplesRef for rendering the live trail; refs alone won't re-render. */
  const [liveTrail, setLiveTrail] = useState<Pt[]>([]);
  /**
   * Milliseconds held still at the grab point, published so the marker can show
   * a filling ring. A delay you cannot see coming is a bug report, not a feature.
   */
  const [liveDwellMs, setLiveDwellMs] = useState(0);

  const begin = useCallback((capture: CaptureTarget, restingPosition: Pt) => {
    const seed: TimedPt = { ...restingPosition, t: performance.now() };
    captureRef.current = capture;
    restRef.current = restingPosition;
    samplesRef.current = [seed];
    setLiveTrail([restingPosition]);
    setLiveDwellMs(0);
  }, []);

  const sample = useCallback((pt: Pt) => {
    if (!captureRef.current) return;
    // Last line of defence: a single non-finite sample becomes a node the overlay
    // draws at NaN and the compiler can never recover from, so drop it here too.
    if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return;
    const now = performance.now();
    samplesRef.current.push({ ...pt, t: now });
    setLiveTrail(prev => [...prev, pt]);

    // Live dwell: how long the cursor has been sitting on the grab point.
    const first = samplesRef.current[0];
    const stillThere = pitchDistance(pt, first) <= 1.5;
    setLiveDwellMs(stillThere && first.t !== undefined ? now - first.t : 0);
  }, []);

  const sameTarget = (a: Movement['target'], b: Movement['target']) =>
    a.kind === 'ball'
      ? b.kind === 'ball'
      : b.kind === 'player' && a.team === b.team && a.playerId === b.playerId;

  /**
   * Whether a marker is close enough to the ball to pick it up. Dragging such a
   * player carries the ball rather than leaving it behind — the same thing that
   * happens on a pitch, so it needs no separate gesture.
   */
  const isCarrying = useCallback((playerPos: Pt): boolean => {
    // Falls back to the live ball position: before any chain exists there is no
    // nodes[0], and without this a dribble could never be the *first* action.
    const start = passes.nodes.length > 0 ? passes.nodes[0].at : ball;
    return pitchDistance(playerPos, start) <= CARRY_RADIUS;
  }, [passes, ball]);

  /**
   * Finish a capture.
   *
   * Returns what was captured and where it should be put back, or null when the
   * drag was only a nudge — that null is what preserves plain repositioning while
   * Movement mode is on.
   */
  const end = useCallback((): { restore: 'player' | 'ball' | 'none'; target?: Movement['target']; restoreTo: Pt } | null => {
    const capture = captureRef.current;
    const rest = restRef.current;
    const samples = samplesRef.current;

    captureRef.current = null;
    restRef.current = null;
    samplesRef.current = [];
    setLiveTrail([]);
    setLiveDwellMs(0);

    if (!capture || !rest || samples.length < 2) return null;

    // --- Player movement -------------------------------------------------
    if (capture.kind === 'movement') {
      const { movement: recognized } = recognizeMovement(samples, { durationMs });
      if (!recognized) return null;

      // A run that finishes on a ball played into space is a run onto that pass,
      // so link it and let the compiler derive the delay. This is what the ghost
      // ball is *for*: without it you would be guessing a delay until the runner
      // happened to arrive on time.
      const endsAt = recognized.path[recognized.path.length - 1];
      let syncToPassNode: number | undefined;
      let bestDist = RENDEZVOUS_RADIUS;
      passes.nodes.forEach((node, i) => {
        if (i === 0 || node.receiver || node.via === 'dribble') return;
        const d = pitchDistance(endsAt, node.at);
        if (d < bestDist) { bestDist = d; syncToPassNode = i; }
      });

      // One movement per player: drawing again replaces the previous one, so a
      // mistake is fixed by redrawing rather than by hunting for a delete button.
      const next: Movement = {
        id: crypto.randomUUID(),
        target: capture.target,
        ...recognized,
        ...(syncToPassNode !== undefined && { syncToPassNode }),
      };
      setMovements(prev => [...prev.filter(m => !sameTarget(m.target, capture.target)), next]);
      return { restore: 'player', target: capture.target, restoreTo: rest };
    }

    // --- Ball: append a leg to the passing move ---------------------------
    const leg = recognizePassLeg(samples);
    if (!leg) return null;

    const receiver = resolvePlayerAt(leg.to);

    const node: PassNode = {
      // Strip the timestamp: it is drag bookkeeping, not part of the tactic.
      at: { x: leg.to.x, y: leg.to.y },
      via: capture.kind === 'dribble' ? 'dribble' : 'pass',
      ...(leg.bend.length > 0 && { bend: leg.bend }),
      // A dribble's destination is reached by the carrier, so it is theirs by
      // definition; a pass only has a receiver if it actually found one.
      ...(capture.kind === 'dribble'
        ? { carrier: capture.carrier }
        : receiver && { receiver }),
      ...(leg.holdAfterMs > 0 && { holdMs: leg.holdAfterMs }),
      ...(leg.travelMs > 0 && { travelMs: leg.travelMs }),
    };

    setPasses(prev => {
      // The first leg has to establish where the ball starts. Recording whoever
      // is standing there makes the chain read as "starts at GK" rather than
      // leaving the opening node anonymous.
      const startAt = { x: rest.x, y: rest.y };
      const startHolder = resolvePlayerAt(startAt);
      const nodes = prev.nodes.length === 0
        ? [{ at: startAt, ...(startHolder && { receiver: startHolder }) }, node]
        : [...prev.nodes, node];

      // A pause before playing it belongs to the node the ball was sitting on —
      // that is what "held the ball, then passed" looks like in the data.
      if (leg.holdBeforeMs > 0) {
        const originIdx = nodes.length - 2;
        nodes[originIdx] = {
          ...nodes[originIdx],
          holdMs: (nodes[originIdx].holdMs ?? 0) + leg.holdBeforeMs,
        };
      }
      return { ...prev, nodes };
    });

    // A dribble moves its carrier, so the ball is what returns to the chain's
    // start; the player stays wherever the carry left them.
    return { restore: 'ball', restoreTo: passes.nodes[0]?.at ?? rest };
  }, [durationMs, resolvePlayerAt, setMovements, setPasses, passes]);

  // `ball` participates in isCarrying only; end() deliberately reads the chain.

  const cancel = useCallback(() => {
    captureRef.current = null;
    restRef.current = null;
    samplesRef.current = [];
    setLiveTrail([]);
    setLiveDwellMs(0);
  }, []);

  return {
    begin,
    sample,
    end,
    cancel,
    isCarrying,
    isCapturing: () => captureRef.current !== null,
    liveTrail,
    /** Only meaningful past the threshold; below it there is nothing to show. */
    liveDwellMs: liveDwellMs >= DWELL_MIN_MS ? liveDwellMs : 0,
    movements,
    passes,
  };
}
