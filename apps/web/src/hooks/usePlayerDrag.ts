import { useRef, useCallback } from "react";
import type { Player } from "../../../../packages/shared";

interface UsePlayerDragOptions {
    sticky?: boolean; // true = snap back after drag
}

export const usePlayerDrag = (
    players: Player[],
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>,
    options: UsePlayerDragOptions = { sticky: false },
    fieldRef: React.RefObject<HTMLDivElement>
) => {
    const draggedPlayerRef = useRef<Player | null>(null);

    const handleMouseDown = useCallback((player: Player) => {
        draggedPlayerRef.current = player;
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!draggedPlayerRef.current || !fieldRef.current) return;

            const rect = fieldRef.current.getBoundingClientRect();

            const newX = ((e.clientX - rect.left) / rect.width) * 100;
            const newY = ((e.clientY - rect.top) / rect.height) * 100;

            const clampedX = Math.max(0, Math.min(100, newX));
            const clampedY = Math.max(0, Math.min(100, newY));

            const draggedId = draggedPlayerRef.current.id;
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id === draggedId ? { ...p, x: clampedX, y: clampedY } : p
                )
            );
        },
        [fieldRef, setPlayers]
    );

    const handleMouseUp = useCallback(() => {
        if (options.sticky && draggedPlayerRef.current) {
            const original = draggedPlayerRef.current;
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id === original.id ? { ...p, x: original.x, y: original.y } : p
                )
            );
        }
        draggedPlayerRef.current = null;
    }, [options.sticky, setPlayers]);

    return {
        draggedPlayer: draggedPlayerRef.current,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
};
