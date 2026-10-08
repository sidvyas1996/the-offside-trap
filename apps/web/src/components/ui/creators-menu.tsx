import React from "react";
import { ARROW_TOOLS, BALL_TOOLS, RUN_TOOLS, BEND_HINT } from "../tactics/arrow-tools";
import type { MarkerDesign } from "../../contexts/FootballFieldContext";
import type { ArrowType } from "../../../../../packages/shared/src";

import { Users, Circle, CaseSensitive, Waypoints, Eye, Sun, Moon, SplitSquareVertical, SplitSquareHorizontal, Maximize2, Minimize2, RotateCw, RotateCcw, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Trash2, Hash } from "lucide-react";

const HangerIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor">
    <path d="M480-800q33 0 56.5 23.5T560-720q0 24-13 44t-35 29v56l282 243q19 16 19 40t-19 40q-10 8-22 8H108q-12 0-22-8-19-16-19-40t19-40l282-243v-56q-22-9-35-29t-13-44q0-33 23.5-56.5T480-800Z"/>
  </svg>
);
import {Button} from "./button.tsx";
import {DEFAULT_FOOTBALL_FIELD_COLOUR} from "../../utils/colors.ts";

interface CreatorsMenuProps {
    onChangeFieldColor: (color: string) => void;
    onChangePlayerColor: (color: string) => void;
    markerBgColor?: string;
    markerBorderColor?: string;
    markerTextColor?: string;
    markerSecondaryColor?: string;
    markerDesign?: MarkerDesign;
    onChangeMarkerBgColor?: (color: string) => void;
    onChangeMarkerBorderColor?: (color: string) => void;
    onChangeMarkerTextColor?: (color: string) => void;
    onChangeMarkerSecondaryColor?: (color: string) => void;
    onChangeMarkerDesign?: (design: MarkerDesign) => void;
    onTogglePlayerLabels?: () => void;
    showPlayerLabels?: boolean;
    onToggleMarkerType?: () => void;
    markerType?: 'circle' | 'shirt';
    onToggleShirtNumbers?: () => void;
    showShirtNumbers?: boolean;
    onToggleWaypoints?: () => void;
    waypointsMode?: boolean;
    onToggleMovementMode?: () => void;
    movementMode?: boolean;
    onToggleFieldOfView?: () => void;
    fieldOfViewMode?: boolean;

    onToggleHorizontalZones?: () => void;
    horizontalZonesMode?: boolean;
    onToggleVerticalSpaces?: () => void;
    verticalSpacesMode?: boolean;
    onToggleFullScreen?: () => void;
    isFullScreen?: boolean;
    rotationAngle?: number;
    tiltAngle?: number;
    zoomLevel?: number;
    onRotateLeft?: () => void;
    onRotateRight?: () => void;
    onTiltUp?: () => void;
    onTiltDown?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    showSingleMarkerHint?: boolean;

    // Arrow tools
    arrowTool?: ArrowType | null;
    onSetArrowTool?: (tool: ArrowType | null) => void;
    arrowBallColor?: string;
    onChangeArrowBallColor?: (color: string) => void;
    arrowRunColor?: string;
    onChangeArrowRunColor?: (color: string) => void;
    onClearArrows?: () => void;

    // Opposition team
    showOpposition?: boolean;
    activeTeam?: 'home' | 'away';
    onSetActiveTeam?: (team: 'home' | 'away') => void;
    // Away team marker props (shown when activeTeam === 'away')
    oppMarkerBgColor?: string;
    oppMarkerBorderColor?: string;
    oppMarkerTextColor?: string;
    oppMarkerSecondaryColor?: string;
    oppMarkerDesign?: MarkerDesign;
    onChangeOppMarkerBgColor?: (color: string) => void;
    onChangeOppMarkerBorderColor?: (color: string) => void;
    onChangeOppMarkerTextColor?: (color: string) => void;
    onChangeOppMarkerSecondaryColor?: (color: string) => void;
    onChangeOppMarkerDesign?: (design: MarkerDesign) => void;
    onOppTogglePlayerLabels?: () => void;
    oppShowPlayerLabels?: boolean;
    onOppToggleMarkerType?: () => void;
    oppMarkerType?: 'circle' | 'shirt';
    onOppToggleShirtNumbers?: () => void;
    oppShowShirtNumbers?: boolean;
}

