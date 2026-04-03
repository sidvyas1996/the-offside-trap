import React from "react";
import type { MarkerDesign } from "../../contexts/FootballFieldContext";

import { Users, Circle, Shirt, CaseSensitive, Waypoints, Eye, Sun, Moon, SplitSquareVertical, SplitSquareHorizontal, Maximize2, Minimize2, RotateCw, RotateCcw, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Info } from "lucide-react";

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
}

const COLORS = {
    field: [DEFAULT_FOOTBALL_FIELD_COLOUR, "#222"],
};

const btnStyle = (active: boolean) => ({
    borderColor: active ? '#16A34A' : 'var(--theme-border-btn)',
    borderRadius: 6,
    backgroundColor: active ? 'rgba(22,163,74,0.12)' : 'transparent',
    color: 'var(--theme-secondary-text)',
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
}) => {
    const [isDark, setIsDark] = React.useState(false);
    const handleToggleFieldColor = (e: React.MouseEvent) => {
        e.preventDefault();
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        onChangeFieldColor(COLORS.field[newIsDark ? 1 : 0]);
    };

    return (
        <div className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-4 py-3 flex flex-row items-stretch gap-0">

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
                                    disabled={zoomLevel === 1.2}
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
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)] mb-2">Player Properties</span>
                <div className="flex flex-row items-center gap-1.5 flex-wrap">
                    {/* Design dropdown + color pickers group */}
                    {(onChangeMarkerDesign || onChangeMarkerBgColor || onChangeMarkerBorderColor || onChangeMarkerTextColor) && (
                        <div className="flex flex-row items-center gap-2">
                            {onChangeMarkerDesign && (
                                <label className="flex flex-row items-center gap-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Style</span>
                                    <select
                                        value={markerDesign}
                                        onChange={(e) => onChangeMarkerDesign(e.target.value as MarkerDesign)}
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
                            {onChangeMarkerBgColor && (
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }}>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">
                                        {markerDesign !== 'solid' ? 'Primary' : 'BG'}
                                    </span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: markerBgColor,
                                            border: '1.5px solid var(--theme-border-btn)',
                                            cursor: 'pointer',
                                        }} />
                                        <input
                                            type="color"
                                            value={markerBgColor}
                                            onChange={(e) => onChangeMarkerBgColor(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </label>
                            )}
                            {onChangeMarkerSecondaryColor && markerDesign !== 'solid' && (
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }}>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">2nd</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: markerSecondaryColor,
                                            border: '1.5px solid var(--theme-border-btn)',
                                            cursor: 'pointer',
                                        }} />
                                        <input
                                            type="color"
                                            value={markerSecondaryColor}
                                            onChange={(e) => onChangeMarkerSecondaryColor(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </label>
                            )}
                            {onChangeMarkerBorderColor && (
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }}>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Border</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: markerBorderColor,
                                            border: '1.5px solid var(--theme-border-btn)',
                                            cursor: 'pointer',
                                        }} />
                                        <input
                                            type="color"
                                            value={markerBorderColor}
                                            onChange={(e) => onChangeMarkerBorderColor(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </label>
                            )}
                            {onChangeMarkerTextColor && (
                                <label className="flex flex-row items-center gap-1" style={{ cursor: 'pointer' }}>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">Text</span>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 5,
                                            background: markerTextColor,
                                            border: '1.5px solid var(--theme-border-btn)',
                                            cursor: 'pointer',
                                        }} />
                                        <input
                                            type="color"
                                            value={markerTextColor}
                                            onChange={(e) => onChangeMarkerTextColor(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                        />
                                    </div>
                                </label>
                            )}
                        </div>
                    )}
                    {/* Divider between colors and buttons */}
                    {(onChangeMarkerDesign || onChangeMarkerBgColor || onChangeMarkerBorderColor || onChangeMarkerTextColor) &&
                     (onToggleWaypoints || onToggleMarkerType || onTogglePlayerLabels) && (
                        <div className="self-stretch w-px bg-[var(--theme-border)] mx-1" />
                    )}
                    {onToggleWaypoints && (
                        <Button
                            onClick={(e) => { e.preventDefault(); onToggleWaypoints(); }}
                            className="!p-2"
                            style={btnStyle(waypointsMode)}
                            variant="outline" type="button" title={waypointsMode ? "Exit Waypoints Mode" : "Enter Waypoints Mode"}
                        >
                            <Waypoints size={18} />
                        </Button>
                    )}
                    {onToggleMarkerType && (
                        <Button
                            onClick={(e) => { e.preventDefault(); onToggleMarkerType(); }}
                            className="!p-2"
                            style={btnStyle(false)}
                            variant="outline" type="button" title={markerType === 'circle' ? "Switch to Shirt Markers" : "Switch to Circle Markers"}
                        >
                            {markerType === 'circle' ? <HangerIcon size={18} /> : <Circle size={18} />}
                        </Button>
                    )}
                    {onTogglePlayerLabels && (
                        <Button
                            onClick={(e) => { e.preventDefault(); onTogglePlayerLabels(); }}
                            className="!p-2"
                            style={btnStyle(showPlayerLabels)}
                            variant="outline" type="button" title={showPlayerLabels ? "Hide Player Labels" : "Show Player Labels"}
                        >
                            <Users size={18} />
                            {showPlayerLabels && <CaseSensitive size={18} className="ml-1" />}
                        </Button>
                    )}
                    {onToggleFieldOfView && (
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

            {/* Vertical divider + Section 3 — only if showSingleMarkerHint */}
            {showSingleMarkerHint && (
                <>
                    <div className="self-stretch w-px bg-[var(--theme-border)] mx-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)] mb-2">Single Marker</span>
                        <div className="flex flex-row items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--theme-border-btn)] bg-transparent">
                                <Info size={14} style={{ color: '#555568', flexShrink: 0 }} />
                                <span className="text-xs text-[var(--theme-muted)] leading-tight">Right-click any player to assign captain, cards or star status</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CreatorsMenu;
