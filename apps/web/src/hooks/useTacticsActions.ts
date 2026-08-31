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
      onPointerDown: (player: Player) => {
        drag.handlePointerDown(player);
        setDraggedPlayer(player);
      },
      onPointerMove: drag.handlePointerMove,
      onPointerUp: () => {
        drag.handlePointerUp();
        setDraggedPlayer(null);
      },
      onPlayerNameChange: handlePlayerNameChange,
      onUpdatePlayer: handleUpdatePlayer,
    });
  }, [
    drag.handlePointerDown,
    drag.handlePointerMove,
    drag.handlePointerUp,
    setActions,
    setDraggedPlayer,
    handlePlayerNameChange,
    handleUpdatePlayer,
  ]);

  // Set up opposition actions
  useEffect(() => {
    setOppositionActions({
      onPointerDown: (player: Player) => {
        oppDrag.handlePointerDown(player);
        setDraggedOppositionPlayer(player);
      },
      onPointerMove: oppDrag.handlePointerMove,
      onPointerUp: () => {
        oppDrag.handlePointerUp();
        setDraggedOppositionPlayer(null);
      },
      onPlayerNameChange: handleOppPlayerNameChange,
      onUpdatePlayer: handleUpdateOppositionPlayer,
    });
  }, [
    oppDrag.handlePointerDown,
    oppDrag.handlePointerMove,
    oppDrag.handlePointerUp,
    setOppositionActions,
    setDraggedOppositionPlayer,
    handleOppPlayerNameChange,
    handleUpdateOppositionPlayer,
  ]);

  return { drag, oppDrag };
};
