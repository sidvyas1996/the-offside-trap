import { useEffect } from "react";
import { usePlayerDrag } from "./usePlayerDrag";
import type { Player } from "../../../../packages/shared/src";

const noop = () => {};
const noopUpdate: React.Dispatch<React.SetStateAction<Player[]>> = () => {};

export const useTacticsActions = (
  players: Player[],
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>,
  setActions: (actions: any) => void,
  setDraggedPlayer: (player: Player | null) => void,
  fieldRef: React.RefObject<HTMLDivElement | null>,
  handlePlayerNameChange: (id: number, name: string) => void,
  handleUpdatePlayer: (id: number, updates: Partial<Player>) => void,
  // Opposition (optional)
  oppositionPlayers: Player[] = [],
  setOppositionPlayers: React.Dispatch<React.SetStateAction<Player[]>> = noopUpdate,
  setOppositionActions: (actions: any) => void = noop,
  setDraggedOppositionPlayer: (player: Player | null) => void = noop,
  handleOppPlayerNameChange: (id: number, name: string) => void = noop,
  handleUpdateOppositionPlayer: (id: number, updates: Partial<Player>) => void = noop,
) => {
  // Home team drag
  const drag = usePlayerDrag(
    players,
    setPlayers,
    { sticky: false },
    fieldRef as React.RefObject<HTMLDivElement>,
  );

  // Opposition team drag
  const oppDrag = usePlayerDrag(
    oppositionPlayers,
    setOppositionPlayers,
    { sticky: false },
    fieldRef as React.RefObject<HTMLDivElement>,
  );

  // Set up home actions
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

  // Set up opposition actions
  useEffect(() => {
    setOppositionActions({
      onMouseDown: (player: Player) => {
        oppDrag.handleMouseDown(player);
        setDraggedOppositionPlayer(player);
      },
      onMouseMove: oppDrag.handleMouseMove,
      onMouseUp: () => {
        oppDrag.handleMouseUp();
        setDraggedOppositionPlayer(null);
      },
      onPlayerNameChange: handleOppPlayerNameChange,
      onUpdatePlayer: handleUpdateOppositionPlayer,
    });
  }, [
    oppDrag.handleMouseDown,
    oppDrag.handleMouseMove,
    oppDrag.handleMouseUp,
    setOppositionActions,
    setDraggedOppositionPlayer,
    handleOppPlayerNameChange,
    handleUpdateOppositionPlayer,
  ]);

  return { drag, oppDrag };
};
