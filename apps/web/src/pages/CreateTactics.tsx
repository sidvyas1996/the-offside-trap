import { useState } from "react";
import {Users, Target, Video, Settings, ArrowLeft} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const WORKFLOW_STEPS = {
  START: 'start',
  BUILD_LINEUPS: 'build_lineups',
  TACTICS_OPTIONS: 'tactics_options',
  FINAL: 'final'
};

export default function Create() {
  const [currentStep, setCurrentStep] = useState(WORKFLOW_STEPS.START);

  const handleStepNavigation = (step: any) => setCurrentStep(step);

  const renderBackButton = (onClick: () => void, label: string = "Back") => (
      <Button
          variant="default"
          onClick={onClick}
          className="btn-outline"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        {label}
      </Button>
  );

  const renderStartStep = () => (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Build My Tactics</h1>
        <p className="text-[var(--text-secondary)] mb-8 text-lg">
          Create professional football tactics with our step-by-step workflow
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation(WORKFLOW_STEPS.BUILD_LINEUPS)}
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
              onClick={() => handleStepNavigation(WORKFLOW_STEPS.TACTICS_OPTIONS)}
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
        <h2 className="text-2xl font-bold text-center mb-8">Lineup Options</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation(WORKFLOW_STEPS.TACTICS_OPTIONS)}
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
              onClick={() => handleStepNavigation(WORKFLOW_STEPS.TACTICS_OPTIONS)}
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
        {renderBackButton(() => handleStepNavigation(WORKFLOW_STEPS.TACTICS_OPTIONS))}
        <h2 className="text-2xl font-bold text-center mb-8">Tactics Options</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
              className="bg-[var(--card)] border-[var(--border)] cursor-pointer hover:bg-[var(--card-hover)] transition-all"
              onClick={() => handleStepNavigation(WORKFLOW_STEPS.FINAL)}
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
              onClick={() => handleStepNavigation(WORKFLOW_STEPS.FINAL)}
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


  const renderFinalStep = () => (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Final Details</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          [Enter title, description, and submit...]
        </p>
        <Button onClick={() => handleStepNavigation(WORKFLOW_STEPS.START)}>
          Back to Start
        </Button>
      </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case WORKFLOW_STEPS.BUILD_LINEUPS:
        return renderLineupBuilder();
      case WORKFLOW_STEPS.TACTICS_OPTIONS:
        return renderTacticsOptions();
      case WORKFLOW_STEPS.FINAL:
        return renderFinalStep();
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
