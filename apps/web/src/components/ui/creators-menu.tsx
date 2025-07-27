import React from "react";

import { Palette, Users, Layout, EyeOff } from "lucide-react";
import {Button} from "./button.tsx";

interface CreatorsMenuProps {
    onChangeFieldColor: (color: string) => void;
    onChangePlayerColor: (color: string) => void;
    onTogglePlayerDesign: () => void;
    onTogglePlayerLabels?: () => void;
    showPlayerLabels?: boolean;
}

const COLORS = {
    field: ["#006400", "#0044cc", "#222"],
    player: ["#000", "#b30000", "#ffcc00"],
};

const CreatorsMenu: React.FC<CreatorsMenuProps> = ({
                                                       onChangeFieldColor,
                                                       onChangePlayerColor,
                                                       onTogglePlayerDesign,
                                                       onTogglePlayerLabels,
                                                       showPlayerLabels = true,
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

            {/* Change Player Colors */}
            <div className="flex items-center gap-2">
                <Users className="text-white" />
                {COLORS.player.map((color, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onChangePlayerColor(color);
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

            {/* Toggle Player Design */}
            <Button
                onClick={(e) => {
                    e.preventDefault();
                    onTogglePlayerDesign();
                }}
                className="btn-primary !px-3 !py-1.5 text-sm"
                type="button"
            >
                <EyeOff size={18} /> Toggle Design
            </Button>

            {/* Toggle Player Labels */}
            {onTogglePlayerLabels && (
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        onTogglePlayerLabels();
                    }}
                    className="btn-primary !px-3 !py-1.5 text-sm"
                    type="button"
                >
                    <Users size={18} /> {showPlayerLabels ? "Hide Labels" : "Show Labels"}
                </Button>
            )}
        </div>
    );
};

export default CreatorsMenu;
