import React, { useState } from "react";
import type { Player } from "../../../../packages/shared";
import { Star } from "lucide-react";

interface PlayerMarkerProps {
  player: Player;
  scale: number;
  isDragged: boolean;
  onMouseDown: (player: Player) => void;
  editable?: boolean;
  onNameChange?: (id: number, name: string) => void;
  onPositionChange?: (id: number, position: string) => void;
  onContextMenu?: (e: React.MouseEvent, player: Player) => void;
  enableContextMenu?: boolean;
  showPlayerLabels?: boolean;
}

const PlayerMarker: React.FC<PlayerMarkerProps> = ({
  player,
  scale,
  isDragged,
  onMouseDown,
  editable = false,
  onNameChange,
  onPositionChange,
  onContextMenu,
  enableContextMenu,
  showPlayerLabels = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [name, setName] = useState(player.name || `Player ${player.number}`);
  const [position, setPosition] = useState(player.position || player.number.toString());
  const [isStarSpinning, setIsStarSpinning] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (onNameChange) onNameChange(player.id, e.target.value);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = e.target.value.toUpperCase().slice(0, 2);
    setPosition(newPosition);
    if (onPositionChange) onPositionChange(player.id, newPosition);
  };

  return (
    <div
      className="absolute cursor-grab active:cursor-grabbing select-none focus:outline-none"
      style={{
        left: `${player.x}%`,
        top: `${player.y}%`,
        zIndex: isDragged ? 50 : 10,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center",
        transition: "transform 0.2s ease-in-out",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(player);
      }}
      onDoubleClick={() => editable && setIsEditing(true)}
      onContextMenu={(e) => {
          if (!enableContextMenu) return;
          e.preventDefault();
          e.stopPropagation();
          if (onContextMenu) {
              onContextMenu(e, player);
          }
      }}
    >
      <div className="relative flex flex-col items-center transition-all duration-300 ease-in-out">
        <div 
          className={`w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:bg-gray-700 transition-all duration-300 ease-in-out ${showPlayerLabels ? 'scale-100' : 'scale-110'} ${player.isStarPlayer ? 'ring-2 ring-yellow-400 animate-ring-pulse' : ''}`}
          onDoubleClick={() => editable && setIsEditingPosition(true)}
        >
          {isEditingPosition ? (
            <input
              type="text"
              value={position}
              onChange={handlePositionChange}
              onBlur={() => setIsEditingPosition(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setIsEditingPosition(false);
                }
              }}
              autoFocus
              className="w-8 h-8 bg-transparent text-white font-bold text-lg text-center border-none outline-none"
              maxLength={2}
            />
          ) : (
            position
          )}
        </div>

        {/* Star Player Star Icon */}
        {player.isStarPlayer && (
          <div 
            className="absolute -right-2 top-1/3 transform -translate-y-1/2 cursor-pointer hover:scale-125"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsStarSpinning(true);
              setTimeout(() => setIsStarSpinning(false), 1000);
            }}
          >
            <Star 
              className={`w-5 h-4 text-yellow-400 ${isStarSpinning ? 'animate-spin' : ''}`}
              fill="currentColor"
            />
          </div>
        )}

        {/* Captain's Armband with White Background */}
        {player.isCaptain && (
          <img
            src="/armband.png"
            alt="Captain"
            className={`relative bottom-3 -left-7 w-8 h-8 object-contain hover:scale-125 transition-transform ${showPlayerLabels ? 'bottom-7.5' : '-bottom-1'}`}
          />
        )}

        {/* Yellow Card - Rounded */}
        {player.hasYellowCard && (
          <img
            src="/yellow-card.png"
            alt="Yellow Card"
            className="absolute -top-2.5 -left-2 w-7 h-8 object-contain hover:scale-125 transition-transform"
          />
        )}

        {/* Red Card - Rounded */}
        {player.hasRedCard && (
          <img
            src="/red-card.png"
            alt="Red Card"
            className="absolute -top-2.5 -left-2 w-7 h-8 object-contain hover:scale-125 transition-transform"
          />
        )}

        {/* Player Name */}
        <div className={`transition-all duration-300 ease-in-out ${showPlayerLabels ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // ✅ Stops form submit
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="bg-[#1a1a1a] text-white font-semibold mt-1 px-2 py-1 rounded border border-gray-900 w-24 text-center"
            />
          ) : (
            <div className="bg-[#1a1a1a] text-white font-semibold mt-1 px-2 py-1 rounded opacity-70">
              {name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerMarker;
