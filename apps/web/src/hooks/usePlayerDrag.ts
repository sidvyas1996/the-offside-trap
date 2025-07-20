import { useRef, useState } from "react";
import type { Player } from "../../../../packages/shared";

interface UsePlayerDragOptions {
    sticky?: boolean; // true = snap back to original position
}

export function usePlayerDrag(players: Player[], setPlayers: (p: Player[]) => void, options: UsePlayerDragOptions = {}) {
    const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [originalPositions, setOriginalPositions] = useState<{ [key: number]: { x: number; y: number } }>({});
    const fieldRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (player: Player) => {
        setDraggedPlayer(player);
        setIsDragging(true);

        if (options.sticky) {
            setOriginalPositions((prev) => ({
                ...prev,
                [player.id]: { x: player.x, y: player.y },
            }));
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !draggedPlayer || !fieldRef.current) return;

        const rect = fieldRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setPlayers(
            players.map((p) =>
                p.id === draggedPlayer.id ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : p
            )
        );
    };

    const handleMouseUp = () => {
        if (draggedPlayer && options.sticky) {
            const original = originalPositions[draggedPlayer.id];
            if (original) {
                setPlayers(
                    players.map((p) =>
                        p.id === draggedPlayer.id ? { ...p, x: original.x, y: original.y } : p
                    )
                );
            }
        }
        setIsDragging(false);
        setDraggedPlayer(null);
    };

    return {
        draggedPlayer,
        fieldRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}
