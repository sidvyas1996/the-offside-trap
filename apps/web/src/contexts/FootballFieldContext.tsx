import React, { createContext, useContext, useState, useRef } from "react";
import type { Player, TacticArrow, ArrowType, Ball, Movement, PassSequence } from "../../../../packages/shared";
import { DEFAULT_FOOTBALL_FIELD_COLOUR, DEFAULT_PLAYER_COLOUR } from "../utils/colors.ts";

// Default lineup puts the goalkeeper at (5, 50) — ball starts at their feet
export const DEFAULT_BALL_POSITION: Ball = { x: 9, y: 50 };

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
    // Ball marker
    ball: Ball;
    setBall: React.Dispatch<React.SetStateAction<Ball>>;
    /**
     * True while an animation is being played back. Markers must drop their CSS
     * transition when this is set — the playback loop pushes a new position
     * every frame, and a 200ms ease on top of that leaves every marker chasing
     * a target it never reaches (visible as rubber-banding).
     */
    isAnimating: boolean;
    setIsAnimating: React.Dispatch<React.SetStateAction<boolean>>;
    // Gesture-authored movements — the authoring source of truth for players.
    movements: Movement[];
    setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
    /**
     * The passing move. Separate from `movements` because a pass chain is an
     * ordered sequence of one-off events, not a cyclic motion — squeezing it into
     * Movement is what once limited a tactic to a single ball action.
     */
    passes: PassSequence;
    setPasses: React.Dispatch<React.SetStateAction<PassSequence>>;
    /**
     * Loop length, mirrored here from the animation hook so gesture capture can
     * turn a dwell in milliseconds into a fraction of the loop.
     */
    loopDurationMs: number;
    setLoopDurationMs: React.Dispatch<React.SetStateAction<number>>;
    /**
     * Draw running-order badges on the arrows. On when arrows are the animation;
     * off when they are only annotation, so a static diagram stays uncluttered.
     */
    showBeats: boolean;
    setShowBeats: React.Dispatch<React.SetStateAction<boolean>>;
    /**
     * When on, dragging an object draws its movement instead of just moving it.
     * Kept as an explicit mode rather than inferred from drag length, because
     * dragging already means "reposition" here and silently changing that would
     * be surprising.
     */
    movementMode: boolean;
    setMovementMode: React.Dispatch<React.SetStateAction<boolean>>;
    // Arrow annotations
    arrows: TacticArrow[];
    setArrows: React.Dispatch<React.SetStateAction<TacticArrow[]>>;
    arrowTool: ArrowType | null;
    setArrowTool: React.Dispatch<React.SetStateAction<ArrowType | null>>;
    arrowBallColor: string;
    setArrowBallColor: React.Dispatch<React.SetStateAction<string>>;
    arrowRunColor: string;
    setArrowRunColor: React.Dispatch<React.SetStateAction<string>>;
    /**
     * The beat being authored, 1-based. A newly drawn arrow is assigned this beat,
     * which is what makes "Step, then draw" put the next arrows *after* the last
     * ones rather than alongside them.
     *
     * It lives here rather than in the page because the arrow is created down in
     * FootballField, and threading a beat down through TacticalField's prop wall
     * would mean touching every layer in between for one number.
     */
    currentBeat: number;
    setCurrentBeat: React.Dispatch<React.SetStateAction<number>>;
    /**
     * Draw every beat solid at once, rather than ghosting the ones you are not on.
     *
     * The flattened view *is* the diagram — it is what the static image export
     * shows — so it has to stay reachable while authoring a single beat.
     */
    showAllBeats: boolean;
    setShowAllBeats: React.Dispatch<React.SetStateAction<boolean>>;
    /**
     * True while the board is showing a later beat's pose rather than the authored
     * starting shape. Markers must not be draggable then: the positions on screen
     * are a computed preview, and committing a drag would write a phase-3 pose back
     * into the tactic's starting board.
     */
    previewingPhase: boolean;
    setPreviewingPhase: React.Dispatch<React.SetStateAction<boolean>>;
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
        markerSecondaryColor: '#c6f24e',
        markerDesign: 'solid',
        enableContextMenu: true,
        showPlayerLabels: true,
        markerType: 'circle', //marker
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

    // Ball marker
    const [ball, setBall] = useState<Ball>(DEFAULT_BALL_POSITION);
    const [isAnimating, setIsAnimating] = useState(false);

    // Gesture-authored movements
    const [movements, setMovements] = useState<Movement[]>([]);
    const [passes, setPasses] = useState<PassSequence>({ nodes: [] });
    const [loopDurationMs, setLoopDurationMs] = useState(5000);
    const [showBeats, setShowBeats] = useState(false);
    const [movementMode, setMovementMode] = useState(false);

    // Arrow annotations
    const [arrows, setArrows] = useState<TacticArrow[]>([]);
    const [arrowTool, setArrowTool] = useState<ArrowType | null>(null);
    const [arrowBallColor, setArrowBallColor] = useState('#fbbf24');
    const [arrowRunColor, setArrowRunColor] = useState('#60a5fa');

    // Phase authoring
    const [currentBeat, setCurrentBeat] = useState(1);
    const [showAllBeats, setShowAllBeats] = useState(false);
    const [previewingPhase, setPreviewingPhase] = useState(false);

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
                ball,
                setBall,
                isAnimating,
                setIsAnimating,
                movements,
                setMovements,
                passes,
                setPasses,
                loopDurationMs,
                setLoopDurationMs,
                showBeats,
                setShowBeats,
                movementMode,
                setMovementMode,
                arrows,
                setArrows,
                arrowTool,
                setArrowTool,
                arrowBallColor,
                setArrowBallColor,
                arrowRunColor,
                setArrowRunColor,
                currentBeat,
                setCurrentBeat,
                showAllBeats,
                setShowAllBeats,
                previewingPhase,
                setPreviewingPhase,
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
