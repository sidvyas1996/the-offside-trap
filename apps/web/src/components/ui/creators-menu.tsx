import React from "react";

import { Palette, Users, Layout, EyeOff } from "lucide-react";
import {Button} from "./button.tsx";

interface CreatorsMenuProps {
    onChangeFieldColor: (color: string) => void;
    onChangePlayerColor: (color: string) => void;
    onTogglePlayerDesign: () => void;
}

const COLORS = {
    field: ["#006400", "#0044cc", "#222"],
    player: ["#000", "#b30000", "#ffcc00"],
};

const CreatorsMenu: React.FC<CreatorsMenuProps> = ({
                                                       onChangeFieldColor,
                                                       onChangePlayerColor,
                                                       onTogglePlayerDesign,
                                                   }) => {
    return (
        <div className="w-full bg-[#1a1a1a] rounded-lg shadow-md p-4 flex gap-6 justify-center items-center mt-6 overflow-x-auto">
            {/* Change Field Colors */}
            <div className="flex items-center gap-2">
                <Palette className="text-white" />
                {COLORS.field.map((color, idx) => (
                    <button
                        key={idx}
                        onClick={() => onChangeFieldColor(color)}
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
                        onClick={() => onChangePlayerColor(color)}
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
                onClick={onTogglePlayerDesign}
                className="bg-gray-700 hover:bg-gray-600 flex items-center gap-2"
            >
                <EyeOff size={18} /> Toggle Design
            </Button>
        </div>
    );
};

export default CreatorsMenu;
