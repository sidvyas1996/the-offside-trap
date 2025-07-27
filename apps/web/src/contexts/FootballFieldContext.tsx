import React, { createContext, useContext, useState, useRef } from "react";
import type { Player } from "../../../../packages/shared";
import {CHARCOAL_GRAY, DEFAULT_FOOTBALL_FIELD_COLOUR} from "../utils/colors.ts";

interface FieldOptions {
    size?: "default" | "fullscreen";
    editable?: boolean;
    fieldColor?: string;
    playerColor?: string;
    disableDesign?: boolean;
    enableContextMenu?: boolean;
    showPlayerLabels?: boolean;
}

interface FieldActions {
    onMouseDown?: (player: Player) => void;
    onMouseMove?: (e: React.MouseEvent) => void;
    onMouseUp?: () => void;
    onPlayerNameChange?: (id: number, name: string) => void;
    onUpdatePlayer?: (id: number, updates: Partial<Player>) => void;
}

interface FootballFieldContextProps {
    players: Player[];
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    draggedPlayer: Player | null;
    setDraggedPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    options: FieldOptions;
    setOptions: React.Dispatch<React.SetStateAction<FieldOptions>>;
    actions: FieldActions;
    setActions: React.Dispatch<React.SetStateAction<FieldActions>>;
    fieldRef: React.RefObject<HTMLDivElement|null>;
}

const FootballFieldContext = createContext<FootballFieldContextProps | null>(null);

export const FootballFieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
    const [options, setOptions] = useState<FieldOptions>({
        size: "default",
        editable: true,
        fieldColor: DEFAULT_FOOTBALL_FIELD_COLOUR,
        playerColor: CHARCOAL_GRAY,
        enableContextMenu: true,
        showPlayerLabels: true,
    });
    const [actions, setActions] = useState<FieldActions>({});
    const fieldRef = useRef<HTMLDivElement>(null);

    return (
        <FootballFieldContext.Provider
            value={{
                players,
                setPlayers,
                draggedPlayer,
                setDraggedPlayer,
                options,
                setOptions,
                actions,
                setActions,
                fieldRef,
            }}
        >
            {children}
        </FootballFieldContext.Provider>
    );
};

export const useFootballField = () => {
    const context = useContext(FootballFieldContext);
    if (!context) {
        throw new Error("useFootballField must be used within FootballFieldProvider");
    }
    return context;
};
