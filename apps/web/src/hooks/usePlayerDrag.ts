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

            const el = fieldRef.current;
            const parent = el.parentElement;

            if (!parent) return;

            const parentRect = parent.getBoundingClientRect();

            // Offset of cursor from the perspective container's center
            const cx = parentRect.width / 2;
            const cy = parentRect.height / 2;
            const localX = e.clientX - parentRect.left - cx;
            const localY = e.clientY - parentRect.top - cy;

            // Read the live CSS transform matrix (rotateX + rotateZ + scale)
            // and invert it to map viewport coords back to field-local coords
            const rawTransform = window.getComputedStyle(el).transform;
            const matrix = new DOMMatrix(rawTransform === 'none' ? undefined : rawTransform);
            const inv = matrix.inverse();
            const pt = inv.transformPoint(new DOMPoint(localX, localY, 0, 1));

            // Map centered local coords back to 0–100%
            const newX = ((pt.x + parentRect.width / 2) / parentRect.width) * 100;
            const newY = ((pt.y + parentRect.height / 2) / parentRect.height) * 100;

            const clampedX = Math.max(0, Math.min(100, newX));
            const clampedY = Math.max(0, Math.min(100, newY));

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
