import { useState, useEffect } from "react";
import * as React from "react";
import {
  Users,
  Target,
  Video,
  Settings,
  Badge,
  Save,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label.tsx";
import { Textarea } from "../components/ui/textarea.tsx";
import MiniTacticCard from "../components/MiniTacticCard.tsx";
import FootballField from "../components/FootballField.tsx";
import { usePlayerDrag } from "../hooks/usePlayerDrag.ts";
import { renderBackButton } from "../components/ui/back-button.tsx";
import { useNavigate } from "react-router-dom";
import { defaultLineupSingle } from "../utils/default-lineup-single.ts";
import {
  DEFAULT_FOOTBALL_FIELD_COLOUR,
} from "../utils/colors.ts";
import CreatorsMenu from "../components/ui/creators-menu.tsx";
import {
  FootballFieldProvider,
  useFootballField,
} from "../contexts/FootballFieldContext.tsx";
import { useCreateTactics } from "../contexts/CreateTacticsContext";
import type { Player } from "../../../../packages/shared/src";

const WORKFLOW_STEPS = {
  START: "start",
  BUILD_LINEUPS: "build_lineups",
  TACTICS_OPTIONS: "tactics_options",
  FINAL: "final",
};

const CreateTacticsContent = () => {
  const navigate = useNavigate();
  const { setCurrentStep: setContextStep } = useCreateTactics();
  const {
    players,
    setPlayers,
    setOptions,
    setActions,
    setDraggedPlayer,
    fieldRef,
  } = useFootballField();

  // Toolbar state
  const [homeColor, setHomeColor] = useState("#16A34A");
  const [showPlayerLabels, setShowPlayerLabels] = useState(true);
  const [markerType, setMarkerType] = useState<'circle' | 'shirt'>('circle');
  const [waypointsMode, setWaypointsMode] = useState(false);

  // Drag-and-drop logic for create page, use context's fieldRef
  const drag = usePlayerDrag(
    players,
    setPlayers,
    { sticky: false },
    fieldRef as React.RefObject<HTMLDivElement>,
  );

  const [loading, setLoading] = useState(false);
  const [selectedOptions] = useState(["motion graphic", "defending"]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Set context step to final for toolbar visibility
  useEffect(() => {
    setContextStep(WORKFLOW_STEPS.FINAL);
  }, [setContextStep]);

  const handlePlayerNameChange = (id: number, newName: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p)),
    );
  };

  const handleUpdatePlayer = (id: number, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const handleFieldColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, fieldColor: color }));

  const handlePlayerColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, playerColor: color }));

  const handleTogglePlayerDesign = () =>
    setOptions((prev) => ({ ...prev, disableDesign: !prev.disableDesign }));

  const handleTogglePlayerLabels = () => {
    setShowPlayerLabels((prev) => !prev);
    setOptions((prev) => ({ ...prev, showPlayerLabels: !showPlayerLabels }));
  };

  const handleToggleMarkerType = () => {
    const newMarkerType = markerType === 'circle' ? 'shirt' : 'circle';
    setMarkerType(newMarkerType);
    setOptions((prev) => ({ ...prev, markerType: newMarkerType }));
  };

  const handleToggleWaypoints = () => {
    setWaypointsMode((prev) => !prev);
  };

  // Toolbar handlers
  const handleSave = () => {
    console.log("Saving tactic...");
    // TODO: Implement save functionality
  };

  const handleLoad = () => {
    console.log("Loading tactic...");
    // TODO: Implement load functionality
  };

  const handleReset = () => {
    console.log("Resetting tactic...");
    setPlayers(defaultLineupSingle);
  };

  const handleHomeColorChange = (color: string) => {
    setHomeColor(color);
    setOptions((prev) => ({ ...prev, playerColor: color }));
  };

  const handleAwayColorChange = (color: string) => {
    // TODO: Implement away team color change
    console.log("Away color changed to:", color);
  };

  useEffect(() => {
    setPlayers(defaultLineupSingle);
    setActions({
      onMouseDown: (player) => {
        drag.handleMouseDown(player);
        setDraggedPlayer(player);
      },
      onMouseMove: drag.handleMouseMove,
      onMouseUp: () => {
        drag.handleMouseUp();
        setDraggedPlayer(null);
      },
      onPlayerNameChange: handlePlayerNameChange,
      onUpdatePlayer: handleUpdatePlayer,
    });

    setOptions((prev) => ({
      ...prev,
      size: "fullscreen",
      editable: true,
      fieldColor: DEFAULT_FOOTBALL_FIELD_COLOUR,
      playerColor: homeColor,
      enableContextMenu: true
    }));
  }, [
    drag.handleMouseDown,
    drag.handleMouseMove,
    drag.handleMouseUp,
    setActions,
    setDraggedPlayer,
    setPlayers,
    setOptions,
    homeColor,
  ]);

  const renderCreateTacticsPage = () => (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        {renderBackButton(() => navigate(-1))}
        <h1 className="text-4xl font-bold">Create Tactics</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Football Field */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Tactical Field</h2>
            <div className="w-full flex justify-center">
              <FootballField waypointsMode={waypointsMode} />
            </div>
            <div className="mt-4">
                          <CreatorsMenu
              onChangeFieldColor={handleFieldColorChange}
              onChangePlayerColor={handlePlayerColorChange}
              onTogglePlayerLabels={handleTogglePlayerLabels}
              showPlayerLabels={showPlayerLabels}
              onToggleMarkerType={handleToggleMarkerType}
              markerType={markerType}
              onToggleWaypoints={handleToggleWaypoints}
              waypointsMode={waypointsMode}
            />
            </div>
          </div>
        </div>

        {/* Right Column - Options and Details */}
        <div className="space-y-6">
          {/* Lineup Options */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--primary)]" />
              Lineup Options
            </h2>
            <div className="space-y-3">
              <Card className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--primary)]" />
                    Single Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Focus on your team's formation and tactical setup
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                    With Opposition
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Show both teams' formations and tactical interactions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tactics Options */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--primary)]" />
              Tactics Options
            </h2>
            <div className="space-y-3">
              <Card className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4 text-amber-500" />
                    Still Graphic Tactics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Create static tactical diagrams with formations and positioning
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Video className="h-4 w-4 text-purple-500" />
                    Motion Graphic Tactics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Build animated tactical movements and player sequences
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tactic Details */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Save className="h-5 w-5 text-[var(--primary)]" />
              Tactic Details
            </h2>
            <form className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm">Tactic Title</Label>
                <Textarea
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High Press Counter Attack"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your tactical approach..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Selected Options</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedOptions.map((opt, idx) => (
                    <Badge key={idx} className="bg-purple-600 text-white text-xs">
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Tactic...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Tactic
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--primary)]" />
              Preview
            </h2>
            <MiniTacticCard />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 lg:px-8">{renderCreateTacticsPage()}</div>
  );
};

export default function Create() {
  return (
    <FootballFieldProvider>
      <CreateTacticsContent />
    </FootballFieldProvider>
  );
}
