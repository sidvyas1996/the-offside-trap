import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCw } from "lucide-react";
import { useFootballField } from "../contexts/FootballFieldContext.tsx";
import PlayerMarker from "./PlayerMarker.tsx";
import BallMarker from "./BallMarker.tsx";
import ArrowOverlay, { BALL_ARROW_TYPES } from "./ArrowOverlay.tsx";
import {
  DEFAULT_FOOTBALL_FIELD_COLOUR,
  CHARCOAL_GRAY,
} from "../utils/colors.ts";
import {
  PITCH_LENGTH,
  PITCH_WIDTH,
  PITCH_MARGIN,
  PITCH_CENTRE_X,
  PITCH_CENTRE_Y,
  PITCH_INNER_LENGTH,
  PITCH_ASPECT,
  PITCH_VIEWBOX,
  PITCH_X_SCALE,
  PITCH_STRIPE_PCT,
  PITCH_PORTRAIT_ASPECT,
  PITCH_PORTRAIT_STRIPE_COUNT,
  PITCH_MARKINGS,
  LANDSCAPE,
  PORTRAIT,
  projectMarking,
  arcPath,
  clientToPitchPct,
  pitchDistance,
  PITCH_ORIENTATION_ATTR,
} from "../utils/pitch.ts";
import MovementOverlay from "./MovementOverlay";
import { useMovementCapture, type PlayerRef } from "../hooks/useMovementCapture";

import type { Player, TacticArrow, Movement } from "../../../../packages/shared";

interface FootballFieldProps {
  editable?: boolean;
  /**
   * Draw the board rotated a quarter turn, pitch length running up the screen.
   *
   * Render-time only: stored coordinates are untouched, so the same tactic is
   * the same data either way (see packages/shared/src/pitch-view.ts). Defaults
   * to false, which is what keeps the headless export routes on the landscape
   * board without them having to opt out.
   */
  portrait?: boolean;
  /**
   * Size the board from the height it is given rather than the width.
   *
   * A portrait board is ~1.78x taller than it is wide, so on a phone the
   * width-driven default overflows the viewport as soon as a header and a dock
   * take their share. Here the container owns the height and the board takes
   * whatever width its aspect ratio allows.
   */
  fitHeight?: boolean;
  size?: "default" | "fullscreen";
  waypointsMode?: boolean;
  horizontalZonesMode?: boolean;
  verticalSpacesMode?: boolean;
  isFullScreen?: boolean;
  fieldOfViewMode?: boolean;
  onPlayerSelect?: (player: Player) => void;
}

