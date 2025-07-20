import React, { useState, useEffect } from "react";
import type { Player } from "../../../../packages/shared";
import PlayerMarker from "./PlayerMarker.tsx";

interface FootballFieldProps {
  players: Player[];
  draggedPlayer: Player | null;
  onMouseDown: (player: Player) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  fieldRef: React.RefObject<HTMLDivElement | null>;
  size?: "default" | "fullscreen";
  isPlayerNameEditable?: boolean;
  onPlayerNameChange?: (id: number, name: string) => void;
}

const FootballField: React.FC<FootballFieldProps> = ({
  players,
  draggedPlayer,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  fieldRef,
  size,
  isPlayerNameEditable = false,
  onPlayerNameChange,
}) => {
  const [scale, setScale] = useState(1);

  // Observe field size to calculate scale dynamically
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

  return (
    <div
      ref={fieldRef}
      className="relative bg-green-800 rounded-xl overflow-hidden cursor-move mb-6"
      style={
        size === "fullscreen"
          ? {
              aspectRatio: "11/7",
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              maxHeight: "calc(100vh - 100px)",
              margin: "0 auto",
            }
          : {
              aspectRatio: "11/7",
              width: "100%",
              maxWidth: "800px",
              margin: "0 auto",
            }
      }
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
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
      {players.map((player) => (
        <PlayerMarker
          key={player.id}
          player={player}
          scale={scale}
          isDragged={draggedPlayer?.id === player.id}
          onMouseDown={onMouseDown}
          editable={isPlayerNameEditable}
          onNameChange={onPlayerNameChange}
        />
      ))}
    </div>
  );
};

export default FootballField;
