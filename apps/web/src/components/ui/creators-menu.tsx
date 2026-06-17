import React from "react";
import type { MarkerDesign } from "../../contexts/FootballFieldContext";
import type { ArrowType } from "../../../../../packages/shared/src";

import { Users, Circle, CaseSensitive, Waypoints, Eye, Sun, Moon, SplitSquareVertical, SplitSquareHorizontal, Maximize2, Minimize2, RotateCw, RotateCcw, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Trash2 } from "lucide-react";

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
    onToggleWaypoints?: () => void;
    waypointsMode?: boolean;
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
}

const COLORS = {
    field: [DEFAULT_FOOTBALL_FIELD_COLOUR, "#222"],
};

// Tiny 28×16 SVG icons representing each arrow type
const iconProps = { width: 28, height: 16, viewBox: "0 0 28 16", fill: "none" };
const PassIcon = () => (
    <svg {...iconProps}>
        <line x1="2" y1="8" x2="22" y2="8" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="4,3" />
        <polyline points="17,4 23,8 17,12" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
    </svg>
);
const DribbleIcon = () => (
    <svg {...iconProps}>
        <polyline points="2,8 7,3 12,13 17,3 22,8" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
);
const LongBallIcon = () => (
    <svg {...iconProps}>
        <path d="M 2 12 Q 13 1 24 8" stroke="#fbbf24" strokeWidth="1.8" fill="none" />
        <polyline points="19,4 24,8 20,12" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
    </svg>
);
const TargetIcon = () => (
    <svg {...iconProps}>
        <circle cx="14" cy="8" r="5" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2,2" />
        <line x1="10" y1="4" x2="18" y2="12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="4" x2="10" y2="12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const DirectRunIcon = () => (
    <svg {...iconProps}>
        <line x1="2" y1="8" x2="22" y2="8" stroke="#60a5fa" strokeWidth="2.5" />
        <polygon points="18,4 26,8 18,12" fill="#60a5fa" />
    </svg>
);
const SecondaryRunIcon = () => (
    <svg {...iconProps}>
        <line x1="2" y1="8" x2="22" y2="8" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4,3" />
        <polygon points="18,4 26,8 18,12" fill="#60a5fa" />
    </svg>
);
const CurvedRunIcon = () => (
    <svg {...iconProps}>
        <path d="M 2 13 Q 13 1 24 8" stroke="#60a5fa" strokeWidth="2.5" fill="none" />
        <polygon points="20,5 26,8 21,12" fill="#60a5fa" />
    </svg>
);
const PressRunIcon = () => (
    <svg {...iconProps}>
        <polyline points="2,8 7,3 12,13 17,3 22,8" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="18,4 26,8 18,12" fill="#60a5fa" />
    </svg>
);

const btnStyle = (active: boolean) => ({
    borderColor: active ? 'rgba(15,164,95,0.5)' : 'var(--theme-border-btn)',
    borderRadius: 10,
    backgroundColor: active ? 'rgba(94,233,160,0.20)' : 'transparent',
    color: active ? 'var(--accent-mint)' : 'var(--theme-secondary-text)',
    boxShadow: active ? '0 0 12px rgba(94,233,160,0.25)' : 'none',
});

const CreatorsMenu: React.FC<CreatorsMenuProps> = ({
    onChangeFieldColor,
    onTogglePlayerLabels,
    showPlayerLabels = true,
    onToggleMarkerType,
    markerType = 'circle',
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

    return (
        <div
            className="w-full rounded-2xl px-5 py-4 flex flex-row items-stretch gap-0"
            style={{ background: 'var(--surface-container)', border: '2px solid var(--ink)', boxShadow: 'var(--card-shadow)' }}
        >

            {/* Section 1 — Pitch Properties */}
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)] mb-2">Pitch Properties</span>
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
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Rotate</span>
                            <div className="flex flex-row items-center gap-1">
                                <Button
                                    onClick={(e) => { e.preventDefault(); onRotateLeft!(); }}
                                    className="!p-2"
                                    style={btnStyle(false)}
                                    variant="outline" type="button" title="Rotate Left"
                                >
                                    <RotateCcw size={18} />
                                </Button>
                                <span className="text-xs font-mono w-8 text-center text-[var(--theme-secondary-text)]">{rotationAngle}°</span>
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
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Tilt</span>
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
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Zoom</span>
                            <div className="flex flex-row items-center gap-1">
                                <Button
                                    onClick={(e) => { e.preventDefault(); onZoomOut!(); }}
                                    disabled={zoomLevel === 0.75}
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
            <div className="self-stretch w-px bg-[var(--theme-border)] mx-4" />

            {/* Section 2 — Player Properties */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex flex-row items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Player Properties</span>
                    {/* Team tabs — only visible when opposition mode is on */}
                    {showOpposition && onSetActiveTeam && (
                        <div className="flex flex-row items-center gap-0 rounded-md overflow-hidden border border-[var(--theme-border-btn)]">
                            <button
                                type="button"
                                onClick={() => onSetActiveTeam('home')}
                                style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                    background: activeTeam === 'home' ? 'rgba(94,233,160,0.22)' : 'transparent',
                                    color: activeTeam === 'home' ? 'var(--accent-mint)' : 'var(--theme-muted)',
                                    borderRight: '1px solid var(--theme-border-btn)',
                                    cursor: 'pointer',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >Home</button>
                            <button
                                type="button"
                                onClick={() => onSetActiveTeam('away')}
                                style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                    background: activeTeam === 'away' ? 'rgba(239,68,68,0.18)' : 'transparent',
                                    color: activeTeam === 'away' ? '#ef4444' : 'var(--theme-muted)',
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
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Style</span>
                                    <select
                                        value={activeDesign}
                                        onChange={(e) => activeOnChangeDesign(e.target.value as MarkerDesign)}
                                        style={{
                                            background: 'var(--theme-panel)',
                                            color: 'var(--theme-secondary-text)',
                                            border: '1.5px solid var(--theme-border-btn)',
                                            borderRadius: 5,
                                            padding: '2px 4px',
                                            fontSize: 11,
                                            fontWeight: 600,
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
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">
                                        {activeDesign !== 'solid' ? 'Primary' : 'BG'}
                                    </span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: activeBgColor,
                                            border: '1.5px solid var(--theme-border-btn)',
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
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">2nd</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: activeSecondaryColor,
                                            border: '1.5px solid var(--theme-border-btn)',
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
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Border</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: activeBorderColor,
                                            border: '1.5px solid var(--theme-border-btn)',
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
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Text</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: activeTextColor,
                                            border: '1.5px solid var(--theme-border-btn)',
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
                        <div className="self-stretch w-px bg-[var(--theme-border)] mx-1" />
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
                    <div className="self-stretch w-px bg-[var(--theme-border)] mx-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex flex-row items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Arrows</span>
                            <div className="flex items-center gap-2">
                                {/* Ball color */}
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }} title="Ball arrow color">
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fbbf24' }}>Ball</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{ width: 18, height: 18, borderRadius: 4, background: arrowBallColor, border: `2px solid #fbbf2466`, cursor: 'pointer' }} />
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
                                        <div style={{ width: 18, height: 18, borderRadius: 4, background: arrowRunColor, border: `2px solid #60a5fa66`, cursor: 'pointer' }} />
                                        {onChangeArrowRunColor && (
                                            <input type="color" value={arrowRunColor} onChange={e => onChangeArrowRunColor(e.target.value)}
                                                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                        )}
                                    </div>
                                </label>
                                {/* Clear all */}
                                {onClearArrows && (
                                    <button type="button" onClick={onClearArrows} title="Clear all arrows"
                                        style={{ padding: '2px 4px', borderRadius: 4, border: '1.5px solid var(--theme-border-btn)', background: 'transparent', color: 'var(--theme-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {/* Ball movement row */}
                            <div className="flex flex-row items-center gap-1">
                                <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--theme-muted)] w-8 shrink-0">Ball</span>
                                {([
                                    { type: 'pass' as ArrowType, label: 'Pass', icon: PassIcon },
                                    { type: 'dribble' as ArrowType, label: 'Carry', icon: DribbleIcon },
                                    { type: 'long-ball' as ArrowType, label: 'Long', icon: LongBallIcon },
                                    { type: 'target-zone' as ArrowType, label: 'Target', icon: TargetIcon },
                                ] as { type: ArrowType; label: string; icon: React.FC }[]).map(({ type, label, icon: Icon }) => (
                                    <button key={type} type="button" title={label}
                                        onClick={() => onSetArrowTool(arrowTool === type ? null : type)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                            padding: '3px 6px', borderRadius: 5, border: '1.5px solid',
                                            borderColor: arrowTool === type ? '#fbbf24' : 'var(--theme-border-btn)',
                                            background: arrowTool === type ? 'rgba(251,191,36,0.12)' : 'transparent',
                                            cursor: 'pointer', minWidth: 36,
                                        }}>
                                        <Icon />
                                        <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.06em', color: arrowTool === type ? '#fbbf24' : 'var(--theme-muted)', textTransform: 'uppercase' }}>{label}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Player movement row */}
                            <div className="flex flex-row items-center gap-1">
                                <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--theme-muted)] w-8 shrink-0">Run</span>
                                {([
                                    { type: 'direct-run' as ArrowType, label: 'Direct', icon: DirectRunIcon },
                                    { type: 'secondary-run' as ArrowType, label: '2nd Run', icon: SecondaryRunIcon },
                                    { type: 'curved-run' as ArrowType, label: 'Curved', icon: CurvedRunIcon },
                                    { type: 'press-run' as ArrowType, label: 'Press', icon: PressRunIcon },
                                ] as { type: ArrowType; label: string; icon: React.FC }[]).map(({ type, label, icon: Icon }) => (
                                    <button key={type} type="button" title={label}
                                        onClick={() => onSetArrowTool(arrowTool === type ? null : type)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                            padding: '3px 6px', borderRadius: 5, border: '1.5px solid',
                                            borderColor: arrowTool === type ? '#60a5fa' : 'var(--theme-border-btn)',
                                            background: arrowTool === type ? 'rgba(96,165,250,0.12)' : 'transparent',
                                            cursor: 'pointer', minWidth: 36,
                                        }}>
                                        <Icon />
                                        <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.06em', color: arrowTool === type ? '#60a5fa' : 'var(--theme-muted)', textTransform: 'uppercase' }}>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CreatorsMenu;
