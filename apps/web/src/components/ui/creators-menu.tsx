import React from "react";

import { Palette, Users, Circle, Shirt, CaseSensitive, Waypoints, Sun, Moon, Grid3X3, SplitSquareVertical, SplitSquareHorizontal } from "lucide-react";
import {Button} from "./button.tsx";
import {DEFAULT_FOOTBALL_FIELD_COLOUR, DEFAULT_BORDER_LIGHT_GRAY} from "../../utils/colors.ts";

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
        <div className="w-full bg-[#1a1a1a] border border-[rgb(49,54,63)] rounded-xl p-4 flex gap-6 justify-center items-center mt-6 overflow-x-auto">
            {/* Toggle Field Color (Light/Dark) */}
            <Button
                onClick={handleToggleFieldColor}
                className="!p-2"
                style={{ borderColor: DEFAULT_BORDER_LIGHT_GRAY, borderRadius: 6 }}
                variant="outline"
                type="button"
                title={isDark ? "Switch to Light Field" : "Switch to Dark Field"}
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            {/* Toggle Player Labels */}
            {onTogglePlayerLabels && (
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        onTogglePlayerLabels();
                    }}
                    className="!p-2"
                    style={{ borderColor: DEFAULT_BORDER_LIGHT_GRAY, borderRadius: 6 }}
                    variant="outline"
                    type="button"
                    title={showPlayerLabels ? "Hide Player Labels" : "Show Player Labels"}
                >
                    <Users size={18} />
                    {showPlayerLabels && <CaseSensitive size={18} className="ml-1" />}
                </Button>
            )}

            {/* Toggle Marker Type */}
            {onToggleMarkerType && (
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleMarkerType();
                    }}
                    className=""
                    style={{ borderColor: DEFAULT_BORDER_LIGHT_GRAY, borderRadius: 6 }}
                    variant="outline"
                    type="button"
                    title={markerType === 'circle' ? "Switch to Shirt Markers" : "Switch to Circle Markers"}
                >
                    {markerType === 'circle' ? <Shirt size={18} /> : <Circle size={18} />}
                </Button>
            )}

            {/* Toggle Waypoints */}
            {onToggleWaypoints && (
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleWaypoints();
                    }}
                    className=""
                    style={{ 
                        borderColor: waypointsMode ? '#16A34A' : DEFAULT_BORDER_LIGHT_GRAY, 
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

            {/* Toggle Horizontal Zones */}
            {onToggleHorizontalZones && (
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleHorizontalZones();
                    }}
                    className=""
                    style={{ 
                        borderColor: horizontalZonesMode ? '#16A34A' : DEFAULT_BORDER_LIGHT_GRAY, 
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
                    className=""
                    style={{ 
                        borderColor: verticalSpacesMode ? '#16A34A' : DEFAULT_BORDER_LIGHT_GRAY, 
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
        </div>
    );
};

export default CreatorsMenu;
