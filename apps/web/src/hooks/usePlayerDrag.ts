import { useRef, useCallback } from "react";
import type { Player } from "../../../../packages/shared";
import { clientToPitchPct } from "../utils/pitch";

interface UsePlayerDragOptions {
    sticky?: boolean; // true = snap back after drag
}

export const usePlayerDrag = (
    players: Player[],
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>,
    options: UsePlayerDragOptions = { sticky: false },
    fieldRef: React.RefObject<HTMLDivElement>
) => {
    const lastUpdateRef = useRef<number>(0);
    const updateThrottle = 16; // ~60fps
    const draggedPlayerRef = useRef<Player | null>(null);
    const originalPositionRef = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = useCallback((player: Player) => {
        if (player && typeof player.x === 'number' && typeof player.y === 'number') {
            draggedPlayerRef.current = player;
            originalPositionRef.current = { x: player.x, y: player.y };
        }
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!draggedPlayerRef.current || !fieldRef.current) return;

            const mapped = clientToPitchPct(fieldRef.current, e.clientX, e.clientY);
            if (!mapped) return;
            const { x: clampedX, y: clampedY } = mapped;

            const draggedId = draggedPlayerRef.current.id;
            if (draggedId) {
                const now = performance.now();
                if (now - lastUpdateRef.current >= updateThrottle) {
                    lastUpdateRef.current = now;
                    requestAnimationFrame(() => {
                        setPlayers((prev) =>
                            prev.map((p) =>
                                p.id === draggedId ? { ...p, x: clampedX, y: clampedY } : p
                            )
                        );
                    });
                }
            }
        },
        [fieldRef, setPlayers]
    );

    const handleMouseUp = useCallback(() => {
        if (options.sticky && draggedPlayerRef.current && originalPositionRef.current) {
            const draggedId = draggedPlayerRef.current.id;
            const originalPos = originalPositionRef.current;
            
            if (originalPos && typeof originalPos.x === 'number' && typeof originalPos.y === 'number') {
                setPlayers((prev) =>
                    prev.map((p) =>
                        p.id === draggedId 
                            ? { ...p, x: originalPos.x, y: originalPos.y } 
                            : p
                    )
                );
            }
        }
        draggedPlayerRef.current = null;
        originalPositionRef.current = null;
    }, [options.sticky, setPlayers]);

    return {
        draggedPlayer: draggedPlayerRef.current,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
};