const FootballField: React.FC<FootballFieldProps> = ({
  editable,
  size,
  waypointsMode = false,
  horizontalZonesMode = false,
  verticalSpacesMode = false,
  isFullScreen = false,
  portrait = false,
  fitHeight = false,
  fieldOfViewMode = false,
  onPlayerSelect,
}) => {
  const {
    players, setPlayers, draggedPlayer, options, actions, fieldRef,
    oppositionPlayers, setOppositionPlayers, draggedOppositionPlayer, oppositionOptions, oppositionActions, showOpposition,
    ball, setBall, isAnimating,
    movements, setMovements, passes, setPasses, loopDurationMs, movementMode, showBeats,
    arrows, setArrows, arrowTool, arrowBallColor, arrowRunColor,
    currentBeat, showAllBeats, previewingPhase,
  } = useFootballField();

  // One object decides which way up everything below draws, so the orientation
  // is chosen once rather than branched on at every coordinate. Declared before
  // the callbacks because several of them close over it *and* list it as a
  // dependency, which is evaluated during render.
  const projection = portrait ? PORTRAIT : LANDSCAPE;

  /**
   * Player markers run 10% larger on the phone board.
   *
   * The portrait board is far narrower than the desktop one, so a marker that
   * reads comfortably at 900px is a small target under a thumb. Deliberately
   * scoped to players on the portrait board: the ball keeps the shared scale so
   * it stays the smaller object, and the desktop studio and the export frame are
   * both untouched.
   */
  const MOBILE_MARKER_BOOST = 1.1;

  /**
   * Which player a point landed on, or null for empty space. A pass that finds
   * nobody is a ball played into space, which is the whole basis of the ghost.
   */
  const resolvePlayerAt = useCallback((pt: { x: number; y: number }): PlayerRef | null => {
    const RECEIVE_RADIUS = 5;
    let best: PlayerRef | null = null;
    let bestDist = RECEIVE_RADIUS;
    for (const p of players) {
      const d = pitchDistance(p, pt);
      if (d < bestDist) { bestDist = d; best = { team: 'home', playerId: p.id }; }
    }
    if (showOpposition) {
      for (const p of oppositionPlayers) {
        const d = pitchDistance(p, pt);
        if (d < bestDist) { bestDist = d; best = { team: 'away', playerId: p.id }; }
      }
    }
    return best;
  }, [players, oppositionPlayers, showOpposition]);

  const capture = useMovementCapture({
    movements, setMovements, passes, setPasses, ball,
    durationMs: loopDurationMs,
    resolvePlayerAt,
  });

  /**
   * Start recording, but only in movement mode — otherwise dragging behaves
   * exactly as it always has.
   *
   * A player who is standing on the ball carries it: dragging them records a
   * dribble leg rather than a run. That needs no separate gesture because it is
   * what actually happens on a pitch.
   */
  const beginCapture = useCallback((
    target: Movement['target'],
    rest: { x: number; y: number },
  ) => {
    if (!movementMode) return;
    if (target.kind === 'player' && capture.isCarrying(rest)) {
      capture.begin({ kind: 'dribble', carrier: { team: target.team, playerId: target.playerId } }, rest);
    } else if (target.kind === 'ball') {
      capture.begin({ kind: 'pass' }, rest);
    } else {
      capture.begin({ kind: 'movement', target }, rest);
    }
  }, [movementMode, capture]);

  const handleCaptureMove = useCallback((e: React.PointerEvent) => {
    if (!capture.isCapturing() || !fieldRef.current) return;
    const pt = clientToPitchPct(fieldRef.current, e.clientX, e.clientY, projection);
    if (pt) capture.sample(pt);
  }, [capture, fieldRef, projection]);

  /**
   * Continue the passing move from where it ended.
   *
   * Needed because the ball rests at the start of the chain, so there is no way
   * to carry on from the last node by dragging the ball itself — which is what
   * limited a tactic to a single ball action.
   */
  const handleExtendPass = useCallback((from: { x: number; y: number }) => {
    capture.begin({ kind: 'pass' }, from);
  }, [capture]);

  // On release the drawn object goes back to where it started — the movement or
  // pass leg it just became is what carries it away from there during playback.
  const handleCaptureEnd = useCallback(() => {
    const result = capture.end();
    if (!result) return;
    const { restore, target, restoreTo } = result;

    if (restore === 'ball') {
      setBall(restoreTo);
      return;
    }
    if (restore === 'player' && target?.kind === 'player') {
      const patch = (roster: Player[]) =>
        roster.map(p => p.id === target.playerId ? { ...p, ...restoreTo } : p);
      if (target.team === 'home') setPlayers(patch);
      else setOppositionPlayers(patch);
    }
  }, [capture, setPlayers, setOppositionPlayers, setBall]);

  const { onUpdatePlayer, onPlayerNameChange } = actions;

  const [scale, setScale] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    playerId: number | null;
  }>({ visible: false, x: 0, y: 0, playerId: null });
  const [waypoints, setWaypoints] = useState<
    Array<{ from: number; to: number }>
  >([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  // Per-player FOV rotation angle (degrees). Default 0 = pointing right.
  const [fovAngles, setFovAngles] = useState<Record<number, number>>({});
  const [hoveredPlayerId, setHoveredPlayerId] = useState<number | null>(null);
  const [rotatingPlayerId, setRotatingPlayerId] = useState<number | null>(null);
  // Refs so document listeners always see latest values without re-subscribing
  const rotatingPlayerIdRef = useRef<number | null>(null);
  const playersRef = useRef<any[]>(players);
  useEffect(() => { playersRef.current = players; });

  // Ball drag state
  const [isDraggingBall, setIsDraggingBall] = useState(false);

  // Same viewport→field mapping as usePlayerDrag: invert the live CSS
  // transform so dragging works when the field is 3D-tilted in fullscreen
  const handleBallPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingBall || !fieldRef.current) return;
    const pt = clientToPitchPct(fieldRef.current, e.clientX, e.clientY, projection);
    if (pt) setBall(pt);
  }, [isDraggingBall, fieldRef, setBall, projection]);

  // Arrow drawing state
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [drawingCurrent, setDrawingCurrent] = useState<{ x: number; y: number } | null>(null);
  // ID of the player the cursor is snapping to (for visual feedback)
  const [arrowSnapId, setArrowSnapId] = useState<number | null>(null);

  /**
   * Arrow drawing's cursor mapping.
   *
   * Was a hand-rolled getBoundingClientRect copy, which is exactly the drift
   * `clientToPitchPct` warns about: it ignored the board's CSS transform, so
   * arrows landed off-cursor on the 3D-tilted fullscreen board, and it would
   * have needed its own portrait handling. Delegating means one mapping, and
   * both problems go away at once. Centre is the fallback for an unlaid-out
   * board, as before.
   */
  const toFieldPct = useCallback((clientX: number, clientY: number) => {
    if (!fieldRef.current) return { x: 50, y: 50 };
    return clientToPitchPct(fieldRef.current, clientX, clientY, projection) ?? { x: 50, y: 50 };
  }, [fieldRef, projection]);

  // Find the nearest player within a snap threshold (8 percentage units, aspect-ratio corrected)
  const findNearestPlayer = useCallback((pt: { x: number; y: number }) => {
    const all = showOpposition ? [...players, ...oppositionPlayers] : [...players];
    const THRESHOLD = 8;
    let nearest: Player | null = null;
    let minDist = THRESHOLD;
    for (const p of all) {
      // Scale x by the pitch aspect ratio so the snap radius is circular on screen
      const dx = (p.x - pt.x) * PITCH_X_SCALE;
      const dy = p.y - pt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; nearest = p; }
    }
    return nearest;
  }, [players, oppositionPlayers, showOpposition]);

  const handleArrowPointerDown = useCallback((e: React.PointerEvent) => {
    if (!arrowTool) return;
    e.preventDefault();
    const pt = toFieldPct(e.clientX, e.clientY);
    const nearest = findNearestPlayer(pt);
    if (!nearest) return; // must originate from a player
    const snapPt = { x: nearest.x, y: nearest.y };
    const color = BALL_ARROW_TYPES.includes(arrowTool) ? arrowBallColor : arrowRunColor;
    if (arrowTool === 'target-zone') {
      // A target marker never moves anything, so it carries no beat.
      setArrows(prev => [...prev, { id: crypto.randomUUID(), type: arrowTool, points: [snapPt], color }]);
    } else {
      setDrawingStart(snapPt);
      setDrawingCurrent(snapPt);
    }
  }, [arrowTool, arrowBallColor, arrowRunColor, toFieldPct, findNearestPlayer, setArrows]);

  const handleArrowPointerMove = useCallback((e: React.PointerEvent) => {
    const pt = toFieldPct(e.clientX, e.clientY);
    if (drawingStart) {
      setDrawingCurrent(pt);
    } else {
      // Track which player the cursor is nearest to for snap indicator
      const nearest = findNearestPlayer(pt);
      setArrowSnapId(nearest ? nearest.id : null);
    }
  }, [drawingStart, toFieldPct, findNearestPlayer]);

  const handleArrowPointerUp = useCallback((e: React.PointerEvent) => {
    if (!arrowTool || !drawingStart) return;
    const end = toFieldPct(e.clientX, e.clientY);
    const dx = end.x - drawingStart.x;
    const dy = end.y - drawingStart.y;
    if (Math.sqrt(dx * dx + dy * dy) > 2) {
      const isBall = BALL_ARROW_TYPES.includes(arrowTool);
      const color = isBall ? arrowBallColor : arrowRunColor;
      const endPlayer = isBall ? findNearestPlayer(end) : null;
      // Bind who the arrow runs from and to at draw time. Resolving by position
      // later would orphan the arrow the moment its player is repositioned, and
      // the ref is what lets the run re-anchor to where they actually are.
      const fromRef = resolvePlayerAt(drawingStart);
      const toRef = resolvePlayerAt(end);
      setArrows(prev => [...prev, {
        id: crypto.randomUUID(),
        type: arrowTool,
        points: [drawingStart, end],
        color,
        // The beat you are on is the beat you are drawing into. Without this every
        // arrow would land on beat 1 and Step would have nothing to show for itself.
        beat: currentBeat,
        ...(isBall && endPlayer ? { endsAtPlayer: true } : {}),
        ...(fromRef && { from: fromRef }),
        ...(toRef && { to: toRef }),
      }]);
    }
    setDrawingStart(null);
    setDrawingCurrent(null);
  }, [arrowTool, drawingStart, arrowBallColor, arrowRunColor, currentBeat, toFieldPct, findNearestPlayer, resolvePlayerAt, setArrows]);

  const handleArrowOverlayLeave = useCallback(() => {
    setDrawingStart(null);
    setDrawingCurrent(null);
    setArrowSnapId(null);
  }, []);

  const handleDeleteArrow = useCallback((id: string) => {
    setArrows(prev => prev.filter(a => a.id !== id));
  }, [setArrows]);

  const previewArrow: TacticArrow | null =
    arrowTool && arrowTool !== 'target-zone' && drawingStart && drawingCurrent
      ? { id: 'preview', type: arrowTool, points: [drawingStart, drawingCurrent],
          color: BALL_ARROW_TYPES.includes(arrowTool) ? arrowBallColor : arrowRunColor }
      : null;

  // Snap indicator: position of the player being snapped to
  const snapPlayer = arrowTool && !drawingStart
    ? (players.find(p => p.id === arrowSnapId) || (showOpposition ? oppositionPlayers.find(p => p.id === arrowSnapId) : null))
    : null;

  // Drag-to-rotate: angle = atan2(mouse - playerCenter)
  useEffect(() => {
    if (rotatingPlayerId === null) return;
    rotatingPlayerIdRef.current = rotatingPlayerId;

    const onMove = (e: PointerEvent) => {
      const pid = rotatingPlayerIdRef.current;
      if (pid === null || !fieldRef.current) return;
      const player = playersRef.current.find((p: any) => p.id === pid);
      if (!player) return;
      const rect = fieldRef.current.getBoundingClientRect();
      // Screen position, so the projected point — a portrait board puts the
      // player somewhere the stored coords alone would not predict.
      const at = projection.toPct(player);
      const cx = (at.x / 100) * rect.width + rect.left;
      const cy = (at.y / 100) * rect.height + rect.top;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      setFovAngles(prev => ({ ...prev, [pid]: (angle + 360) % 360 }));
    };

    const onUp = () => {
      setRotatingPlayerId(null);
      rotatingPlayerIdRef.current = null;
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [rotatingPlayerId, projection]);

  // Context menu clamping and close-on-click
  const onShowContextMenu = (playerId: number, x: number, y: number) => {
    setContextMenu({
      visible: true,
      x: Math.min(x, window.innerWidth - 180),
      y: Math.min(y, window.innerHeight - 120),
      playerId,
    });
  };

  useEffect(() => {
    if (!contextMenu.visible) return;
    const closeMenu = () => setContextMenu((cm) => ({ ...cm, visible: false }));
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [contextMenu.visible]);

  // Observe field size
  useEffect(() => {
    if (!fieldRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Scale off the axis the pitch's *length* runs along, not off the
        // element's width. The two are the same thing in landscape, but on the
        // portrait board width is the pitch's short side, and dividing by it
        // would shrink every marker by the 622:350 ratio for no reason.
        const pitchLengthPx = portrait ? entry.contentRect.height : entry.contentRect.width;
        // Markers scale with the board, so this divisor sets how much room the
        // pitch has in marker-widths. It was tuned up alongside the longer 16:9
        // pitch: the extra length only buys space to manoeuvre (notably with a
        // full opposition team) if markers shrink relative to the surface.
        const newScale = Math.max(0.7, Math.min(1.5, pitchLengthPx / 1150));
        setScale(newScale);
      }
    });
    observer.observe(fieldRef.current);
    return () => observer.disconnect();
  }, [fieldRef, portrait]);

  const handlePlayerAction = (action: string) => {
    if (!contextMenu.playerId || !onUpdatePlayer) return;

    // Find the current player to check their current status
    const currentPlayer = players.find((p) => p.id === contextMenu.playerId);
    if (!currentPlayer) return;

    const updates =
      action === "captain"
        ? { isCaptain: !currentPlayer.isCaptain }
        : action === "yellow"
          ? { hasYellowCard: !currentPlayer.hasYellowCard }
          : action === "red"
            ? { hasRedCard: !currentPlayer.hasRedCard }
            : action === "key"
              ? { isStarPlayer: !currentPlayer.isStarPlayer }
              : {};
    onUpdatePlayer(contextMenu.playerId, updates);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleWaypointsClick = (playerId: number) => {
    if (!waypointsMode) return;

    if (selectedPlayer === null) {
      setSelectedPlayer(playerId);
    } else if (selectedPlayer === playerId) {
      setSelectedPlayer(null);
    } else {
      // Create waypoint connection
      const newWaypoint = { from: selectedPlayer, to: playerId };
      setWaypoints((prev) => [...prev, newWaypoint]);
      setSelectedPlayer(null);
    }
  };

  const handleRemoveLine = (lineIndex: number) => {
    setWaypoints((prev) => prev.filter((_, index) => index !== lineIndex));
  };

  // Responsive field sizing
  const fieldColor = options.fieldColor || DEFAULT_FOOTBALL_FIELD_COLOUR;
  // Subtle alternating stripe — slightly lighter than base color
  const stripeColor = 'rgba(255,255,255,0.04)';
  // Stripes are mown along the pitch's *length*, so the gradient angle follows
  // the projection rather than being pinned to the screen's horizontal.
  const stripePct = portrait ? 100 / PITCH_PORTRAIT_STRIPE_COUNT : PITCH_STRIPE_PCT;
  const stripeAngle = portrait ? '0deg' : '90deg';
  const pitchBackground = `repeating-linear-gradient(
    ${stripeAngle},
    transparent 0%,
    transparent ${stripePct}%,
    ${stripeColor} ${stripePct}%,
    ${stripeColor} ${stripePct * 2}%
  ), ${fieldColor}`;

  const wideStage = size === "fullscreen" || options.size === "fullscreen" || isFullScreen;

  /**
   * Which dimension drives the board.
   *
   * Exactly one dimension is ever set; the other falls out of `aspect-ratio`.
   * That is not a style preference — markers are positioned in percentages of
   * this element while the markings are an SVG that letterboxes inside it, so
   * the moment the box stops matching 350:622 the two disagree and every marker
   * drifts off the pitch it is supposed to sit on.
   *
   * Setting height *and* max-width (the obvious way to fit a portrait board into
   * a bounded stage) does exactly that: max-width clamps the width, the explicit
   * height stays, and the ratio is silently violated. So width always drives,
   * and `fitHeight` only means "no desktop width cap — take the stage".
   */
  /**
   * Contain-fit for the phone stage: as wide as the container allows, but never
   * wider than its *height* permits at this aspect ratio.
   *
   * `cqh` is the container's height, which is the one thing plain CSS cannot
   * otherwise reference from a width. Without it there is no way to honour both
   * axes at once: width-driven overflows a short stage, height-driven overflows
   * a narrow one, and setting both dimensions is what broke the ratio before.
   * Requires `container-type: size` on the wrapper — see TacticalField.
   */
  const containWidth = `min(100%, calc(100cqh * ${portrait ? PITCH_WIDTH : PITCH_LENGTH} / ${portrait ? PITCH_LENGTH : PITCH_WIDTH}))`;

  const sizeStyle = fitHeight
    ? { width: containWidth, height: "auto", margin: "0 auto" }
    : wideStage
      ? { width: "100%", maxWidth: "100%", height: "auto", margin: "0 auto" }
      : { width: "100%", maxWidth: "900px", margin: "0 auto" };

  const fieldStyle = {
    background: pitchBackground,
    aspectRatio: portrait ? PITCH_PORTRAIT_ASPECT : PITCH_ASPECT,
    ...sizeStyle,
    // The portrait board carries the full neo-brutalist chrome the mobile design
    // draws: ink border, 20px radius and a hard offset shadow. Landscape is left
    // as it was so the desktop studio and the export frame are untouched.
    ...(portrait
      ? {
          border: 'var(--border-w) solid var(--ink)',
          borderRadius: 20,
          boxShadow: 'var(--card-shadow)',
        }
      : {}),
  };

  /**
   * Release every drag this board owns.
   *
   * Bound to pointerup, pointerleave and pointercancel. Leave is what the mouse
   * build already used, and it is kept so behaviour is unchanged there. Cancel
   * is the new one that matters on touch: the OS can revoke a pointer mid-drag
   * (a system edge gesture, an incoming call), and without it `isDraggingBall`
   * would stay true and a half-captured movement would never be committed.
   *
   * Deliberately *not* using setPointerCapture on this container — capture
   * retargets every subsequent pointer event to the capturing element, which
   * would starve the arrow overlay's own pointer handlers one layer down.
   */
  const endAllDrags = useCallback(() => {
    actions.onPointerUp?.();
    oppositionActions.onPointerUp?.();
    setIsDraggingBall(false);
    handleCaptureEnd();
  }, [actions, oppositionActions, handleCaptureEnd]);

  return (
    <div
      ref={fieldRef}
      // Read back by clientToPitchPct so every pointer mapping — including the
      // ones in hooks that never see this component — un-rotates correctly.
      {...{ [PITCH_ORIENTATION_ATTR]: String(projection.portrait) }}
      className={`relative rounded-xl overflow-hidden cursor-move ${isFullScreen ? '' : 'mb-6'}`}
      style={{ ...fieldStyle, touchAction: 'none' }}
      onPointerMove={(e) => { actions.onPointerMove?.(e); oppositionActions.onPointerMove?.(e); handleBallPointerMove(e); handleCaptureMove(e); }}
      onPointerUp={endAllDrags}
      onPointerLeave={endAllDrags}
      onPointerCancel={endAllDrags}
    >
      {/* Field Markings — drawn from the shared PITCH_MARKINGS data rather than
          inline JSX, so the landscape and portrait boards cannot drift apart and
          the lines can be tested without rendering a component. */}
      <svg
        className="absolute inset-0 w-full h-full opacity-55"
        viewBox={projection.viewBox}
      >
        {PITCH_MARKINGS.map((marking, i) => {
          const m = projectMarking(marking, projection.portrait);
          const stroke = { stroke: "white", strokeWidth: 2.5, fill: "none" } as const;
          switch (m.kind) {
            case "rect":
              return <rect key={i} x={m.x} y={m.y} width={m.w} height={m.h} {...stroke} />;
            case "line":
              return <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="white" strokeWidth={2.5} />;
            case "circle":
              return <circle key={i} cx={m.cx} cy={m.cy} r={m.r} {...stroke} />;
            case "dot":
              return <circle key={i} cx={m.cx} cy={m.cy} r={m.r} fill="white" />;
            case "arc":
              return <path key={i} d={arcPath(m)} {...stroke} />;
          }
        })}

        {/* Tactical Overlay */}
        {horizontalZonesMode && (
          <g>
            {/* Defensive Third - Left penalty box area */}
            <rect
              x={PITCH_MARGIN}
              y={PITCH_MARGIN}
              width={PITCH_INNER_LENGTH / 4}
              height={PITCH_WIDTH - PITCH_MARGIN * 2}
              fill="rgba(255, 255, 255, 0.1)"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              strokeDasharray="5.5"
            />
            <text
              x={PITCH_MARGIN + PITCH_INNER_LENGTH / 8}
              y={PITCH_WIDTH - 10}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              Defensive third
            </text>

            {/* Middle Third - Center area between penalty boxes */}
            <rect
              x={PITCH_MARGIN + PITCH_INNER_LENGTH / 4}
              y={PITCH_MARGIN}
              width={PITCH_INNER_LENGTH / 2}
              height={PITCH_WIDTH - PITCH_MARGIN * 2}
              fill="rgba(255, 255, 255, 0.1)"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              strokeDasharray="5.5"
            />
            <text
              x={PITCH_CENTRE_X}
              y={PITCH_WIDTH - 10}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              Middle third
            </text>

            {/* Final Third - Right penalty box area */}
            <rect
              x={PITCH_LENGTH - PITCH_MARGIN - PITCH_INNER_LENGTH / 4}
              y={PITCH_MARGIN}
              width={PITCH_INNER_LENGTH / 4}
              height={PITCH_WIDTH - PITCH_MARGIN * 2}
              fill="rgba(255, 255, 255, 0.1)"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              strokeDasharray="5.5"
            />
            <text
              x={PITCH_LENGTH - PITCH_MARGIN - PITCH_INNER_LENGTH / 8}
              y={PITCH_WIDTH - 10}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              Final third
            </text>
          </g>
        )}

        {verticalSpacesMode && (
          <g>
            {/* Wide Area Top - Outside penalty box */}
            <rect
              x={PITCH_MARGIN}
              y={PITCH_MARGIN}
              width={PITCH_INNER_LENGTH}
              height="70"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x={PITCH_CENTRE_X}
              y="43.25"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              Wide Space
            </text>

              {/*Half Space Top*/}
            <rect
              x={PITCH_MARGIN}
              y="90"
              width={PITCH_INNER_LENGTH}
              height="45"
              fill="rgba(255, 255, 255, 0.2)"
            />
            <text
              x={PITCH_CENTRE_X}
              y="115"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              Half Space
            </text>

            {/* Center - Center circle area */}
            <rect
              x={PITCH_MARGIN}
              y="135"
              width={PITCH_INNER_LENGTH}
              height="80"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="2"
              strokeDasharray="5.5"
            />
            <text
              x={PITCH_CENTRE_X}
              y={PITCH_CENTRE_Y}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              Centre
            </text>

            {/*/!* Half-space Bottom - Inside penalty box *!/*/}
            <rect
              x={PITCH_MARGIN} y="215" width={PITCH_INNER_LENGTH} height="45"
              fill="rgba(255, 255, 255, 0.2)"
            />
            <text x={PITCH_CENTRE_X} y="245" textAnchor="middle" fill="white" fontSize="12" dominantBaseline="middle" fontWeight="bold">Half Space</text>

            {/* Wide Area Bottom - Outside penalty box */}
            <rect
              x={PITCH_MARGIN}
              y="260"
              width={PITCH_INNER_LENGTH}
              height="70"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x={PITCH_CENTRE_X}
              y="306.75"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              Wide Space
            </text>
          </g>
        )}
      </svg>

      {/* Waypoints Lines */}
      {waypointsMode &&
        waypoints.map((waypoint, index) => {
          const fromPlayer = players.find((p) => p.id === waypoint.from);
          const toPlayer = players.find((p) => p.id === waypoint.to);

          if (!fromPlayer || !toPlayer) return null;

          // Determine waypoint line color based on field color
          const isDarkField = options.fieldColor === "#222";
          const waypointColor = isDarkField ? "#16A34A" : "#d7d7d7";
          const waypointShadowColor = isDarkField
            ? "rgba(22, 163, 74, 0.5)"
            : "rgba(255, 255, 255, 0.5)";

          return (
            <svg
              key={index}
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: 5 }}
            >
              <line
                x1={`${fromPlayer.x}%`}
                y1={`${fromPlayer.y}%`}
                x2={`${toPlayer.x}%`}
                y2={`${toPlayer.y}%`}
                stroke={waypointColor}
                strokeWidth="4"
                strokeDasharray="8,8"
                strokeDashoffset="0"
                opacity="0.9"
                className="cursor-pointer hover:stroke-green-300 transition-colors"
                style={{
                  filter: `drop-shadow(0 0 4px ${waypointShadowColor})`,
                }}
                onContextMenu={(e) => {
                  if (waypointsMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveLine(index);
                  }
                }}
              />
            </svg>
          );
        })}

      {/* Field of View — 120° sector per player with per-player rotation */}
      {fieldOfViewMode && (
        <>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={PITCH_VIEWBOX}
            style={{ pointerEvents: "none" }}
          >
            <defs>
              <radialGradient id="fovGradient" cx="0" cy="0" r="45" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#ffff80" stopOpacity="0.45" />
                <stop offset="70%"  stopColor="#ffff80" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ffff80" stopOpacity="0" />
              </radialGradient>
            </defs>
            {players.map((player: any) => {
              const px = projection.toX(player);
              const py = projection.toY(player);
              const r = 45;
              const angle = fovAngles[player.id] ?? 0;
              const sx = r * 0.5;
              const sy = r * 0.866;
              const d = `M 0 0 L ${sx} ${-sy} A ${r} ${r} 0 0 1 ${sx} ${sy} Z`;
              return (
                <g key={player.id} transform={`translate(${px}, ${py}) rotate(${angle})`}>
                  <path d={d} fill="url(#fovGradient)" />
                </g>
              );
            })}
          </svg>

          {/* Rotate handles — appear only when hovering over a player */}
          {players.map((player: any) => {
            if (hoveredPlayerId !== player.id) return null;
            return (
              <button
                key={player.id}
                onPointerDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRotatingPlayerId(player.id);
                  rotatingPlayerIdRef.current = player.id;
                }}
                onMouseEnter={() => setHoveredPlayerId(player.id)}
                onMouseLeave={() => setHoveredPlayerId(null)}
                title="Drag to rotate player's field of view"
                style={{
                  position: "absolute",
                  left: `calc(${projection.toPct(player).x}% + 22px)`,
                  top: `calc(${projection.toPct(player).y}% - 22px)`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 30,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(255,255,80,0.92)",
                  border: "1.5px solid rgba(120,120,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: rotatingPlayerId === player.id ? "grabbing" : "grab",
                  padding: 0,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              >
                <RotateCw size={12} color="#444400" />
              </button>
            );
          })}
        </>
      )}

      {/* Home team players */}
      {players.map((player: any) => (
        <PlayerMarker
          key={player.id}
          player={player}
          pos={projection.toPct(player)}
          scale={portrait ? scale * MOBILE_MARKER_BOOST : scale}
          isDragged={draggedPlayer?.id === player.id}
          isAnimating={isAnimating}
          dwellMs={draggedPlayer?.id === player.id ? capture.liveDwellMs : 0}
          onPointerDown={() => {
            // While a later beat is on screen the positions are a computed preview,
            // so a drag has nowhere legitimate to land: committing it would write a
            // mid-move pose back into the tactic's starting board.
            if (previewingPhase) return;
            actions.onPointerDown?.(player);
            beginCapture({ kind: 'player', team: 'home', playerId: player.id }, { x: player.x, y: player.y });
          }}
          editable={typeof editable === "boolean" ? editable : options.editable}
          onNameChange={onPlayerNameChange}
          onPositionChange={
            actions.onUpdatePlayer
              ? (id, position) => actions.onUpdatePlayer!(id, { position })
              : undefined
          }
          onContextMenu={(e) => {
            e.preventDefault();
            onShowContextMenu(player.id, e.clientX, e.clientY);
          }}
          enableContextMenu={options.enableContextMenu}
          showPlayerLabels={options.showPlayerLabels}
          markerType={options.markerType}
          waypointsMode={waypointsMode}
          isSelected={selectedPlayer === player.id}
          onWaypointsClick={() => handleWaypointsClick(player.id)}
          fovAngle={fieldOfViewMode ? (fovAngles[player.id] ?? 0) : undefined}
          onMouseEnter={fieldOfViewMode ? () => setHoveredPlayerId(player.id) : undefined}
          onMouseLeave={fieldOfViewMode ? () => setHoveredPlayerId(null) : undefined}
          markerBgColor={options.markerBgColor}
          markerBorderColor={options.markerBorderColor}
          markerTextColor={options.markerTextColor}
          markerSecondaryColor={options.markerSecondaryColor}
          markerDesign={options.markerDesign}
          shirtTextureUrl={options.shirtTextureUrl}
          shirtKitId={options.shirtKitId}
          showShirtNumbers={options.showShirtNumbers}
          onPlayerSelect={onPlayerSelect}
        />
      ))}

      {/* Opposition team players */}
      {showOpposition && oppositionPlayers.map((player: any) => (
        <PlayerMarker
          key={`opp-${player.id}`}
          player={player}
          pos={projection.toPct(player)}
          scale={portrait ? scale * MOBILE_MARKER_BOOST : scale}
          isDragged={draggedOppositionPlayer?.id === player.id}
          isAnimating={isAnimating}
          dwellMs={draggedOppositionPlayer?.id === player.id ? capture.liveDwellMs : 0}
          onPointerDown={() => {
            if (previewingPhase) return;
            oppositionActions.onPointerDown?.(player);
            beginCapture({ kind: 'player', team: 'away', playerId: player.id }, { x: player.x, y: player.y });
          }}
          editable={typeof editable === "boolean" ? editable : oppositionOptions.editable}
          onNameChange={oppositionActions.onPlayerNameChange}
          onPositionChange={
            oppositionActions.onUpdatePlayer
              ? (id, position) => oppositionActions.onUpdatePlayer!(id, { position })
              : undefined
          }
          onContextMenu={(e) => {
            e.preventDefault();
            onShowContextMenu(player.id, e.clientX, e.clientY);
          }}
          enableContextMenu={oppositionOptions.enableContextMenu}
          showPlayerLabels={oppositionOptions.showPlayerLabels}
          markerType={oppositionOptions.markerType}
          waypointsMode={false}
          isSelected={false}
          markerBgColor={oppositionOptions.markerBgColor}
          markerBorderColor={oppositionOptions.markerBorderColor}
          markerTextColor={oppositionOptions.markerTextColor}
          markerSecondaryColor={oppositionOptions.markerSecondaryColor}
          markerDesign={oppositionOptions.markerDesign}
          shirtTextureUrl={oppositionOptions.shirtTextureUrl}
          shirtKitId={oppositionOptions.shirtKitId}
          showShirtNumbers={oppositionOptions.showShirtNumbers}
        />
      ))}

      {/* Ball marker */}
      <BallMarker
        ball={ball}
        pos={projection.toPct(ball)}
        scale={scale}
        isDragged={isDraggingBall}
        isAnimating={isAnimating}
        editable={typeof editable === "boolean" ? editable : options.editable}
        onPointerDown={() => {
          if (previewingPhase) return;
          setIsDraggingBall(true);
          beginCapture({ kind: 'ball' }, { x: ball.x, y: ball.y });
        }}
      />

      {/* Movement paths — hidden during playback, where the markers say it better.
          The ghost ball lives here too, which is what keeps it an authoring aid
          and leaves the export path untouched. */}
      <MovementOverlay
        movements={movements}
        passes={passes}
        liveTrail={capture.liveTrail}
        visible={!isAnimating}
        onExtendFrom={movementMode ? handleExtendPass : undefined}
        projection={projection}
      />

      {/* Arrow annotations */}
      <ArrowOverlay
        arrows={arrows}
        onDeleteArrow={handleDeleteArrow}
        previewArrow={previewArrow}
        showBeats={showBeats && !isAnimating}
        // Ghost the beats you are not authoring, so the board shows what happens
        // *now* without throwing away the context of what led here.
        activeBeat={showBeats && !isAnimating && !showAllBeats ? currentBeat : undefined}
        projection={projection}
      />

      {/* Arrow drawing overlay — transparent full-field capture layer */}
      {arrowTool && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 45, cursor: 'crosshair' }}
          onPointerDown={handleArrowPointerDown}
          onPointerMove={handleArrowPointerMove}
          onPointerUp={handleArrowPointerUp}
          onPointerLeave={handleArrowOverlayLeave}
        />
      )}

      {/* Snap indicator ring — shown above overlay, pointer-events none */}
      {snapPlayer && (
        <div
          style={{
            position: 'absolute',
            left: `${projection.toPct(snapPlayer).x}%`,
            top: `${projection.toPct(snapPlayer).y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 46,
            pointerEvents: 'none',
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `2px solid ${BALL_ARROW_TYPES.includes(arrowTool!) ? '#fbbf24' : '#60a5fa'}`,
            boxShadow: `0 0 8px ${BALL_ARROW_TYPES.includes(arrowTool!) ? '#fbbf2488' : '#60a5fa88'}`,
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="absolute rounded-2xl text-white shadow-lg z-50 opacity-70"
          style={{
            position: "fixed",
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            backgroundColor: CHARCOAL_GRAY,
          }}
        >
          <ul className="p-2 space-y-2 w-44">
            {(() => {
              const currentPlayer = players.find(
                (p) => p.id === contextMenu.playerId,
              );
              if (!currentPlayer) return [];

              // Check if there's already a captain assigned
              const hasCaptain = players.some((p) => p.isCaptain);
              const isCurrentPlayerCaptain = currentPlayer.isCaptain;

              const menuItems = [
                {
                  action: "captain",
                  label: currentPlayer.isCaptain
                    ? "Unassign Captain"
                    : "Assign as Captain",
                  disabled: !isCurrentPlayerCaptain && hasCaptain,
                },
                {
                  action: "yellow",
                  label: currentPlayer.hasYellowCard
                    ? "Unassign Yellow Card"
                    : "Assign Yellow Card",
                },
                {
                  action: "red",
                  label: currentPlayer.hasRedCard
                    ? "Unassign Red Card"
                    : "Assign Red Card",
                },
                {
                  action: "key",
                  label: currentPlayer.isStarPlayer
                    ? "Unmark as Star Player"
                    : "Mark as Star Player",
                },
              ];

              return menuItems.map(({ action, label, disabled }) => (
                <li
                  key={action}
                  className={`px-3 py-1 rounded ${
                    disabled
                      ? "text-gray-500 cursor-not-allowed"
                      : "cursor-pointer hover:bg-gray-700"
                  }`}
                  onClick={() => !disabled && handlePlayerAction(action)}
                >
                  {label}
                </li>
              ));
            })()}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FootballField;
