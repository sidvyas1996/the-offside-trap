import React, { useState } from "react";
import type { Player } from "../../../../packages/shared";

interface PlayerMarkerProps {
    player: Player;
    scale: number;
    isDragged: boolean;
    onMouseDown: (player: Player) => void;
    editable?: boolean;
    onNameChange?: (id: number, name: string) => void;
}

const PlayerMarker: React.FC<PlayerMarkerProps> = ({
                                                       player,
                                                       scale,
                                                       isDragged,
                                                       onMouseDown,
                                                       editable = false,
                                                       onNameChange,
                                                   }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(player.name || `Player ${player.number}`);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        if (onNameChange) onNameChange(player.id, e.target.value);
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
        >
            <div className="relative flex flex-col items-center">
                <div
                    className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white font-bold text-lg"
                >
                    {player.number}
                </div>

                {/* Player Name */}
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
                        className="bg-[#1a1a1a] text-white font-semibold  mt-1 px-2 py-1 rounded border border-gray-900 w-24 text-center"
                    />
                ) : (
                    <div className="bg-[#1a1a1a] text-white font-semibold mt-1 px-2 py-1 rounded opacity-70">
                        {name}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerMarker;
