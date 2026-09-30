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
    // Where the marker was caught, relative to its anchor, in pitch percent. A
    // drag moves the marker by the cursor's travel rather than dropping its
    // centre under the cursor — grabbed by the shoulder, it stays held by the
    // shoulder instead of jumping the moment the pointer comes down.
    const grabOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const handlePointerDown = useCallback(
        (player: Player, grab?: { clientX: number; clientY: number }) => {
            if (player && typeof player.x === 'number' && typeof player.y === 'number') {
                draggedPlayerRef.current = player;
                originalPositionRef.current = { x: player.x, y: player.y };
                grabOffsetRef.current = { x: 0, y: 0 };
                if (grab && fieldRef.current) {
                    const at = clientToPitchPct(fieldRef.current, grab.clientX, grab.clientY);
                    if (at) grabOffsetRef.current = { x: player.x - at.x, y: player.y - at.y };
                }
            }
        },
        [fieldRef]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!draggedPlayerRef.current || !fieldRef.current) return;

            const mapped = clientToPitchPct(fieldRef.current, e.clientX, e.clientY);
            if (!mapped) return;
            const offset = grabOffsetRef.current;
            const clampedX = Math.max(0, Math.min(100, mapped.x + offset.x));
            const clampedY = Math.max(0, Math.min(100, mapped.y + offset.y));

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

    const handlePointerUp = useCallback(() => {
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
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
    };
};
