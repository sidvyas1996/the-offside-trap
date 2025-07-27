import React, { useEffect, useState } from "react";
import PlayerMarker from "./PlayerMarker";
import { CHARCOAL_GRAY, DEFAULT_FOOTBALL_FIELD_COLOUR } from "../utils/colors";
import {useFootballField} from "../contexts/FootballFieldContext.tsx";

interface FootballFieldProps {
  editable?: boolean;
  size?: "default" | "fullscreen";
}

const FootballField: React.FC<FootballFieldProps> = ({ editable, size }) => {
  const {
    players,
    draggedPlayer,
    options,
    actions,
    fieldRef,
  } = useFootballField();

  const { onUpdatePlayer, onPlayerNameChange } = actions;

  const [scale, setScale] = useState(1);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; playerId: number | null }>({ visible: false, x: 0, y: 0, playerId: null });

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
    const updates =
      action === "captain"
        ? { isCaptain: true }
        : action === "yellow"
        ? { hasYellowCard: true }
        : { hasRedCard: true };
    onUpdatePlayer(contextMenu.playerId, updates);
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Responsive field sizing
  const fieldStyle = size === "fullscreen" || options.size === "fullscreen"
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
                  r="45"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
              />
              <circle cx="275" cy="175" r="3" fill="white" />

              {/* Goal and Box Markings */}
              <rect
                  x="20"
                  y="95"
                  width="70"
                  height="160"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
              />
              <rect
                  x="460"
                  y="95"
                  width="70"
                  height="160"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
              />
              <rect
                  x="20"
                  y="130"
                  width="30"
                  height="90"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
              />
              <rect
                  x="500"
                  y="130"
                  width="30"
                  height="90"
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
          </svg>

        {/* Players */}
        {players.map((player:any)  => (
            <PlayerMarker
                key={player.id}
                player={player}
                scale={scale}
                isDragged={draggedPlayer?.id === player.id}
                onMouseDown={() => actions.onMouseDown && actions.onMouseDown(player)}
                editable={typeof editable === 'boolean' ? editable : options.editable}
                onNameChange={onPlayerNameChange}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onShowContextMenu(player.id, e.clientX, e.clientY);
                }}
                enableContextMenu={options.enableContextMenu}
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
                {[
                  { action: "captain", label: "Assign as Captain" },
                  { action: "yellow", label: "Assign Yellow Card" },
                  { action: "red", label: "Assign Red Card" },
                ].map(({ action, label }) => (
                  <li
                    key={action}
                    className="cursor-pointer hover:bg-gray-700 px-3 py-1 rounded"
                    onClick={() => handlePlayerAction(action)}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
        )}
      </div>
  );
};

export default FootballField;
