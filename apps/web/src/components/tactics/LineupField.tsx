import React, { useState, useEffect, useRef } from "react";
import { useFootballField } from "../../contexts/FootballFieldContext.tsx";
import PlayerMarker from "../PlayerMarker.tsx";
import {
  DEFAULT_FOOTBALL_FIELD_COLOUR,
  normalizeFieldColor,
} from "../../utils/colors.ts";

interface LineupFieldProps {
  portrait?: boolean;
  waypointsMode: boolean;
  horizontalZonesMode: boolean;
  verticalSpacesMode: boolean;
  onChangeFieldColor?: (color: string) => void;
  onChangePlayerColor?: (color: string) => void;
  markerBgColor?: string;
  markerBorderColor?: string;
  markerTextColor?: string;
  markerSecondaryColor?: string;
  markerDesign?: import('../../contexts/FootballFieldContext').MarkerDesign;
  onChangeMarkerBgColor?: (color: string) => void;
  onChangeMarkerBorderColor?: (color: string) => void;
  onChangeMarkerTextColor?: (color: string) => void;
  onChangeMarkerSecondaryColor?: (color: string) => void;
  onChangeMarkerDesign?: (design: import('../../contexts/FootballFieldContext').MarkerDesign) => void;
  onTogglePlayerLabels?: () => void;
  showPlayerLabels?: boolean;
  onToggleMarkerType?: () => void;
  markerType?: 'circle' | 'shirt';
  onToggleWaypoints?: () => void;
  onToggleHorizontalZones?: () => void;
  onToggleVerticalSpaces?: () => void;
  rotationAngle?: number;
  tiltAngle?: number;
  onRotationChange?: (angle: number) => void;
  onTiltChange?: (angle: number) => void;
  zoomLevel?: number;
  onZoomChange?: (level: number) => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onTiltUp?: () => void;
  onTiltDown?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onPlayerSelect?: (player: import('../../../../../packages/shared').Player) => void;
}