const COLORS = {
    field: [DEFAULT_FOOTBALL_FIELD_COLOUR, "#222"],
};

/* Toolbar button: violet chip at rest, green with the hard shadow when active. */
const btnStyle = (active: boolean): React.CSSProperties => ({
    borderColor: 'var(--ink)',
    borderRadius: 10,
    backgroundColor: active ? 'var(--primary)' : 'var(--surface-high)',
    color: active ? 'var(--on-primary)' : 'var(--on-surface)',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
});

/* Small select / swatch chrome inside the toolbar */
const controlChrome: React.CSSProperties = {
    background: 'var(--surface-high)',
    border: 'var(--border-w) solid var(--ink)',
    borderRadius: 6,
};

const CreatorsMenu: React.FC<CreatorsMenuProps> = ({
    onChangeFieldColor,
    onTogglePlayerLabels,
    showPlayerLabels = true,
    onToggleMarkerType,
    markerType = 'circle',
    onToggleShirtNumbers,
    showShirtNumbers = false,
    markerBgColor = '#111827',
    markerBorderColor = '#ffffff',
    markerTextColor = '#ffffff',
    markerSecondaryColor = '#ffffff',
    markerDesign = 'solid',
    onChangeMarkerBgColor,
    onChangeMarkerBorderColor,
    onChangeMarkerTextColor,
    onChangeMarkerSecondaryColor,
    onChangeMarkerDesign,
    onToggleWaypoints,
    waypointsMode = false,
    onToggleMovementMode,
    movementMode = false,
    onToggleFieldOfView,
    fieldOfViewMode = false,
    onToggleHorizontalZones,
    horizontalZonesMode = false,
    onToggleVerticalSpaces,
    verticalSpacesMode = false,
    onToggleFullScreen,
    isFullScreen = false,
    rotationAngle = 0,
    tiltAngle = 20,
    zoomLevel = 1.0,
    onRotateLeft,
    onRotateRight,
    onTiltUp,
    onTiltDown,
    onZoomIn,
    onZoomOut,
    showSingleMarkerHint = false,
    arrowTool = null,
    onSetArrowTool,
    arrowBallColor = '#fbbf24',
    onChangeArrowBallColor,
    arrowRunColor = '#60a5fa',
    onChangeArrowRunColor,
    onClearArrows,
    showOpposition = false,
    activeTeam = 'home',
    onSetActiveTeam,
    oppMarkerBgColor = '#7f1d1d',
    oppMarkerBorderColor = '#ef4444',
    oppMarkerTextColor = '#ffffff',
    oppMarkerSecondaryColor = '#ef4444',
    oppMarkerDesign = 'solid',
    onChangeOppMarkerBgColor,
    onChangeOppMarkerBorderColor,
    onChangeOppMarkerTextColor,
    onChangeOppMarkerSecondaryColor,
    onChangeOppMarkerDesign,
    onOppTogglePlayerLabels,
    oppShowPlayerLabels = true,
    onOppToggleMarkerType,
    oppMarkerType = 'circle',
    onOppToggleShirtNumbers,
    oppShowShirtNumbers = false,
}) => {
    const [isDark, setIsDark] = React.useState(false);
    const handleToggleFieldColor = (e: React.MouseEvent) => {
        e.preventDefault();
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        onChangeFieldColor(COLORS.field[newIsDark ? 1 : 0]);
    };

    // Resolve which team's props to show in the Player Properties section
    const isAway = showOpposition && activeTeam === 'away';
    const activeBgColor = isAway ? oppMarkerBgColor : markerBgColor;
    const activeBorderColor = isAway ? oppMarkerBorderColor : markerBorderColor;
    const activeTextColor = isAway ? oppMarkerTextColor : markerTextColor;
    const activeSecondaryColor = isAway ? oppMarkerSecondaryColor : markerSecondaryColor;
    const activeDesign = isAway ? oppMarkerDesign : markerDesign;
    const activeShowLabels = isAway ? oppShowPlayerLabels : showPlayerLabels;
    const activeMarkerType = isAway ? oppMarkerType : markerType;
    const activeOnChangeBg = isAway ? onChangeOppMarkerBgColor : onChangeMarkerBgColor;
    const activeOnChangeBorder = isAway ? onChangeOppMarkerBorderColor : onChangeMarkerBorderColor;
    const activeOnChangeText = isAway ? onChangeOppMarkerTextColor : onChangeMarkerTextColor;
    const activeOnChangeSecondary = isAway ? onChangeOppMarkerSecondaryColor : onChangeMarkerSecondaryColor;
    const activeOnChangeDesign = isAway ? onChangeOppMarkerDesign : onChangeMarkerDesign;
    const activeOnToggleLabels = isAway ? onOppTogglePlayerLabels : onTogglePlayerLabels;
    const activeOnToggleMarkerType = isAway ? onOppToggleMarkerType : onToggleMarkerType;
    const activeShowShirtNumbers = isAway ? oppShowShirtNumbers : showShirtNumbers;
    const activeOnToggleShirtNumbers = isAway ? onOppToggleShirtNumbers : onToggleShirtNumbers;

    return (
        <div
            /* Stacks below md: the three sections are a horizontal toolbar with
               vertical rules on desktop, which cannot fit a phone's width side by
               side. md matches MOBILE_BREAKPOINT in hooks/useMediaQuery.ts. */
            className="w-full rounded-2xl px-5 py-4 flex flex-col md:flex-row items-stretch gap-4 md:gap-0"
            style={{ background: 'var(--surface-container)', border: 'var(--border-w) solid var(--ink)', boxShadow: 'var(--card-shadow)' }}
        >

            {/* Section 1 — Pitch Properties */}
            <div className="flex flex-col flex-1 min-w-0">
                <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)] mb-2">Pitch Properties</span>
                <div className="flex flex-row items-center gap-1.5 flex-wrap">
                    {/* Field color toggle */}
                    <Button
                        onClick={handleToggleFieldColor}
                        className="!p-2"
                        style={btnStyle(false)}
                        variant="outline" type="button" title={isDark ? "Switch to Light Field" : "Switch to Dark Field"}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </Button>

                    {/* Horizontal Zones toggle */}
                    {onToggleHorizontalZones && (
                        <Button
                            onClick={(e) => { e.preventDefault(); onToggleHorizontalZones(); }}
                            className="!p-2"
                            style={btnStyle(horizontalZonesMode)}
                            variant="outline" type="button" title={horizontalZonesMode ? "Hide Horizontal Zones" : "Show Horizontal Zones"}
                        >
                            <SplitSquareHorizontal size={18} />
                        </Button>
                    )}

                    {/* Vertical Spaces toggle */}
                    {onToggleVerticalSpaces && (
                        <Button
                            onClick={(e) => { e.preventDefault(); onToggleVerticalSpaces(); }}
                            className="!p-2"
                            style={btnStyle(verticalSpacesMode)}
                            variant="outline" type="button" title={verticalSpacesMode ? "Hide Vertical Spaces" : "Show Vertical Spaces"}
                        >
                            <SplitSquareVertical size={18} />
                        </Button>
                    )}

                    {/* Fullscreen toggle */}
                    {onToggleFullScreen && (
                        <Button
                            onClick={(e) => { e.preventDefault(); onToggleFullScreen(); }}
                            className="!p-2"
                            style={btnStyle(isFullScreen)}
                            variant="outline" type="button" title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                        >
                            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </Button>
                    )}

                    {/* Rotate sub-group */}
                    {onRotateLeft && onRotateRight && (
                        <div className="flex flex-col gap-1">
                            <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">Rotate</span>
                            <div className="flex flex-row items-center gap-1">
                                <Button
                                    onClick={(e) => { e.preventDefault(); onRotateLeft!(); }}
                                    className="!p-2"
                                    style={btnStyle(false)}
                                    variant="outline" type="button" title="Rotate Left"
                                >
                                    <RotateCcw size={18} />
                                </Button>
                                {/* The stored angle runs on past 360 so the board
                                    never animates the long way round a wrap; the
                                    readout shows the bearing it settles on. */}
                                <span className="text-xs font-mono w-8 text-center text-[var(--theme-secondary-text)]">{((Math.round(rotationAngle) % 360) + 360) % 360}°</span>
                                <Button
                                    onClick={(e) => { e.preventDefault(); onRotateRight!(); }}
                                    className="!p-2"
                                    style={btnStyle(false)}
                                    variant="outline" type="button" title="Rotate Right"
                                >
                                    <RotateCw size={18} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Tilt sub-group */}
                    {onTiltUp && onTiltDown && (
                        <div className="flex flex-col gap-1">
                            <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">Tilt</span>
                            <div className="flex flex-row items-center gap-1">
                                <Button
                                    onClick={(e) => { e.preventDefault(); onTiltUp!(); }}
                                    className="!p-2"
                                    style={btnStyle(false)}
                                    variant="outline" type="button" title="Tilt Up"
                                >
                                    <ChevronUp size={18} />
                                </Button>
                                <span className="text-xs font-mono w-8 text-center text-[var(--theme-secondary-text)]">{tiltAngle}°</span>
                                <Button
                                    onClick={(e) => { e.preventDefault(); onTiltDown!(); }}
                                    className="!p-2"
                                    style={btnStyle(false)}
                                    variant="outline" type="button" title="Tilt Down"
                                >
                                    <ChevronDown size={18} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Zoom sub-group */}
                    {onZoomIn && onZoomOut && (
                        <div className="flex flex-col gap-1">
                            <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">Zoom</span>
                            <div className="flex flex-row items-center gap-1">
                                <Button
                                    onClick={(e) => { e.preventDefault(); onZoomOut!(); }}
                                    disabled={zoomLevel <= 0.75}
                                    className="!p-2"
                                    style={btnStyle(false)}
                                    variant="outline" type="button" title="Zoom Out"
                                >
                                    <ZoomOut size={18} />
                                </Button>
                                <span className="text-xs font-mono w-8 text-center text-[var(--theme-secondary-text)]">{Math.round(zoomLevel * 100)}%</span>
                                <Button
                                    onClick={(e) => { e.preventDefault(); onZoomIn!(); }}
                                    disabled={zoomLevel >= 1.5}
                                    className="!p-2"
                                    style={btnStyle(false)}
                                    variant="outline" type="button" title="Zoom In"
                                >
                                    <ZoomIn size={18} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Vertical divider */}
            <div className="self-stretch h-px w-full md:h-auto md:w-px bg-[var(--ink)] md:mx-4" />

            {/* Section 2 — Player Properties */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex flex-row items-center justify-between mb-2">
                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">Player Properties</span>
                    {/* Team tabs — only visible when opposition mode is on */}
                    {showOpposition && onSetActiveTeam && (
                        <div className="flex flex-row items-center gap-0 overflow-hidden" style={{ borderRadius: 8, border: 'var(--border-w) solid var(--ink)', background: 'var(--surface-low)' }}>
                            <button
                                type="button"
                                onClick={() => onSetActiveTeam('home')}
                                style={{
                                    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, padding: '3px 9px',
                                    background: activeTeam === 'home' ? 'var(--primary)' : 'transparent',
                                    color: activeTeam === 'home' ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                                    borderRight: 'var(--border-w) solid var(--ink)',
                                    cursor: 'pointer',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >Home</button>
                            <button
                                type="button"
                                onClick={() => onSetActiveTeam('away')}
                                style={{
                                    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, padding: '3px 9px',
                                    background: activeTeam === 'away' ? 'var(--whistle-orange)' : 'transparent',
                                    color: activeTeam === 'away' ? 'var(--ink)' : 'var(--on-surface-variant)',
                                    cursor: 'pointer',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >Away</button>
                        </div>
                    )}
                </div>
                <div className="flex flex-row items-center gap-1.5 flex-wrap">
                    {/* Design dropdown + color pickers group */}
                    {(activeOnChangeDesign || activeOnChangeBg || activeOnChangeBorder || activeOnChangeText) && (
                        <div className="flex flex-row items-center gap-2">
                            {activeOnChangeDesign && (
                                <label className="flex flex-row items-center gap-1">
                                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">Style</span>
                                    <select
                                        value={activeDesign}
                                        onChange={(e) => activeOnChangeDesign(e.target.value as MarkerDesign)}
                                        style={{
                                            ...controlChrome,
                                            color: 'var(--on-surface)',
                                            padding: '2px 4px',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            height: 24,
                                            outline: 'none',
                                        }}
                                    >
                                        <option value="solid">Solid</option>
                                        <option value="stripes">Stripes</option>
                                        <option value="diagonal-left">Diag ╲</option>
                                        <option value="diagonal-right">Diag ╱</option>
                                        <option value="horizontal-split">H Split</option>
                                        <option value="vertical-split">V Split</option>
                                    </select>
                                </label>
                            )}
                            {activeOnChangeBg && (
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }}>
                                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">
                                        {activeDesign !== 'solid' ? 'Primary' : 'BG'}
                                    </span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: activeBgColor,
                                            border: 'var(--border-w) solid var(--ink)',
                                            cursor: 'pointer',
                                        }} />
                                        <input
                                            type="color"
                                            value={activeBgColor}
                                            onChange={(e) => activeOnChangeBg(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </label>
                            )}
                            {activeOnChangeSecondary && activeDesign !== 'solid' && (
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }}>
                                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">2nd</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: activeSecondaryColor,
                                            border: 'var(--border-w) solid var(--ink)',
                                            cursor: 'pointer',
                                        }} />
                                        <input
                                            type="color"
                                            value={activeSecondaryColor}
                                            onChange={(e) => activeOnChangeSecondary(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </label>
                            )}
                            {activeOnChangeBorder && (
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }}>
                                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">Border</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: activeBorderColor,
                                            border: 'var(--border-w) solid var(--ink)',
                                            cursor: 'pointer',
                                        }} />
                                        <input
                                            type="color"
                                            value={activeBorderColor}
                                            onChange={(e) => activeOnChangeBorder(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </label>
                            )}
                            {activeOnChangeText && (
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }}>
                                    <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">Text</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: activeTextColor,
                                            border: 'var(--border-w) solid var(--ink)',
                                            cursor: 'pointer',
                                        }} />
                                        <input
                                            type="color"
                                            value={activeTextColor}
                                            onChange={(e) => activeOnChangeText(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </label>
                            )}
                        </div>
                    )}
                    {/* Divider between colors and buttons */}
                    {(activeOnChangeDesign || activeOnChangeBg || activeOnChangeBorder || activeOnChangeText) &&
                     (onToggleWaypoints || activeOnToggleMarkerType || activeOnToggleLabels) && (
                        <div className="self-stretch w-px bg-[var(--ink)] mx-1" />
                    )}
                    {/* Waypoints only for home team */}
                    {!isAway && onToggleWaypoints && (
                        <Button
                            onClick={(e) => { e.preventDefault(); onToggleWaypoints(); }}
                            className="!p-2"
                            style={btnStyle(waypointsMode)}
                            variant="outline" type="button" title={waypointsMode ? "Exit Waypoints Mode" : "Enter Waypoints Mode"}
                        >
                            <Waypoints size={18} />
                        </Button>
                    )}
                    {activeOnToggleMarkerType && (
                        <Button
                            onClick={(e) => { e.preventDefault(); activeOnToggleMarkerType(); }}
                            className="!p-2"
                            style={btnStyle(false)}
                            variant="outline" type="button" title={activeMarkerType === 'circle' ? "Switch to Shirt Markers" : "Switch to Circle Markers"}
                        >
                            {activeMarkerType === 'circle' ? <HangerIcon size={18} /> : <Circle size={18} />}
                        </Button>
                    )}
                    {/* Circle markers always carry their number, so this only
                        applies once the markers are shirts. */}
                    {activeMarkerType === 'shirt' && activeOnToggleShirtNumbers && (
                        <Button
                            onClick={(e) => { e.preventDefault(); activeOnToggleShirtNumbers(); }}
                            className="!p-2"
                            style={btnStyle(activeShowShirtNumbers)}
                            variant="outline" type="button"
                            title={activeShowShirtNumbers ? "Hide Numbers On Shirts" : "Show Numbers On Shirts"}
                        >
                            <Hash size={18} />
                        </Button>
                    )}
                    {activeOnToggleLabels && (
                        <Button
                            onClick={(e) => { e.preventDefault(); activeOnToggleLabels(); }}
                            className="!p-2"
                            style={btnStyle(activeShowLabels)}
                            variant="outline" type="button" title={activeShowLabels ? "Hide Player Labels" : "Show Player Labels"}
                        >
                            <Users size={18} />
                            {activeShowLabels && <CaseSensitive size={18} className="ml-1" />}
                        </Button>
                    )}
                    {/* FOV only for home team */}
                    {!isAway && onToggleFieldOfView && (
                        <Button
                            onClick={(e) => { e.preventDefault(); onToggleFieldOfView(); }}
                            className="!p-2"
                            style={btnStyle(fieldOfViewMode)}
                            variant="outline" type="button" title={fieldOfViewMode ? "Hide Field of View" : "Show Field of View (120°)"}
                        >
                            <Eye size={18} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Section 3 — Arrows */}
            {onSetArrowTool && (
                <>
                    <div className="self-stretch h-px w-full md:h-auto md:w-px bg-[var(--ink)] md:mx-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex flex-row items-center justify-between mb-2">
                            <span style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--theme-muted)]">Arrows</span>
                            <div className="flex items-center gap-2">
                                {/* Ball color */}
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }} title="Ball arrow color">
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fbbf24' }}>Ball</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{ width: 22, height: 22, borderRadius: 6, background: arrowBallColor, border: 'var(--border-w) solid var(--ink)', cursor: 'pointer' }} />
                                        {onChangeArrowBallColor && (
                                            <input type="color" value={arrowBallColor} onChange={e => onChangeArrowBallColor(e.target.value)}
                                                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                        )}
                                    </div>
                                </label>
                                {/* Run color */}
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }} title="Player run arrow color">
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#60a5fa' }}>Run</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{ width: 22, height: 22, borderRadius: 6, background: arrowRunColor, border: 'var(--border-w) solid var(--ink)', cursor: 'pointer' }} />
                                        {onChangeArrowRunColor && (
                                            <input type="color" value={arrowRunColor} onChange={e => onChangeArrowRunColor(e.target.value)}
                                                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                        )}
                                    </div>
                                </label>
                                {/* Clear all */}
                                {onClearArrows && (
                                    <button type="button" onClick={onClearArrows} title="Clear all arrows"
                                        className="tool-btn"
                                        style={{ padding: '4px 8px' }}>
                                        <Trash2 size={12} /> Clear
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {/* Ball movement row */}
                            <div className="flex flex-row items-center gap-1">
                                <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--theme-muted)] w-8 shrink-0">Ball</span>
                                {BALL_TOOLS.map(({ type, label, title, icon: Icon }) => (
                                    <button key={type} type="button" title={title}
                                        onClick={() => onSetArrowTool(arrowTool === type ? null : type)}
                                        className={`tool-btn${arrowTool === type ? ' active' : ''}`}
                                        style={{ flexDirection: 'column', gap: 2, padding: '3px 6px', minWidth: 40 }}>
                                        <Icon />
                                        <span style={{ fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Player movement row */}
                            <div className="flex flex-row items-center gap-1">
                                <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--theme-muted)] w-8 shrink-0">Run</span>
                                {RUN_TOOLS.map(({ type, label, title, icon: Icon }) => (
                                    <button key={type} type="button" title={title}
                                        onClick={() => onSetArrowTool(arrowTool === type ? null : type)}
                                        className={`tool-btn${arrowTool === type ? ' active' : ''}`}
                                        style={{ flexDirection: 'column', gap: 2, padding: '3px 6px', minWidth: 40 }}>
                                        <Icon />
                                        <span style={{ fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                                    </button>
                                ))}
                            </div>
                            {ARROW_TOOLS.some(t => t.curved && t.type === arrowTool) && (
                                <span className="text-[9px] text-[var(--theme-muted)]">{BEND_HINT}</span>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CreatorsMenu;
