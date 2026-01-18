import React from "react";

import { Palette, Users, Circle, Shirt, CaseSensitive, Waypoints, Sun, Moon, Grid3X3, SplitSquareVertical, SplitSquareHorizontal, Maximize2, Minimize2, RotateCw, RotateCcw, ChevronUp, ChevronDown, ZoomIn, ZoomOut } from "lucide-react";
import {Button} from "./button.tsx";
import {DEFAULT_FOOTBALL_FIELD_COLOUR} from "../../utils/colors.ts";

interface CreatorsMenuProps {
    onChangeFieldColor: (color: string) => void;
    onChangePlayerColor: (color: string) => void;
    onTogglePlayerLabels?: () => void;
    showPlayerLabels?: boolean;
    onToggleMarkerType?: () => void;
    markerType?: 'circle' | 'shirt';
    onToggleWaypoints?: () => void;
    waypointsMode?: boolean;
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
}

const COLORS = {
    field: [DEFAULT_FOOTBALL_FIELD_COLOUR, "#222"],

};

const CreatorsMenu: React.FC<CreatorsMenuProps> = ({
                                                       onChangeFieldColor,
                                                       onTogglePlayerLabels,
                                                       showPlayerLabels = true,
                                                       onToggleMarkerType,
                                                       markerType = 'circle',
                                                       onToggleWaypoints,
                                                       waypointsMode = false,
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
                                                   }) => {
    // Track which color is currently active (light or dark)
    const [isDark, setIsDark] = React.useState(false);
    const handleToggleFieldColor = (e: React.MouseEvent) => {
        e.preventDefault();
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        onChangeFieldColor(COLORS.field[newIsDark ? 1 : 0]);
    };
    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4 items-center overflow-y-auto w-32">
            {/* Player Markers Options Section */}
            <div className="flex flex-col gap-3 w-full">
                <div className="text-xs font-semibold text-[var(--text-secondary)] text-center mb-1">Player Marker Options</div>

                {/* Toggle Waypoints */}
                {onToggleWaypoints && (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            onToggleWaypoints();
                        }}
                        className="!p-2"
                        style={{
                            borderColor: waypointsMode ? '#16A34A' : 'var(--border)',
                            borderRadius: 6,
                            backgroundColor: waypointsMode ? 'rgba(22, 163, 74, 0.1)' : 'transparent'
                        }}
                        variant="outline"
                        type="button"
                        title={waypointsMode ? "Exit Waypoints Mode" : "Enter Waypoints Mode"}
                    >
                        <Waypoints size={18} />
                    </Button>
                )}

                {/* Toggle Marker Type */}
                {onToggleMarkerType && (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            onToggleMarkerType();
                        }}
                        className="!p-2"
                        style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                        variant="outline"
                        type="button"
                        title={markerType === 'circle' ? "Switch to Shirt Markers" : "Switch to Circle Markers"}
                    >
                        {markerType === 'circle' ? <Shirt size={18} /> : <Circle size={18} />}
                    </Button>
                )}

                {/* Toggle Player Labels */}
                {onTogglePlayerLabels && (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            onTogglePlayerLabels();
                        }}
                        className="!p-2"
                        style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                        variant="outline"
                        type="button"
                        title={showPlayerLabels ? "Hide Player Labels" : "Show Player Labels"}
                    >
                        <Users size={18} />
                        {showPlayerLabels && <CaseSensitive size={18} className="ml-1" />}
                    </Button>
                )}
            </div>

            {/* Divider */}
            <div className="w-full border-t border-[var(--border)] my-1"></div>

            {/* Field Options Section */}
            <div className="flex flex-col gap-3 w-full">
                <div className="text-xs font-semibold text-[var(--text-secondary)] text-center mb-1">Field Options</div>

                {/* Toggle Field Color (Light/Dark) */}
                <Button
                    onClick={handleToggleFieldColor}
                    className="!p-2"
                    style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                    variant="outline"
                    type="button"
                    title={isDark ? "Switch to Light Field" : "Switch to Dark Field"}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </Button>

                {/* Toggle Horizontal Zones */}
                {onToggleHorizontalZones && (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            onToggleHorizontalZones();
                        }}
                        className="!p-2"
                        style={{
                            borderColor: horizontalZonesMode ? '#16A34A' : 'var(--border)',
                            borderRadius: 6,
                            backgroundColor: horizontalZonesMode ? 'rgba(22, 163, 74, 0.1)' : 'transparent'
                        }}
                        variant="outline"
                        type="button"
                        title={horizontalZonesMode ? "Hide Horizontal Zones" : "Show Horizontal Zones"}
                    >
                        <SplitSquareHorizontal size={18} />
                    </Button>
                )}

                {/* Toggle Vertical Spaces */}
                {onToggleVerticalSpaces && (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            onToggleVerticalSpaces();
                        }}
                        className="!p-2"
                        style={{
                            borderColor: verticalSpacesMode ? '#16A34A' : 'var(--border)',
                            borderRadius: 6,
                            backgroundColor: verticalSpacesMode ? 'rgba(22, 163, 74, 0.1)' : 'transparent'
                        }}
                        variant="outline"
                        type="button"
                        title={verticalSpacesMode ? "Hide Vertical Spaces" : "Show Vertical Spaces"}
                    >
                        <SplitSquareVertical size={18} />
                    </Button>
                )}

                {/* Toggle Full Screen */}
                {onToggleFullScreen && (
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            onToggleFullScreen();
                        }}
                        className="!p-2"
                        style={{
                            borderColor: isFullScreen ? '#16A34A' : 'var(--border)',
                            borderRadius: 6,
                            backgroundColor: isFullScreen ? 'rgba(22, 163, 74, 0.1)' : 'transparent'
                        }}
                        variant="outline"
                        type="button"
                        title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </Button>
                )}

                {/* Rotation Controls */}
                {onRotateLeft && onRotateRight && (
                    <div className="flex flex-col gap-2 w-full">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] text-center mb-1">Rotate</div>
                        <div className="flex items-center gap-2 justify-center">
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onRotateLeft();
                                }}
                                className="!p-2"
                                style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                                variant="outline"
                                type="button"
                                title="Rotate Left"
                            >
                                <RotateCcw size={18} />
                            </Button>
                            <span className="text-xs w-10 text-center">{rotationAngle}°</span>
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onRotateRight();
                                }}
                                className="!p-2"
                                style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                                variant="outline"
                                type="button"
                                title="Rotate Right"
                            >
                                <RotateCw size={18} />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tilt Controls */}
                {onTiltUp && onTiltDown && (
                    <div className="flex flex-col gap-2 w-full">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] text-center mb-1">Tilt</div>
                        <div className="flex items-center gap-2 justify-center">
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onTiltUp();
                                }}
                                className="!p-2"
                                style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                                variant="outline"
                                type="button"
                                title="Tilt Up"
                            >
                                <ChevronUp size={18} />
                            </Button>
                            <span className="text-xs w-10 text-center">{tiltAngle}°</span>
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onTiltDown();
                                }}
                                className="!p-2"
                                style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                                variant="outline"
                                type="button"
                                title="Tilt Down"
                            >
                                <ChevronDown size={18} />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Zoom Controls */}
                {onZoomIn && onZoomOut && (
                    <div className="flex flex-col gap-2 w-full">
                        <div className="text-xs font-semibold text-[var(--text-secondary)] text-center mb-1">Zoom</div>
                        <div className="flex items-center gap-2 justify-center">
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onZoomOut();
                                }}
                                disabled={zoomLevel === 0.5}
                                className="!p-2"
                                style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                                variant="outline"
                                type="button"
                                title="Zoom Out (min 50%)"
                            >
                                <ZoomOut size={18} />
                            </Button>
                            <span className="text-xs w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onZoomIn();
                                }}
                                disabled={zoomLevel === 1.2}
                                className="!p-2"
                                style={{ borderColor: 'var(--border)', borderRadius: 6 }}
                                variant="outline"
                                type="button"
                                title="Zoom In (max 120%)"
                            >
                                <ZoomIn size={18} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatorsMenu;
