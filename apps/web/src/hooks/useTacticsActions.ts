import { useEffect } from "react";
import { usePlayerDrag } from "./usePlayerDrag";
import type { Player } from "../../../../packages/shared/src";

export const useTacticsActions = (
  players: Player[],
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>,
  setActions: (actions: any) => void,
  setDraggedPlayer: (player: Player | null) => void,
  fieldRef: React.RefObject<HTMLDivElement | null>,
  handlePlayerNameChange: (id: number, name: string) => void,
  handleUpdatePlayer: (id: number, updates: Partial<Player>) => void
) => {
  // Drag-and-drop logic
  const drag = usePlayerDrag(
    players,
    setPlayers,
    { sticky: false },
    fieldRef as React.RefObject<HTMLDivElement>,
  );

  // Initialize actions
  useEffect(() => {
    setActions({
      onMouseDown: (player: Player) => {
        drag.handleMouseDown(player);
        setDraggedPlayer(player);
      },
      onMouseMove: drag.handleMouseMove,
      onMouseUp: () => {
        drag.handleMouseUp();
        setDraggedPlayer(null);
      },
      onPlayerNameChange: handlePlayerNameChange,
      onUpdatePlayer: handleUpdatePlayer,
    });
  }, [
    drag.handleMouseDown,
    drag.handleMouseMove,
    drag.handleMouseUp,
    setActions,
    setDraggedPlayer,
    handlePlayerNameChange,
    handleUpdatePlayer,
  ]);

  // Action handlers
  const handleSave = () => {
    console.log("Saving tactic...");
    // TODO: Implement save functionality
  };

  const handleLoad = () => {
    console.log("Loading tactic...");
    // TODO: Implement load functionality
  };

  const handleReset = () => {
    console.log("Resetting tactic...");
    // This will be handled by the state hook
  };

  const handleHomeColorChange = (color: string) => {
    // This will be handled by the state hook
    console.log("Home color changed to:", color);
  };

  const handleAwayColorChange = (color: string) => {
    // TODO: Implement away team color change
    console.log("Away color changed to:", color);
  };

  return {
    // Drag functionality
    drag,
    
    // Action handlers
    handleSave,
    handleLoad,
    handleReset,
    handleHomeColorChange,
    handleAwayColorChange,
  };
}; 