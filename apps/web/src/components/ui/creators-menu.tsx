import React from "react";

import { Palette, Users, Layout, EyeOff, Circle, Shirt, CaseSensitive, Waypoints } from "lucide-react";
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
}

const COLORS = {
    field: [DEFAULT_FOOTBALL_FIELD_COLOUR, "#0044cc", "#222"],

};

const CreatorsMenu: React.FC<CreatorsMenuProps> = ({
                                                       onChangeFieldColor,
                                                       onTogglePlayerLabels,
                                                       showPlayerLabels = true,
                                                       onToggleMarkerType,
                                                       markerType = 'circle',
                                                       onToggleWaypoints,
                                                       waypointsMode = false,
                                                   }) => {
    return (
        <div className="w-full bg-[#1a1a1a] border border-[rgb(49,54,63)] rounded-xl p-4 flex gap-6 justify-center items-center mt-6 overflow-x-auto">
            {/* Change Field Colors */}
            <div className="flex items-center gap-2">
                <Palette className="text-white" />
                {COLORS.field.map((color, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onChangeFieldColor(color);
                        }}
                        style={{
                            backgroundColor: color,
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: "2px solid #fff",
                        }}
                    />
                ))}
            </div>

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
        </div>
    );
};

export default CreatorsMenu;
