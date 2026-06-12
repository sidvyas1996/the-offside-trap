import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCw } from "lucide-react";
import { useFootballField } from "../contexts/FootballFieldContext.tsx";
import PlayerMarker from "./PlayerMarker.tsx";
import ArrowOverlay, { BALL_ARROW_TYPES } from "./ArrowOverlay.tsx";
import {
  DEFAULT_FOOTBALL_FIELD_COLOUR,
  CHARCOAL_GRAY,
} from "../utils/colors.ts";

import type { Player, TacticArrow } from "../../../../packages/shared";

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
    players, draggedPlayer, options, actions, fieldRef,
    oppositionPlayers, draggedOppositionPlayer, oppositionOptions, oppositionActions, showOpposition,
    arrows, setArrows, arrowTool, arrowBallColor, arrowRunColor,
  } = useFootballField();

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
      // Scale x by 7/11 to account for 11:7 field aspect ratio
      const dx = (p.x - pt.x) * (7 / 11);
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
        const newScale = Math.max(0.8, Math.min(1.5, fieldWidth / 1000));
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
    transparent 9.09%,
    ${stripeColor} 9.09%,
    ${stripeColor} 18.18%
  ), ${fieldColor}`;

  const fieldStyle =
    size === "fullscreen" || options.size === "fullscreen" || isFullScreen
      ? {
          background: pitchBackground,
          aspectRatio: "11/7",
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          margin: "0 auto",
        }
      : {
          background: pitchBackground,
          aspectRatio: "11/7",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        };

  return (
    <div
      ref={fieldRef}
      className={`relative rounded-xl overflow-hidden cursor-move ${isFullScreen ? '' : 'mb-6'}`}
      style={fieldStyle}
      onMouseMove={(e) => { actions.onMouseMove?.(e); oppositionActions.onMouseMove?.(e); }}
      onMouseUp={() => { actions.onMouseUp?.(); oppositionActions.onMouseUp?.(); }}
      onMouseLeave={() => { actions.onMouseUp?.(); oppositionActions.onMouseUp?.(); }}
    >
      {/* Field Markings */}
      <svg
        className="absolute inset-0 w-full h-full opacity-55"
        viewBox="0 0 550 350"
      >
        <rect
          x="20"
          y="20"
          width="510"
          height="310"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <line
          x1="275"
          y1="20"
          x2="275"
          y2="330"
          stroke="white"
          strokeWidth="2.5"
        />
        <circle
          cx="275"
          cy="175"
          r="40"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="275" cy="175" r="3" fill="white" />

        {/* Goal and Box Markings */}
        <rect
          x="20"
          y="90"
          width="70"
          height="170"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x="460"
          y="90"
          width="70"
          height="170"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x="20"
          y="135"
          width="30"
          height="80"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x="500"
          y="135"
          width="30"
          height="80"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="65" cy="175" r="3" fill="white" />
        <circle cx="485" cy="175" r="3" fill="white" />

        {/* Penalty Arcs */}
        <path
          d="M 90 155 A 30 30 0 0 1 90 195"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 460 155 A 30 30 0 0 0 460 195"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Corner Arcs */}
        <path
          d="M 20 30 A 10 10 0 0 0 30 20"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 520 20 A 10 10 0 0 0 530 30"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 30 330 A 10 10 0 0 0 20 320"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 530 320 A 10 10 0 0 0 520 330"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Tactical Overlay */}
        {horizontalZonesMode && (
          <g>
            {/* Defensive Third - Left penalty box area */}
            <rect
              x="20"
              y="20"
              width="127.5"
              height="310"
              fill="rgba(255, 255, 255, 0.1)"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              strokeDasharray="5.5"
            />
            <text
              x="93.75"
              y="340"
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
              x="147.5"
              y="20"
              width="255"
              height="310"
              fill="rgba(255, 255, 255, 0.1)"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              strokeDasharray="5.5"
            />
            <text
              x="275"
              y="340"
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
              x="402.5"
              y="20"
              width="127.5"
              height="310"
              fill="rgba(255, 255, 255, 0.1)"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="2"
              strokeDasharray="5.5"
            />
            <text
              x="466.25"
              y="340"
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
              x="20"
              y="20"
              width="510"
              height="70"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x="278"
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
              x="20"
              y="90"
              width="510"
              height="45"
              fill="rgba(255, 255, 255, 0.2)"
            />
            <text
              x="281"
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
              x="20"
              y="135"
              width="510"
              height="80"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="2"
              strokeDasharray="5.5"
            />
            <text
              x="275"
              y="175"
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
              x="20" y="215" width="510" height="45"
              fill="rgba(255, 255, 255, 0.2)"
            />
            <text x="281" y="245" textAnchor="middle" fill="white" fontSize="12" dominantBaseline="middle" fontWeight="bold">Half Space</text>

            {/* Wide Area Bottom - Outside penalty box */}
            <rect
              x="20"
              y="260"
              width="510"
              height="70"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x="278"
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
            viewBox="0 0 550 350"
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
              const px = player.x * 5.5;
              const py = player.y * 3.5;
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
          onMouseDown={() => actions.onMouseDown && actions.onMouseDown(player)}
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
          onMouseDown={() => oppositionActions.onMouseDown && oppositionActions.onMouseDown(player)}
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
