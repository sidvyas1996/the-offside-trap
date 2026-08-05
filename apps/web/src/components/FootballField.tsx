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
  pctToSvgX,
  pctToSvgY,
  clientToPitchPct,
} from "../utils/pitch.ts";
import MovementOverlay from "./MovementOverlay";
import { useMovementCapture } from "../hooks/useMovementCapture";

import type { Player, TacticArrow, Movement } from "../../../../packages/shared";

interface FootballFieldProps {
  editable?: boolean;
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
  fieldOfViewMode = false,
  onPlayerSelect,
}) => {
  const {
    players, setPlayers, draggedPlayer, options, actions, fieldRef,
    oppositionPlayers, setOppositionPlayers, draggedOppositionPlayer, oppositionOptions, oppositionActions, showOpposition,
    ball, setBall, isAnimating,
    movements, setMovements, movementMode,
    arrows, setArrows, arrowTool, arrowBallColor, arrowRunColor,
  } = useFootballField();

  const capture = useMovementCapture({ movements, setMovements });

  // Begin a capture only in movement mode; otherwise dragging behaves exactly as
  // it always has. `rest` is the object's position before the drag, which becomes
  // path[0] and the place it returns to on release.
  const beginCapture = useCallback((target: Movement['target'], rest: { x: number; y: number }) => {
    if (movementMode) capture.begin(target, rest);
  }, [movementMode, capture]);

  const handleCaptureMove = useCallback((e: React.MouseEvent) => {
    if (!capture.isCapturing() || !fieldRef.current) return;
    const pt = clientToPitchPct(fieldRef.current, e.clientX, e.clientY);
    if (pt) capture.sample(pt);
  }, [capture, fieldRef]);

  // On release the drawn object goes back to where it started — the movement it
  // just became is what carries it away from there during playback.
  const handleCaptureEnd = useCallback(() => {
    const result = capture.end();
    if (!result) return;
    const { target, restoreTo } = result;
    if (target.kind === 'ball') {
      setBall(restoreTo);
    } else if (target.team === 'home') {
      setPlayers(prev => prev.map(p => p.id === target.playerId ? { ...p, ...restoreTo } : p));
    } else {
      setOppositionPlayers(prev => prev.map(p => p.id === target.playerId ? { ...p, ...restoreTo } : p));
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
  const handleBallMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingBall || !fieldRef.current) return;
    const pt = clientToPitchPct(fieldRef.current, e.clientX, e.clientY);
    if (pt) setBall(pt);
  }, [isDraggingBall, fieldRef, setBall]);

  // Arrow drawing state
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [drawingCurrent, setDrawingCurrent] = useState<{ x: number; y: number } | null>(null);
  // ID of the player the cursor is snapping to (for visual feedback)
  const [arrowSnapId, setArrowSnapId] = useState<number | null>(null);

  const toFieldPct = useCallback((clientX: number, clientY: number) => {
    if (!fieldRef.current) return { x: 50, y: 50 };
    const rect = fieldRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, [fieldRef]);

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

  const handleArrowMouseDown = useCallback((e: React.MouseEvent) => {
    if (!arrowTool) return;
    e.preventDefault();
    const pt = toFieldPct(e.clientX, e.clientY);
    const nearest = findNearestPlayer(pt);
    if (!nearest) return; // must originate from a player
    const snapPt = { x: nearest.x, y: nearest.y };
    const color = BALL_ARROW_TYPES.includes(arrowTool) ? arrowBallColor : arrowRunColor;
    if (arrowTool === 'target-zone') {
      setArrows(prev => [...prev, { id: crypto.randomUUID(), type: arrowTool, points: [snapPt], color }]);
    } else {
      setDrawingStart(snapPt);
      setDrawingCurrent(snapPt);
    }
  }, [arrowTool, arrowBallColor, arrowRunColor, toFieldPct, findNearestPlayer, setArrows]);

  const handleArrowMouseMove = useCallback((e: React.MouseEvent) => {
    const pt = toFieldPct(e.clientX, e.clientY);
    if (drawingStart) {
      setDrawingCurrent(pt);
    } else {
      // Track which player the cursor is nearest to for snap indicator
      const nearest = findNearestPlayer(pt);
      setArrowSnapId(nearest ? nearest.id : null);
    }
  }, [drawingStart, toFieldPct, findNearestPlayer]);

  const handleArrowMouseUp = useCallback((e: React.MouseEvent) => {
    if (!arrowTool || !drawingStart) return;
    const end = toFieldPct(e.clientX, e.clientY);
    const dx = end.x - drawingStart.x;
    const dy = end.y - drawingStart.y;
    if (Math.sqrt(dx * dx + dy * dy) > 2) {
      const isBall = BALL_ARROW_TYPES.includes(arrowTool);
      const color = isBall ? arrowBallColor : arrowRunColor;
      const endPlayer = isBall ? findNearestPlayer(end) : null;
      setArrows(prev => [...prev, {
        id: crypto.randomUUID(),
        type: arrowTool,
        points: [drawingStart, end],
        color,
        ...(isBall && endPlayer ? { endsAtPlayer: true } : {}),
      }]);
    }
    setDrawingStart(null);
    setDrawingCurrent(null);
  }, [arrowTool, drawingStart, arrowBallColor, arrowRunColor, toFieldPct, findNearestPlayer, setArrows]);

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

    const onMove = (e: MouseEvent) => {
      const pid = rotatingPlayerIdRef.current;
      if (pid === null || !fieldRef.current) return;
      const player = playersRef.current.find((p: any) => p.id === pid);
      if (!player) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const cx = (player.x / 100) * rect.width + rect.left;
      const cy = (player.y / 100) * rect.height + rect.top;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      setFovAngles(prev => ({ ...prev, [pid]: (angle + 360) % 360 }));
    };

    const onUp = () => {
      setRotatingPlayerId(null);
      rotatingPlayerIdRef.current = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [rotatingPlayerId]);

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
        const fieldWidth = entry.contentRect.width;
        // Markers scale with the board, so this divisor sets how much room the
        // pitch has in marker-widths. It was tuned up alongside the longer 16:9
        // pitch: the extra length only buys space to manoeuvre (notably with a
        // full opposition team) if markers shrink relative to the surface.
        const newScale = Math.max(0.7, Math.min(1.5, fieldWidth / 1150));
        setScale(newScale);
      }
    });
    observer.observe(fieldRef.current);
    return () => observer.disconnect();
  }, [fieldRef]);

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
  const pitchBackground = `repeating-linear-gradient(
    90deg,
    transparent 0%,
    transparent ${PITCH_STRIPE_PCT}%,
    ${stripeColor} ${PITCH_STRIPE_PCT}%,
    ${stripeColor} ${PITCH_STRIPE_PCT * 2}%
  ), ${fieldColor}`;

  const fieldStyle =
    size === "fullscreen" || options.size === "fullscreen" || isFullScreen
      ? {
          background: pitchBackground,
          aspectRatio: PITCH_ASPECT,
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          margin: "0 auto",
        }
      : {
          background: pitchBackground,
          aspectRatio: PITCH_ASPECT,
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
        };

  return (
    <div
      ref={fieldRef}
      className={`relative rounded-xl overflow-hidden cursor-move ${isFullScreen ? '' : 'mb-6'}`}
      style={fieldStyle}
      onMouseMove={(e) => { actions.onMouseMove?.(e); oppositionActions.onMouseMove?.(e); handleBallMouseMove(e); handleCaptureMove(e); }}
      onMouseUp={() => { actions.onMouseUp?.(); oppositionActions.onMouseUp?.(); setIsDraggingBall(false); handleCaptureEnd(); }}
      onMouseLeave={() => { actions.onMouseUp?.(); oppositionActions.onMouseUp?.(); setIsDraggingBall(false); handleCaptureEnd(); }}
    >
      {/* Field Markings */}
      <svg
        className="absolute inset-0 w-full h-full opacity-55"
        viewBox={PITCH_VIEWBOX}
      >
        <rect
          x={PITCH_MARGIN}
          y={PITCH_MARGIN}
          width={PITCH_INNER_LENGTH}
          height={PITCH_WIDTH - PITCH_MARGIN * 2}
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <line
          x1={PITCH_CENTRE_X}
          y1={PITCH_MARGIN}
          x2={PITCH_CENTRE_X}
          y2={PITCH_WIDTH - PITCH_MARGIN}
          stroke="white"
          strokeWidth="2.5"
        />
        <circle
          cx={PITCH_CENTRE_X}
          cy={PITCH_CENTRE_Y}
          r="40"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx={PITCH_CENTRE_X} cy={PITCH_CENTRE_Y} r="3" fill="white" />

        {/* Goal and Box Markings — fixed real-world sizes, independent of pitch length */}
        <rect
          x={PITCH_MARGIN}
          y="90"
          width="70"
          height="170"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x={PITCH_LENGTH - PITCH_MARGIN - 70}
          y="90"
          width="70"
          height="170"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x={PITCH_MARGIN}
          y="135"
          width="30"
          height="80"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x={PITCH_LENGTH - PITCH_MARGIN - 30}
          y="135"
          width="30"
          height="80"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx={PITCH_MARGIN + 45} cy={PITCH_CENTRE_Y} r="3" fill="white" />
        <circle cx={PITCH_LENGTH - PITCH_MARGIN - 45} cy={PITCH_CENTRE_Y} r="3" fill="white" />

        {/* Penalty Arcs */}
        <path
          d={`M ${PITCH_MARGIN + 70} 155 A 30 30 0 0 1 ${PITCH_MARGIN + 70} 195`}
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d={`M ${PITCH_LENGTH - PITCH_MARGIN - 70} 155 A 30 30 0 0 0 ${PITCH_LENGTH - PITCH_MARGIN - 70} 195`}
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Corner Arcs */}
        <path
          d={`M ${PITCH_MARGIN} ${PITCH_MARGIN + 10} A 10 10 0 0 0 ${PITCH_MARGIN + 10} ${PITCH_MARGIN}`}
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d={`M ${PITCH_LENGTH - PITCH_MARGIN - 10} ${PITCH_MARGIN} A 10 10 0 0 0 ${PITCH_LENGTH - PITCH_MARGIN} ${PITCH_MARGIN + 10}`}
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d={`M ${PITCH_MARGIN + 10} ${PITCH_WIDTH - PITCH_MARGIN} A 10 10 0 0 0 ${PITCH_MARGIN} ${PITCH_WIDTH - PITCH_MARGIN - 10}`}
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d={`M ${PITCH_LENGTH - PITCH_MARGIN} ${PITCH_WIDTH - PITCH_MARGIN - 10} A 10 10 0 0 0 ${PITCH_LENGTH - PITCH_MARGIN - 10} ${PITCH_WIDTH - PITCH_MARGIN}`}
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />

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
              const px = pctToSvgX(player.x);
              const py = pctToSvgY(player.y);
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
                onMouseDown={e => {
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
                  left: `calc(${player.x}% + 22px)`,
                  top: `calc(${player.y}% - 22px)`,
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
          scale={scale}
          isDragged={draggedPlayer?.id === player.id}
          isAnimating={isAnimating}
          onMouseDown={() => {
            actions.onMouseDown?.(player);
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
          onPlayerSelect={onPlayerSelect}
        />
      ))}

      {/* Opposition team players */}
      {showOpposition && oppositionPlayers.map((player: any) => (
        <PlayerMarker
          key={`opp-${player.id}`}
          player={player}
          scale={scale}
          isDragged={draggedOppositionPlayer?.id === player.id}
          isAnimating={isAnimating}
          onMouseDown={() => {
            oppositionActions.onMouseDown?.(player);
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
        />
      ))}

      {/* Ball marker */}
      <BallMarker
        ball={ball}
        scale={scale}
        isDragged={isDraggingBall}
        isAnimating={isAnimating}
        editable={typeof editable === "boolean" ? editable : options.editable}
        onMouseDown={() => {
          setIsDraggingBall(true);
          beginCapture({ kind: 'ball' }, { x: ball.x, y: ball.y });
        }}
      />

      {/* Movement paths — hidden during playback, where the markers say it better */}
      <MovementOverlay
        movements={movements}
        liveTrail={capture.liveTrail}
        visible={!isAnimating}
      />

      {/* Arrow annotations */}
      <ArrowOverlay
        arrows={arrows}
        onDeleteArrow={handleDeleteArrow}
        previewArrow={previewArrow}
      />

      {/* Arrow drawing overlay — transparent full-field capture layer */}
      {arrowTool && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 45, cursor: 'crosshair' }}
          onMouseDown={handleArrowMouseDown}
          onMouseMove={handleArrowMouseMove}
          onMouseUp={handleArrowMouseUp}
          onMouseLeave={handleArrowOverlayLeave}
        />
      )}

      {/* Snap indicator ring — shown above overlay, pointer-events none */}
      {snapPlayer && (
        <div
          style={{
            position: 'absolute',
            left: `${snapPlayer.x}%`,
            top: `${snapPlayer.y}%`,
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
