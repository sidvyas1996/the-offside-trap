import  { useState } from "react";
import {Users, Target, Video, Settings, Badge, Save, Loader2} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {Label} from "../components/ui/label.tsx";
import {Textarea} from "../components/ui/textarea.tsx";
import MiniTacticCard from "../components/MiniTacticCard.tsx";
import FootballField from "../components/FootballField.tsx";
import type {Player} from "../../../../packages/shared";
import {usePlayerDrag} from "../hooks/usePlayerDrag.ts";
import {renderBackButton} from "../components/ui/back-button.tsx";
import {useNavigate} from "react-router-dom";
import {defaultLineupSingle} from "../utils/default-lineup-single.ts";

const WORKFLOW_STEPS = {
  START: 'start',
  BUILD_LINEUPS: 'build_lineups',
  TACTICS_OPTIONS: 'tactics_options',
  FINAL: 'final'
};

export default function Create() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<{ step: string; title?: string }>({ step: WORKFLOW_STEPS.START });
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedOptions] = useState(["motion graphic", "defending"]);
  const [title, setTitle] = useState("");

  const [players, setPlayers] = useState<Player[]>(defaultLineupSingle);
  const {
    draggedPlayer,
    fieldRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = usePlayerDrag(players, setPlayers, { sticky: false });

  const handleStepNavigation = (data: { step: string; title?: string }) => {
    setCurrentStep(data);
  };

  const handlePlayerNameChange = (id: number, newName: string) => {
    setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };


  const renderStartStep = () => (
      <div className="text-center py-12">
        {renderBackButton(() => navigate(-1))}
        <h1 className="text-4xl font-bold mb-4">Build My Tactics</h1>
        <p className="text-[var(--text-secondary)] mb-8 text-lg">
          Create professional football tactics with our step-by-step workflow
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation({step:WORKFLOW_STEPS.BUILD_LINEUPS, title: 'Create Your Tactics'})}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-8 w-8 text-[var(--primary)]" />
                Build Lineups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)]">
                Set up team formations and player positions for your tactical setup
              </p>
            </CardContent>
          </Card>

          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation({step:WORKFLOW_STEPS.TACTICS_OPTIONS, title:'Create Your Tactics'})}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target className="h-8 w-8 text-[var(--primary)]" />
                Build Tactics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)]">
                Create tactical movements, animations, and strategic plays
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
  );


  const renderLineupBuilder = () => (
      <div className="max-w-4xl mx-auto py-12">
        {renderBackButton(() => handleStepNavigation({step:WORKFLOW_STEPS.START}))}
        <h2 className="text-2xl font-bold text-center mb-8">Lineup Options</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation({step: WORKFLOW_STEPS.FINAL, title: 'Build Your Team'})}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-8 w-8 text-[var(--primary)]" />
                Single Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)]">
                Focus on your team's formation and tactical setup
              </p>
            </CardContent>
          </Card>

          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation({step:WORKFLOW_STEPS.FINAL})}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-8 w-8 text-cyan-400" />
                With Opposition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)]">
                Show both teams’ formations and tactical interactions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
  );


  const renderTacticsOptions = () => (
      <div className="max-w-4xl mx-auto">
        {renderBackButton(() => handleStepNavigation({step:WORKFLOW_STEPS.START}))}
        <h2 className="text-2xl font-bold text-center mb-8">Tactics Options</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation({step:WORKFLOW_STEPS.FINAL, title: 'Still Graphic Tactics'})}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-amber-500" />
                Still Graphic Tactics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)]">
                Create static tactical diagrams with formations and positioning
              </p>
            </CardContent>
          </Card>

          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation({step: WORKFLOW_STEPS.FINAL, title: 'Motion Graphic Tactics'})}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Video className="h-8 w-8 text-purple-500" />
                Motion Graphic Tactics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-secondary)]">
                Build animated tactical movements and player sequences
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
  );


  const renderFinalStep=(headerTitle?: string) => (
      <div className="max-w-4xl mx-auto py-12">
        <div className="flex items-center gap-4 mb-8">
          {renderBackButton(() => handleStepNavigation({step:WORKFLOW_STEPS.START}))}
          <h2 className="text-5xl font-bold">{headerTitle}</h2>
        </div>


        <form className="space-y-6">
          {/* Football Field */}
          <div className="w-full flex justify-center mb-8">
            <FootballField
                players={players}
                draggedPlayer={draggedPlayer}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                fieldRef={fieldRef}
                size={"fullscreen"}
                isPlayerNameEditable={true}
                onPlayerNameChange={handlePlayerNameChange}
            />
          </div>

          <div>
            <Label htmlFor="title">Tactic Title</Label>
            <Textarea
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. High Press Counter Attack"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your tactical approach..."
            />
          </div>

          <div>
            <Label>Selected Options</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedOptions.map((opt, idx) => (
                  <Badge key={idx} className="bg-purple-600 text-white">
                    {opt}
                  </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
                type="submit"
                className="btn-primary"
                disabled={loading}
            >
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
          </div>
          <div className="flex justify-end">
            <MiniTacticCard></MiniTacticCard>
          </div>
        </form>
      </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep.step) {
      case WORKFLOW_STEPS.BUILD_LINEUPS:
        return renderLineupBuilder();
      case WORKFLOW_STEPS.TACTICS_OPTIONS:
        return renderTacticsOptions();
      case WORKFLOW_STEPS.FINAL:
        return renderFinalStep(currentStep.title);
      default:
        return renderStartStep();
    }
  };

  return (
      <div className="min-h-screen py-8 px-4 lg:px-8">
        {renderCurrentStep()}
      </div>
  );
}
