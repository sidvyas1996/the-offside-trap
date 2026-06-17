import React, { createContext, useContext, useState, useRef } from "react";
import type { Player, TacticArrow, ArrowType } from "../../../../packages/shared";
import { DEFAULT_FOOTBALL_FIELD_COLOUR, DEFAULT_PLAYER_COLOUR } from "../utils/colors.ts";

export type MarkerDesign = 'solid' | 'stripes' | 'diagonal-left' | 'diagonal-right' | 'horizontal-split' | 'vertical-split';

interface FieldOptions {
    size?: "default" | "fullscreen";
    editable?: boolean;
    fieldColor?: string;
    playerColor?: string;
    markerBgColor?: string;
    markerBorderColor?: string;
    markerTextColor?: string;
    markerSecondaryColor?: string;
    markerDesign?: MarkerDesign;
    enableContextMenu?: boolean;
    showPlayerLabels?: boolean;
    markerType?: 'circle' | 'shirt';
    /** Kit atlas applied to 3D shirt markers (octa layout); plain grey when unset */
    shirtTextureUrl?: string;
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
    // Opposition team
    oppositionPlayers: Player[];
    setOppositionPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    draggedOppositionPlayer: Player | null;
    setDraggedOppositionPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    oppositionOptions: FieldOptions;
    setOppositionOptions: React.Dispatch<React.SetStateAction<FieldOptions>>;
    oppositionActions: FieldActions;
    setOppositionActions: React.Dispatch<React.SetStateAction<FieldActions>>;
    showOpposition: boolean;
    setShowOpposition: React.Dispatch<React.SetStateAction<boolean>>;
    // Arrow annotations
    arrows: TacticArrow[];
    setArrows: React.Dispatch<React.SetStateAction<TacticArrow[]>>;
    arrowTool: ArrowType | null;
    setArrowTool: React.Dispatch<React.SetStateAction<ArrowType | null>>;
    arrowBallColor: string;
    setArrowBallColor: React.Dispatch<React.SetStateAction<string>>;
    arrowRunColor: string;
    setArrowRunColor: React.Dispatch<React.SetStateAction<string>>;
}

const FootballFieldContext = createContext<FootballFieldContextProps | null>(null);

export const FootballFieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
    const [options, setOptions] = useState<FieldOptions>({
        size: "default",
        editable: true,
        fieldColor: DEFAULT_FOOTBALL_FIELD_COLOUR,
        playerColor: DEFAULT_PLAYER_COLOUR,
        markerBgColor: '#fbf5e9',     // cream fill
        markerBorderColor: '#c6f24e', // Pitch Lime ring
        markerTextColor: '#15140f',   // Kit Black number
        markerSecondaryColor: '#c6f24f',
        markerDesign: 'solid',
        enableContextMenu: true,
        showPlayerLabels: true,
        markerType: 'circle',
    });
    const [actions, setActions] = useState<FieldActions>({});
    const fieldRef = useRef<HTMLDivElement>(null);

    // Opposition team state
    const [oppositionPlayers, setOppositionPlayers] = useState<Player[]>([]);
    const [draggedOppositionPlayer, setDraggedOppositionPlayer] = useState<Player | null>(null);
    const [oppositionOptions, setOppositionOptions] = useState<FieldOptions>({
        editable: true,
        markerBgColor: '#fbf5e9',     // cream fill
        markerBorderColor: '#ff6fae', // Striker Pink ring
        markerTextColor: '#15140f',   // Kit Black number
        markerSecondaryColor: '#ff6fae',
        markerDesign: 'solid',
        enableContextMenu: true,
        showPlayerLabels: true,
        markerType: 'circle',
    });
    const [oppositionActions, setOppositionActions] = useState<FieldActions>({});
    const [showOpposition, setShowOpposition] = useState(false);

    // Arrow annotations
    const [arrows, setArrows] = useState<TacticArrow[]>([]);
    const [arrowTool, setArrowTool] = useState<ArrowType | null>(null);
    const [arrowBallColor, setArrowBallColor] = useState('#fbbf24');
    const [arrowRunColor, setArrowRunColor] = useState('#60a5fa');

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
                oppositionPlayers,
                setOppositionPlayers,
                draggedOppositionPlayer,
                setDraggedOppositionPlayer,
                oppositionOptions,
                setOppositionOptions,
                oppositionActions,
                setOppositionActions,
                showOpposition,
                setShowOpposition,
                arrows,
                setArrows,
                arrowTool,
                setArrowTool,
                arrowBallColor,
                setArrowBallColor,
                arrowRunColor,
                setArrowRunColor,
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
