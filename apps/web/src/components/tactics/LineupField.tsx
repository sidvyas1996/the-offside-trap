import React, { useState, useEffect } from "react";
import { useFootballField } from "../../contexts/FootballFieldContext.tsx";
import PlayerMarker from "../PlayerMarker.tsx";
import {
  DEFAULT_FOOTBALL_FIELD_COLOUR,
  CHARCOAL_GRAY,
} from "../../utils/colors.ts";

interface LineupFieldProps {
  waypointsMode: boolean;
  horizontalZonesMode: boolean;
  verticalSpacesMode: boolean;
  onChangeFieldColor: (color: string) => void;
  onChangePlayerColor: (color: string) => void;
  onTogglePlayerLabels: () => void;
  showPlayerLabels: boolean;
  onToggleMarkerType: () => void;
  markerType: 'circle' | 'shirt';
  onToggleWaypoints: () => void;
  onToggleHorizontalZones: () => void;
  onToggleVerticalSpaces: () => void;
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
}

const LineupField: React.FC<LineupFieldProps> = ({
  waypointsMode,
  horizontalZonesMode,
  verticalSpacesMode,
  onChangeFieldColor,
  onChangePlayerColor,
  onTogglePlayerLabels,
  showPlayerLabels,
  onToggleMarkerType,
  markerType,
  onToggleWaypoints,
  onToggleHorizontalZones,
  onToggleVerticalSpaces,
  rotationAngle: propRotationAngle,
  tiltAngle: propTiltAngle,
  onRotationChange,
  onTiltChange,
  zoomLevel: propZoomLevel,
  onZoomChange,
  onRotateLeft: propOnRotateLeft,
  onRotateRight: propOnRotateRight,
  onTiltUp: propOnTiltUp,
  onTiltDown: propOnTiltDown,
  onZoomIn: propOnZoomIn,
  onZoomOut: propOnZoomOut,
}) => {
  const { players, draggedPlayer, options, actions, fieldRef } =
    useFootballField();

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

  // Field rotation and tilt state - use props if provided, otherwise use local state
  const [localRotationAngle, setLocalRotationAngle] = useState(0);
  const [localTiltAngle, setLocalTiltAngle] = useState(20);
  const rotationAngle = propRotationAngle !== undefined ? propRotationAngle : localRotationAngle;
  const tiltAngle = propTiltAngle !== undefined ? propTiltAngle : localTiltAngle;
  // Zoom state: 1.0 = default (100%), 0.75 = zoomed out (75%), 1.2 = zoomed in (120%)
  // Default can zoom out to 0.75, then from 0.75 can zoom in to 1.0, then to 1.2
  const [localZoomLevel, setLocalZoomLevel] = useState(1.0);
  const zoomLevel = propZoomLevel !== undefined ? propZoomLevel : localZoomLevel;

  // Function to calculate and update context menu position
  const updateContextMenuPosition = (playerId: number) => {
    if (!fieldRef.current || !contextMenu.visible || contextMenu.playerId !== playerId) return;
    
    // Find the marker wrapper by data attribute
    const markerWrapper = fieldRef.current.querySelector(`[data-player-id="${playerId}"]`) as HTMLElement;
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
      // Create waypoint
      setWaypoints((prev) => [...prev, { from: selectedPlayer, to: playerId }]);
      setSelectedPlayer(null);
    }
  };

  const handleRemoveLine = (lineIndex: number) => {
    setWaypoints((prev) => prev.filter((_, index) => index !== lineIndex));
  };

  // Rotation and tilt handlers
  const handleRotateLeft = () => {
    if (propOnRotateLeft) {
      propOnRotateLeft();
    } else {
      const newAngle = (rotationAngle - 15 + 360) % 360;
      if (onRotationChange) {
        onRotationChange(newAngle);
      } else {
        setLocalRotationAngle(newAngle);
      }
    }
  };

  const handleRotateRight = () => {
    if (propOnRotateRight) {
      propOnRotateRight();
    } else {
      const newAngle = (rotationAngle + 15) % 360;
      if (onRotationChange) {
        onRotationChange(newAngle);
      } else {
        setLocalRotationAngle(newAngle);
      }
    }
  };

  const handleTiltUp = () => {
    if (propOnTiltUp) {
      propOnTiltUp();
    } else {
      const newAngle = Math.min(45, tiltAngle + 5);
      if (onTiltChange) {
        onTiltChange(newAngle);
      } else {
        setLocalTiltAngle(newAngle);
      }
    }
  };

  const handleTiltDown = () => {
    if (propOnTiltDown) {
      propOnTiltDown();
    } else {
      const newAngle = Math.max(0, tiltAngle - 5);
      if (onTiltChange) {
        onTiltChange(newAngle);
      } else {
        setLocalTiltAngle(newAngle);
      }
    }
  };

  // Zoom handlers
  // Zoom out: 1.2 -> 1.0 -> 0.75 (75% min)
  // Zoom in: 0.75 -> 1.0 -> 1.2 (120% max)
  const handleZoomOut = () => {
    if (propOnZoomOut) {
      propOnZoomOut();
    } else {
      if (zoomLevel === 1.2) {
        const newLevel = 1.0;
        if (onZoomChange) {
          onZoomChange(newLevel);
        } else {
          setLocalZoomLevel(newLevel);
        }
      } else if (zoomLevel === 1.0) {
        const newLevel = 0.75;
        if (onZoomChange) {
          onZoomChange(newLevel);
        } else {
          setLocalZoomLevel(newLevel);
        }
      }
    }
  };

  const handleZoomIn = () => {
    if (propOnZoomIn) {
      propOnZoomIn();
    } else {
      if (zoomLevel === 0.75) {
        const newLevel = 1.0;
        if (onZoomChange) {
          onZoomChange(newLevel);
        } else {
          setLocalZoomLevel(newLevel);
        }
      } else if (zoomLevel === 1.0) {
        const newLevel = 1.2;
        if (onZoomChange) {
          onZoomChange(newLevel);
        } else {
          setLocalZoomLevel(newLevel);
        }
      }
    }
  };


  const fieldStyle = {
    backgroundColor: options.fieldColor || DEFAULT_FOOTBALL_FIELD_COLOUR,
    aspectRatio: "11/7",
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">Lineup Field</h2>
      <div className="w-full flex justify-center relative">
        {/* 3D Perspective Container */}
        <div
          className="overflow-hidden mb-0"
          style={{
            perspective: "1500px",
            perspectiveOrigin: "center center",
            width: "100%",
            maxWidth: "100%",
            aspectRatio: "11/7",
            minHeight: "486px",
          }}
        >
          <div
            ref={fieldRef}
            className="relative rounded-xl overflow-hidden cursor-move mb-0"
            style={{
              ...fieldStyle,
              transformStyle: "preserve-3d",
              transform: `rotateX(${tiltAngle}deg) rotateZ(${rotationAngle}deg) scale(${0.675 * zoomLevel})`,
              transformOrigin: "center center",
            }}
            onMouseMove={actions.onMouseMove}
            onMouseUp={actions.onMouseUp}
            onMouseLeave={actions.onMouseUp}
          >
            {/* 3D Field Markings */}
            <svg
              className="absolute inset-0 w-full h-full opacity-30"
              viewBox="0 0 550 350"
              style={{
                transform: "translateZ(0)",
                transformStyle: "preserve-3d",
              }}
            >
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
                {/* Left Wing */}
                <rect
                  x="20"
                  y="20"
                  width="170"
                  height="310"
                  fill="rgba(255, 255, 255, 0.1)"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  strokeDasharray="5.5"
                />
                <text
                  x="105"
                  y="340"
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  dominantBaseline="middle"
                  fontWeight="bold"
                >
                  Left wing
                </text>

                {/* Center */}
                <rect
                  x="190"
                  y="20"
                  width="170"
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
                  Center
                </text>

                {/* Right Wing */}
                <rect
                  x="360"
                  y="20"
                  width="170"
                  height="310"
                  fill="rgba(255, 255, 255, 0.1)"
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  strokeDasharray="5.5"
                />
                <text
                  x="445"
                  y="340"
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  dominantBaseline="middle"
                  fontWeight="bold"
                >
                  Right wing
                </text>
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
          </svg>

          {/* Player Markers with 3D Transform */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transform: "translateZ(0)",
              pointerEvents: "none"
            }}
          >
            {players.map((player) => (
              <div
                key={player.id}
                data-player-id={player.id}
                style={{
                  position: "absolute",
                  left: `${player.x}%`,
                  top: `${player.y}%`,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "auto"
                }}
              >
                <PlayerMarker
                  key={player.id}
                  player={player}
                  scale={scale}
                  isDragged={draggedPlayer?.id === player.id}
                  onMouseDown={() => actions.onMouseDown && actions.onMouseDown(player)}
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
                  rotationAngle={rotationAngle}
                />
              </div>
            ))}
          </div>

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
        </div>

      </div>
    </div>
  );
};

export default LineupField;
