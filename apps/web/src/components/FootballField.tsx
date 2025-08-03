import React, { useState, useEffect } from "react";
import { useFootballField } from "../contexts/FootballFieldContext.tsx";
import PlayerMarker from "./PlayerMarker.tsx";
import {
  DEFAULT_FOOTBALL_FIELD_COLOUR,
  CHARCOAL_GRAY,
} from "../utils/colors.ts";

interface FootballFieldProps {
  editable?: boolean;
  size?: "default" | "fullscreen";
  waypointsMode?: boolean;
  horizontalZonesMode?: boolean;
  verticalSpacesMode?: boolean;
}

const FootballField: React.FC<FootballFieldProps> = ({
  editable,
  size,
  waypointsMode = false,
  horizontalZonesMode = false,
  verticalSpacesMode = false,
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
  const fieldStyle =
    size === "fullscreen" || options.size === "fullscreen"
      ? {
          backgroundColor: options.fieldColor || DEFAULT_FOOTBALL_FIELD_COLOUR,
          aspectRatio: "11/7",
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          maxHeight: "calc(100vh - 100px)",
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
    <div
      ref={fieldRef}
      className="relative rounded-xl overflow-hidden cursor-move mb-6"
      style={fieldStyle}
      onMouseMove={actions.onMouseMove}
      onMouseUp={actions.onMouseUp}
      onMouseLeave={actions.onMouseUp}
    >
      {/* Field Markings */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
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

      {/* Players */}
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
        />
      ))}

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
