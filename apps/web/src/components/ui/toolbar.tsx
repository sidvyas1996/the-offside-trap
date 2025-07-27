import React from "react";
import { Users, Save, Upload, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "./button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./dropdown-menu";


interface ToolbarProps {
  homeTeam?: string;
  formation?: string;
  onTeamChange?: (team: string) => void;
  onFormationChange?: (formation: string) => void;
  onSave?: () => void;
  onLoad?: () => void;
  onReset?: () => void;
  onHomeColorChange?: (color: string) => void;
  onAwayColorChange?: (color: string) => void;
  homeColor?: string;
  awayColor?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  homeTeam = "Home Team",
  formation = "4-4-2",
  onTeamChange,
  onFormationChange,
  onSave,
  onLoad,
  onReset,
  onHomeColorChange,
  onAwayColorChange,
  homeColor = "#16A34A",
  awayColor = "#374151",
}) => {
  return (
    <div className="bg-[#1a1a1a] border-b border-[rgb(49,54,63)] px-6 py-3 sticky top-16 z-40">
      <div className="flex items-center justify-between">
                {/* Left side - Team and Formation controls */}
        <div className="flex items-center space-x-6">
          {/* Home Team Selector */}
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-[var(--text-secondary)]" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="btn-outline !px-3 !py-1.5 text-sm rounded-full">
                  <span className="mr-2">{homeTeam}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-lg">
                <DropdownMenuItem onClick={() => onTeamChange?.("Home Team")}>
                  Home Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTeamChange?.("Away Team")}>
                  Away Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTeamChange?.("Custom Team")}>
                  Custom Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Formation Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[var(--text-secondary)]">Formation:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="btn-outline !px-3 !py-1.5 text-sm rounded-full">
                  <span className="mr-2">{formation}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-lg">
                <DropdownMenuItem onClick={() => onFormationChange?.("4-4-2")}>
                  4-4-2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFormationChange?.("4-3-3")}>
                  4-3-3
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFormationChange?.("3-5-2")}>
                  3-5-2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFormationChange?.("4-2-3-1")}>
                  4-2-3-1
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center - Action buttons */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={onSave}
            className="btn-primary !px-3 !py-1.5 text-sm"
            variant="default"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
          <Button
            onClick={onLoad}
            className="btn-primary !px-3 !py-1.5 text-sm"
            variant="default"
          >
            <Upload className="h-4 w-4" />
            <span>Load</span>
          </Button>
          <Button
            onClick={onReset}
            className="btn-primary !px-3 !py-1.5 text-sm"
            variant="default"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Right side - Team Colors */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-[var(--text-secondary)]">Team Colors:</span>
          <div className="flex items-center space-x-2">
            {/* Home Team Color */}
            <button
              onClick={() => onHomeColorChange?.(homeColor)}
              className="btn-primary !p-1 !w-6 !h-6 rounded-full"
              style={{ backgroundColor: homeColor }}
              title="Home Team Color"
            />
            {/* Away Team Color */}
            <button
              onClick={() => onAwayColorChange?.(awayColor)}
              className="btn-primary !p-1 !w-6 !h-6 rounded-full"
              style={{ backgroundColor: awayColor }}
              title="Away Team Color"
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 

