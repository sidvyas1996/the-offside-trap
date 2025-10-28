import React, { useState, useEffect } from "react";
import { useFootballField } from "../../contexts/FootballFieldContext.tsx";
import PlayerMarker from "../PlayerMarker.tsx";
import CreatorsMenu from "../ui/creators-menu";
import {
  DEFAULT_FOOTBALL_FIELD_COLOUR,
  CHARCOAL_GRAY,
} from "../../utils/colors.ts";

interface LineupFieldProps {
  waypointsMode: boolean;
  horizontalZonesMode: boolean;
  verticalSpacesMode: boolean;
  isFullScreen: boolean;
  onChangeFieldColor: (color: string) => void;
  onChangePlayerColor: (color: string) => void;
  onTogglePlayerLabels: () => void;
  showPlayerLabels: boolean;
  onToggleMarkerType: () => void;
  markerType: 'circle' | 'shirt';
  onToggleWaypoints: () => void;
  onToggleHorizontalZones: () => void;
  onToggleVerticalSpaces: () => void;
  onToggleFullScreen: () => void;
}

const LineupField: React.FC<LineupFieldProps> = ({
  waypointsMode,
  horizontalZonesMode,
  verticalSpacesMode,
  isFullScreen,
  onChangeFieldColor,
  onChangePlayerColor,
  onTogglePlayerLabels,
  showPlayerLabels,
  onToggleMarkerType,
  markerType,
  onToggleWaypoints,
  onToggleHorizontalZones,
  onToggleVerticalSpaces,
  onToggleFullScreen,
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
      // Create waypoint
      setWaypoints((prev) => [...prev, { from: selectedPlayer, to: playerId }]);
      setSelectedPlayer(null);
    }
  };

  const handleRemoveLine = (lineIndex: number) => {
    setWaypoints((prev) => prev.filter((_, index) => index !== lineIndex));
  };

  const fieldStyle = isFullScreen
    ? {
        backgroundColor: options.fieldColor || DEFAULT_FOOTBALL_FIELD_COLOUR,
        aspectRatio: "11/7",
        width: "100%",
        maxWidth: "100%",
        height: "auto",
        margin: "0 auto",
      }
    : {
        backgroundColor: options.fieldColor || DEFAULT_FOOTBALL_FIELD_COLOUR,
        aspectRatio: "11/7",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
      };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">Lineup Field</h2>
      <div className="w-full flex justify-center">
        <div
          ref={fieldRef}
          className={`relative rounded-xl overflow-hidden cursor-move ${isFullScreen ? '' : 'mb-6'}`}
          style={fieldStyle}
          onMouseMove={actions.onMouseMove}
          onMouseUp={actions.onMouseUp}
          onMouseLeave={actions.onMouseUp}
        >
          {/* Isometric Field Markings */}
                     <svg
             className="absolute inset-0 w-full h-full opacity-30"
             viewBox="0 0 550 350"
             style={{
               transform: "perspective(1200px) rotateX(20deg) rotateZ(0deg) translateY(-40px) scaleY(0.7) scaleX(1.1)",
               transformOrigin: "center center"
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

          {/* Player Markers with Isometric Transform */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "perspective(1200px) rotateX(20deg) rotateZ(0deg) translateY(-40px) scaleY(0.7) scaleX(1.1)",
              transformOrigin: "center center",
              pointerEvents: "none"
            }}
          >
            {players.map((player) => (
              <div
                key={player.id}
                style={{
                  position: "absolute",
                  left: `${player.x}%`,
                  top: `${player.y}%`,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "auto"
                }}
              >
                <PlayerMarker
                  player={player}
                  scale={scale}
                  isSelected={selectedPlayer === player.id}
                  isDragging={draggedPlayer?.id === player.id}
                  showLabels={options.showPlayerLabels ?? showPlayerLabels}
                  markerType={markerType}
                  onShowContextMenu={onShowContextMenu}
                  onClick={handleWaypointsClick}
                  onPlayerNameChange={onPlayerNameChange}
                  playerColor={options.playerColor || CHARCOAL_GRAY}
                />
              </div>
            ))}
          </div>

          {/* Context Menu */}
          {contextMenu.visible && (
            <div
              className="absolute bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-2 z-50"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
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
            <div className="absolute top-2 right-2 bg-[var(--card)] border border-[var(--border)] rounded-lg p-2">
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
      <div className="mt-4">
        <CreatorsMenu
          onChangeFieldColor={onChangeFieldColor}
          onChangePlayerColor={onChangePlayerColor}
          onTogglePlayerLabels={onTogglePlayerLabels}
          showPlayerLabels={showPlayerLabels}
          onToggleMarkerType={onToggleMarkerType}
          markerType={markerType}
          onToggleWaypoints={onToggleWaypoints}
          waypointsMode={waypointsMode}
          onToggleHorizontalZones={onToggleHorizontalZones}
          horizontalZonesMode={horizontalZonesMode}
          onToggleVerticalSpaces={onToggleVerticalSpaces}
          verticalSpacesMode={verticalSpacesMode}
          onToggleFullScreen={onToggleFullScreen}
          isFullScreen={isFullScreen}
        />
      </div>
    </div>
  );
};

export default LineupField; 