const LineupField: React.FC<LineupFieldProps> = ({
  portrait = false,
  waypointsMode,
  horizontalZonesMode,
  verticalSpacesMode,
  showPlayerLabels = true,
  markerType = 'circle',
  rotationAngle: propRotationAngle,
  tiltAngle: propTiltAngle,
  zoomLevel: propZoomLevel,
  onPlayerSelect,
}) => {
  const { players, draggedPlayer, options, actions, fieldRef } =
    useFootballField();

  const { onUpdatePlayer, onPlayerNameChange } = actions;

  const [scale, setScale] = useState(1);
  // The stage frames both the camera and the 2D marker layer laid over it.
  // Drags are listened for here so a pointer over a marker still reaches them.
  const stageRef = useRef<HTMLDivElement>(null);
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

  // Field rotation and tilt state - use props if provided, otherwise use local state
  const [localRotationAngle, setLocalRotationAngle] = useState(0);
  const [localTiltAngle, setLocalTiltAngle] = useState(28);
  const rotationAngle = propRotationAngle !== undefined ? propRotationAngle : localRotationAngle;
  const tiltAngle = propTiltAngle !== undefined ? propTiltAngle : localTiltAngle;
  // Zoom state: 1.0 = default (100%), 0.5 = zoomed out (50%), 1.2 = zoomed in (120%)
  // Default can zoom out to 0.5, then from 0.5 can zoom in to 1.0, then to 1.2
  const [localZoomLevel, setLocalZoomLevel] = useState(0.9);
  const zoomLevel = propZoomLevel !== undefined ? propZoomLevel : localZoomLevel;

  // Function to calculate and update context menu position
  const updateContextMenuPosition = (playerId: number) => {
    if (!fieldRef.current || !contextMenu.visible || contextMenu.playerId !== playerId) return;

    // Find the marker wrapper by data attribute
    const markerWrapper = stageRef.current?.querySelector(`[data-player-id="${playerId}"]`) as HTMLElement | null;
    if (!markerWrapper) return;

    const markerRect = markerWrapper.getBoundingClientRect();
    const fieldRect = fieldRef.current.getBoundingClientRect();

    // Calculate the center of the marker wrapper in viewport coordinates
    const markerCenterX = markerRect.left + markerRect.width / 2;
    const markerCenterY = markerRect.top + markerRect.height / 2;

    // Convert to container-relative coordinates
    const relativeX = markerCenterX - fieldRect.left;
    const relativeY = markerCenterY - fieldRect.top;

    // Position menu to the bottom right of the marker
    const menuOffsetX = 79; // Offset to the right of the marker
    const menuOffsetY = 40; // Offset below the marker
    const menuX = relativeX + menuOffsetX;
    const menuY = relativeY + menuOffsetY;

    setContextMenu((prev) => ({
      ...prev,
      x: Math.min(menuX, fieldRect.width - 180),
      y: Math.min(menuY, fieldRect.height - 160),
    }));
  };

  // Context menu clamping and close-on-click
  const onShowContextMenu = (e: React.MouseEvent, player: { id: number; x: number; y: number }) => {
    if (!fieldRef.current) return;

    // Get the wrapper div that contains the PlayerMarker (parent of currentTarget)
    const markerWrapper = (e.currentTarget as HTMLElement).parentElement;
    if (!markerWrapper) return;

    const markerRect = markerWrapper.getBoundingClientRect();
    const fieldRect = fieldRef.current.getBoundingClientRect();

    // Calculate the center of the marker wrapper in viewport coordinates
    const markerCenterX = markerRect.left + markerRect.width / 2;
    const markerCenterY = markerRect.top + markerRect.height / 2;

    // Convert to container-relative coordinates
    const relativeX = markerCenterX - fieldRect.left;
    const relativeY = markerCenterY - fieldRect.top;

    // Position menu to the bottom right of the marker
    const menuOffsetX = 79;
    const menuOffsetY = 40;
    const menuX = relativeX + menuOffsetX;
    const menuY = relativeY + menuOffsetY;

    setContextMenu({
      visible: true,
      x: Math.min(menuX, fieldRect.width - 180),
      y: Math.min(menuY, fieldRect.height - 160),
      playerId: player.id,
    });
  };

  // Update context menu position when rotation, tilt, or zoom changes
  useEffect(() => {
    if (contextMenu.visible && contextMenu.playerId !== null) {
      // Use requestAnimationFrame to ensure DOM has updated after transform changes
      requestAnimationFrame(() => {
        updateContextMenuPosition(contextMenu.playerId!);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotationAngle, tiltAngle, zoomLevel, contextMenu.visible, contextMenu.playerId]);

  useEffect(() => {
    if (!contextMenu.visible) return;
    const closeMenu = () => setContextMenu((cm) => ({ ...cm, visible: false }));
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [contextMenu.visible]);

  // Observe field size to scale the markers with the board and to keep the
  // projection centred (see `projectionDrop`).
  const [boardBox, setBoardBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!fieldRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setScale(Math.max(0.8, Math.min(1.5, width / 1000)));
        setBoardBox({ w: width, h: height });
      }
    });
    observer.observe(fieldRef.current);
    return () => observer.disconnect();
  }, [fieldRef]);

  /**
   * How far below its own centre the board ends up once projected.
   *
   * Perspective does not fall symmetrically about the axis a tilt turns on: the
   * near half is magnified more than the far half shrinks, so the board lands
   * low in its frame, leaving a wider gap above it than below. Shifting the
   * scene back by this much evens the two up.
   *
   * The extremes of a rotated rectangle are its corners, so the vertical span
   * either side of centre is `halfSpan`; projecting that through the same
   * perspective as the board gives the offset in closed form — no measuring,
   * so it stays exact while the camera is moving.
   */
  const PERSPECTIVE = 1500;
  const tiltRad = (tiltAngle * Math.PI) / 180;
  const rotationRad = (rotationAngle * Math.PI) / 180;
  const halfSpan =
    zoomLevel *
    ((boardBox.w / 2) * Math.abs(Math.sin(rotationRad)) + (boardBox.h / 2) * Math.abs(Math.cos(rotationRad)));
  const projectionDrop =
    (halfSpan * halfSpan * PERSPECTIVE * Math.sin(tiltRad) * Math.cos(tiltRad)) /
    Math.max(PERSPECTIVE * PERSPECTIVE - halfSpan * halfSpan * Math.sin(tiltRad) ** 2, 1);

  /**
   * Where a pitch coordinate lands on screen, relative to the stage's centre.
   *
   * The same camera the board is drawn with — zoom, then the bearing, then the
   * tilt, then the perspective divide — applied by hand to one point, so a
   * marker placed here sits exactly on its patch of turf. `depth` is the
   * perspective's own magnification at that point: markers nearer the lens
   * draw a little larger, as they would standing on the board.
   */
  const projectToScreen = (px: number, py: number) => {
    const x0 = (px / 100 - 0.5) * boardBox.w * zoomLevel;
    const y0 = (py / 100 - 0.5) * boardBox.h * zoomLevel;
    const bearing = -rotationRad;
    const x1 = x0 * Math.cos(bearing) - y0 * Math.sin(bearing);
    const y1 = x0 * Math.sin(bearing) + y0 * Math.cos(bearing);
    const depth = PERSPECTIVE / (PERSPECTIVE - y1 * Math.sin(tiltRad));
    return { x: x1 * depth, y: y1 * Math.cos(tiltRad) * depth, depth };
  };

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
      // Create waypoint
      setWaypoints((prev) => [...prev, { from: selectedPlayer, to: playerId }]);
      setSelectedPlayer(null);
    }
  };

  const handleRemoveLine = (lineIndex: number) => {
    setWaypoints((prev) => prev.filter((_, index) => index !== lineIndex));
  };

  const fieldColor = normalizeFieldColor(options.fieldColor);
  const lightStripe = 'rgba(255,255,255,0.05)';
  const darkStripe = 'rgba(0,0,0,0.05)';
  const stripePct = 9.09;
  const stripeAngle = portrait ? '0deg' : '90deg';
  const pitchBackground = `repeating-linear-gradient(
    ${stripeAngle},
    ${lightStripe} 0%,
    ${lightStripe} ${stripePct}%,
    ${darkStripe} ${stripePct}%,
    ${darkStripe} ${stripePct * 2}%
  ), ${fieldColor}`;

  const fieldStyle = {
    background: pitchBackground,
    aspectRatio: portrait ? "7/11" : "11/7",
    width: "100%",
    // On a phone the card has a height of its own, so cap the board by it and
    // let the aspect ratio hand back the width. On desktop there is no such
    // cap: the board spans the stage and the stage takes its height from it.
    ...(portrait ? { maxHeight: "100%" } : {}),
    maxWidth: "100%",
    margin: "0 auto",
  };

  return (
    <div
      className={portrait ? "rounded-2xl p-2" : "rounded-2xl p-6"}
      style={{
        background: "var(--surface-container)",
        border: "var(--border-w) solid var(--ink)",
        boxShadow: "var(--card-shadow)",
        // The card is the camera's frame: perspective widens the board's near
        // edge past its own box, so it spills into the padding and crops here.
        overflow: "hidden",
        // On a phone the card is the stage, so it takes the height it is given
        // instead of wrapping a fixed-height box with dead space around it.
        ...(portrait ? { height: "100%", display: "flex", flexDirection: "column" as const } : {}),
      }}
    >
      <div className="w-full flex justify-center relative" style={portrait ? { flex: 1, minHeight: 0 } : undefined}>
        {/* 3D Perspective Container */}
        <div
          ref={stageRef}
          className="mb-0 relative"
          onPointerMove={actions.onPointerMove}
          onPointerUp={actions.onPointerUp}
          onPointerCancel={actions.onPointerUp}
          style={{
            perspective: "1500px",
            perspectiveOrigin: "center center",
            width: "100%",
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // The stage takes its height from the board it frames, so zoom is a
            // plain camera scale rather than a fit: 100% fills the frame and
            // anything past it crops at the edges, like the reference rig.
            ...(portrait ? { height: "100%" } : {}),
            padding: "16px 0",
            // Applied out here, outside the perspective, so it moves the whole
            // projection evenly instead of being projected itself.
            transform: `translateY(${-projectionDrop}px)`,
            transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div
            ref={fieldRef}
            // Not clipped: perspective pushes the near edge past the board's
            // own box. The card is the frame that crops.
            className="relative rounded-xl cursor-move mb-0"
            style={{
              ...fieldStyle,
              transformStyle: "preserve-3d",
              // The dial is the camera's bearing, so the board counter-rotates
              // against it — orbiting the camera right swings the pitch left.
              transform: `rotateX(${tiltAngle}deg) rotateZ(${-rotationAngle}deg) scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* 3D Field Markings */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={portrait ? "0 0 350 550" : "0 0 550 350"}
              style={{
                opacity: 0.32,
                transform: "translateZ(0)",
                transformStyle: "preserve-3d",
              }}
            >
            {/* A quarter turn applied once, rather than transposing 25 shapes by
                hand. It is a rotation (determinant +1), so arcs and handedness
                come through untouched — the bug that flipping sweep flags caused
                on the tactics board. */}
            <g transform={portrait ? "matrix(0,-1,1,0,0,550)" : undefined}>
            {/* Field outline with isometric effect */}
            <rect
              x="20"
              y="20"
              width="510"
              height="310"
              stroke="white"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Halfway line */}
            <line
              x1="275"
              y1="20"
              x2="275"
              y2="330"
              stroke="white"
              strokeWidth="2.5"
            />

            {/* Center circle */}
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
                  transform={portrait ? "rotate(90 275 340)" : undefined}
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
                  transform={portrait ? "rotate(90 275 340)" : undefined}
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

                {/* Attacking Third - Right penalty box area */}
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
                  transform={portrait ? "rotate(90 275 340)" : undefined}
                  x="456.25"
                  y="340"
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  dominantBaseline="middle"
                  fontWeight="bold"
                >
                  Attacking third
                </text>
              </g>
            )}

            {verticalSpacesMode && (
              <g>
                {/* The five channels as the studio draws them — wide, half-space
                    and centre lanes running goal to goal. They stack across the
                    pitch's width, which is what makes them vertical: strips
                    running along its length would be thirds. */}
                {[
                  { y: 20, height: 70, label: "Wide space", fontSize: 12, outlined: true },
                  { y: 90, height: 45, label: "Half space", fontSize: 12, outlined: false },
                  { y: 135, height: 80, label: "Centre", fontSize: 14, outlined: true },
                  { y: 215, height: 45, label: "Half space", fontSize: 12, outlined: false },
                  { y: 260, height: 70, label: "Wide space", fontSize: 12, outlined: true },
                ].map((lane) => {
                  const midY = lane.y + lane.height / 2;
                  return (
                    <g key={`${lane.label}-${lane.y}`}>
                      <rect
                        x="20"
                        y={lane.y}
                        width="510"
                        height={lane.height}
                        fill={`rgba(255, 255, 255, ${lane.outlined ? 0.15 : 0.2})`}
                        stroke={lane.outlined ? "rgba(255, 255, 255, 0.9)" : undefined}
                        strokeWidth={lane.outlined ? 2 : undefined}
                        strokeDasharray={lane.outlined ? "5,5" : undefined}
                      />
                      <text
                        transform={portrait ? `rotate(90 275 ${midY})` : undefined}
                        x="275"
                        y={midY}
                        textAnchor="middle"
                        fill="white"
                        fontSize={lane.fontSize}
                        dominantBaseline="middle"
                        fontWeight="bold"
                      >
                        {lane.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Waypoint Lines */}
            {waypoints.map((waypoint, index) => {
              const fromPlayer = players.find((p) => p.id === waypoint.from);
              const toPlayer = players.find((p) => p.id === waypoint.to);
              if (!fromPlayer || !toPlayer) return null;

              return (
                <line
                  key={index}
                  x1={fromPlayer.x}
                  y1={fromPlayer.y}
                  x2={toPlayer.x}
                  y2={toPlayer.y}
                  stroke="yellow"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  opacity="0.8"
                />
              );
            })}
            </g>
            </svg>

          {/* Context Menu */}
          {contextMenu.visible && (
            <div
              className="absolute bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg p-2 z-50"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
                opacity: 0.75,
              }}
            >
              <button
                onClick={() => handlePlayerAction("captain")}
                className="block w-full text-left px-3 py-1 hover:bg-[var(--card-hover)] rounded text-sm"
              >
                Toggle Captain
              </button>
              <button
                onClick={() => handlePlayerAction("yellow")}
                className="block w-full text-left px-3 py-1 hover:bg-[var(--card-hover)] rounded text-sm"
              >
                Toggle Yellow Card
              </button>
              <button
                onClick={() => handlePlayerAction("red")}
                className="block w-full text-left px-3 py-1 hover:bg-[var(--card-hover)] rounded text-sm"
              >
                Toggle Red Card
              </button>
              <button
                onClick={() => handlePlayerAction("key")}
                className="block w-full text-left px-3 py-1 hover:bg-[var(--card-hover)] rounded text-sm"
              >
                Toggle Star Player
              </button>
            </div>
          )}

          {/* Waypoint Removal UI */}
          {waypoints.length > 0 && (
            <div className="absolute top-2 right-2 bg-[var(--card)] border border-[var(--border)] rounded-lg p-2 z-30">
              <h4 className="text-sm font-bold mb-2">Waypoints</h4>
              {waypoints.map((waypoint, index) => {
                const fromPlayer = players.find((p) => p.id === waypoint.from);
                const toPlayer = players.find((p) => p.id === waypoint.to);
                return (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <span className="text-xs">
                      {fromPlayer?.name || `Player ${waypoint.from}`} → {toPlayer?.name || `Player ${waypoint.to}`}
                    </span>
                    <button
                      onClick={() => handleRemoveLine(index)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          </div>

          {/* Player markers: a 2D layer over the camera, not inside it.

              Each is placed by projecting its pitch coordinate through the same
              perspective the board is drawn with, so its anchor lands exactly
              where that patch of turf does. Inside the 3D scene they had three
              faults at once: the board's zoom sat between the camera's tilt and
              the marker's counter-tilt and did not commute with it, so circles
              rendered up to 15% oval; a label hanging below its shirt dipped
              under the turf, where the depth sort swallowed it; and lifting the
              plane to stop that shifted the whole team by height × sin(tilt),
              walking the goalkeeper off the pitch. Flat, none of that exists:
              round at any zoom, never occluded, and drawn on their coordinates. */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {players.map((player) => {
              // Same quarter turn as the markings, in percentage space.
              const at = projectToScreen(portrait ? player.y : player.x, portrait ? 100 - player.x : player.y);
              const dragged = draggedPlayer?.id === player.id;
              return (
                <div
                  key={player.id}
                  data-player-id={player.id}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${at.x}px)`,
                    top: `calc(50% + ${at.y}px)`,
                    translate: "-50% -50%",
                    // Nearer markers paint over farther ones, as they would on the board.
                    zIndex: Math.round(1000 + at.depth * 100),
                    pointerEvents: "auto",
                    // Glides with the board's own camera transition, but never
                    // while being dragged — an ease on a drag makes the marker
                    // trail the cursor instead of following it.
                    transition: dragged
                      ? "none"
                      : "left 260ms cubic-bezier(0.22, 1, 0.36, 1), top 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <PlayerMarker
                    key={player.id}
                    player={player}
                    scale={scale * zoomLevel * at.depth}
                    isDragged={dragged}
                    onPointerDown={(grabbed, e) => actions.onPointerDown?.(grabbed, e)}
                    editable={options.editable}
                    onNameChange={onPlayerNameChange}
                    onPositionChange={
                      actions.onUpdatePlayer
                        ? (id, position) => actions.onUpdatePlayer!(id, { position })
                        : undefined
                    }
                    onContextMenu={(e) => {
                      onShowContextMenu(e, player);
                    }}
                    enableContextMenu={options.enableContextMenu}
                    showPlayerLabels={options.showPlayerLabels ?? showPlayerLabels}
                    markerType={markerType}
                    waypointsMode={waypointsMode}
                    isSelected={selectedPlayer === player.id}
                    onWaypointsClick={() => handleWaypointsClick(player.id)}
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
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LineupField;
