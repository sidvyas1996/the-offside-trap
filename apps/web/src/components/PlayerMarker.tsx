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
  markerType?: 'circle' | 'shirt';
  waypointsMode?: boolean;
  isSelected?: boolean;
  onWaypointsClick?: () => void;
  rotationAngle?: number;
  fovAngle?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  markerBgColor?: string;
  markerBorderColor?: string;
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
  markerType = 'circle',
  waypointsMode = false,
  isSelected = false,
  onWaypointsClick,
  rotationAngle = 0,
  fovAngle,
  onMouseEnter,
  onMouseLeave,
  markerBgColor = '#111827',
  markerBorderColor = '#ffffff',
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
        transition: isDragged ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(player);
      }}
      onDoubleClick={() => editable && setIsEditing(true)}
      onClick={() => waypointsMode && onWaypointsClick && onWaypointsClick()}
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
        {/* FOV direction indicator — rotates around the marker to show facing direction */}
        {fovAngle !== undefined && (
          <div
            style={{
              position: 'absolute',
              width: 40, height: 40,
              top: '50%', left: '50%',
              marginLeft: -20, marginTop: -20,
              transform: `rotate(${fovAngle}deg)`,
              pointerEvents: 'none',
              zIndex: 15,
              transition: 'transform 0.2s ease',
            }}
          >
            {/* Small yellow triangle arrow at the right edge (facing direction) */}
            <div style={{
              position: 'absolute',
              top: '50%',
              right: -7,
              transform: 'translateY(-50%)',
              width: 0, height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '8px solid #ffee00',
              filter: 'drop-shadow(0 0 2px rgba(200,200,0,0.8))',
            }} />
          </div>
        )}
        {markerType === 'circle' ? (
                  <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all duration-200 ease-in-out ${showPlayerLabels ? 'scale-100' : 'scale-110'} ${player.isStarPlayer ? 'ring-2 ring-yellow-400 animate-ring-pulse' : ''} ${isDragged ? 'scale-110' : ''} ${isSelected ? 'ring-4 ring-green-400' : ''}`}
          style={{
            backgroundColor: markerBgColor,
            color: markerBorderColor,
            boxShadow: isDragged
              ? '0 8px 24px rgba(0,0,0,0.5)'
              : '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            border: `4px solid ${markerBorderColor}`,
          }}
          onDoubleClick={() => editable && setIsEditingPosition(true)}
        >
            <div
              className="flex items-center justify-center"
              style={{
                transform: `rotate(${-rotationAngle}deg)`,
                transformOrigin: 'center',
              }}
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
                <span className="text-center">{position}</span>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out ${showPlayerLabels ? 'scale-100' : 'scale-110'} ${player.isStarPlayer ? 'ring-2 ring-yellow-400 animate-ring-pulse' : ''} ${isDragged ? 'scale-110 shadow-lg' : ''} ${isSelected ? 'ring-4 ring-green-400' : ''}`}
            onDoubleClick={() => editable && setIsEditingPosition(true)}
          >
            <img
              src="/football-shirt.png"
              alt="Player"
              className="w-full h-full object-contain"
            />
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
                className="absolute w-8 h-8 bg-transparent text-white font-bold text-lg text-center border-none outline-none"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `
                    translate(-50%, -50%) 
                    rotate(${-rotationAngle}deg)
                  `,
                  transformOrigin: 'center',
                }}
                maxLength={2}
              />
            ) : (
              <div
                className="absolute text-white font-bold text-lg"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `
                    translate(-50%, -50%) 
                    rotate(${-rotationAngle}deg)
                  `,
                  transformOrigin: 'center',
                }}
              >
                {position}
              </div>
            )}
          </div>
        )}

        {/* Star Player — top-center, above the circle */}
        {player.isStarPlayer && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-5 cursor-pointer hover:scale-125"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsStarSpinning(true);
              setTimeout(() => setIsStarSpinning(false), 1000);
            }}
          >
            <Star
              className={`w-4 h-4 text-yellow-400 ${isStarSpinning ? 'animate-spin' : ''}`}
              fill="currentColor"
            />
          </div>
        )}

        {/* Captain's Armband — left side, vertically centered */}
        {player.isCaptain && (
          <img
            src="/armband.png"
            alt="Captain"
            className="absolute -left-4 top-[4px] w-6 h-7 object-contain hover:scale-125 transition-transform"
          />
        )}

        {/* Yellow Card — top-right corner */}
        {player.hasYellowCard && (
          <img
            src="/yellow-card.png"
            alt="Yellow Card"
            className="absolute -top-3 -right-3 w-6 h-7 object-contain hover:scale-125 transition-transform"
          />
        )}

        {/* Red Card — bottom-right corner */}
        {player.hasRedCard && (
          <img
            src="/red-card.png"
            alt="Red Card"
            className="absolute bottom-0 -right-3 w-6 h-7 object-contain hover:scale-125 transition-transform"
          />
        )}

        {/* Player Name */}
        <div
          className={`absolute transition-all duration-300 ease-in-out ${showPlayerLabels ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 overflow-hidden'}`}
          style={{
            left: '50%',
            top: '50%',
            transform: `
              translate(-50%, -50%) 
              translate(${35 * Math.sin(rotationAngle * Math.PI / 180)}px, ${35 * Math.cos(rotationAngle * Math.PI / 180)}px)
              rotate(${-rotationAngle}deg)
            `,
            transformOrigin: 'center',
          }}
        >
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
              className="bg-[#1a1a1a] text-white font-semibold mt-1 px-2 py-1 rounded border border-gray-900 max-w-[120px] text-center whitespace-nowrap overflow-hidden text-ellipsis"
            />
          ) : (
            <div style={{ background: markerBgColor, backdropFilter: 'blur(4px)', border: `4px solid ${markerBorderColor}`, color: markerBorderColor }} className="font-semibold mt-1 px-2 py-0.5 rounded-md text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
              {name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerMarker;
