import React from "react";
import { useNavigate } from "react-router-dom";
import { renderBackButton } from "../components/ui/back-button";
import { FootballFieldProvider } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import FullscreenLayout from "../components/tactics/FullscreenLayout";
import TacticalField from "../components/tactics/TacticalField";
import TacticDetails from "../components/tactics/TacticDetails";
import LineupOptions from "../components/tactics/LineupOptions";
import TacticsOptions from "../components/tactics/TacticsOptions";
import Preview from "../components/tactics/Preview";

const CreateTacticsContent: React.FC = () => {
  const navigate = useNavigate();
  
  // Custom hooks
  const form = useTacticsForm();
  const state = useTacticsState();
  const actions = useTacticsActions(
    state.players,
    state.setPlayers,
    state.setActions,
    state.setDraggedPlayer,
    state.fieldRef,
    state.handlePlayerNameChange,
    state.handleUpdatePlayer
  );

  const handleSubmit = () => {
    form.setLoading(true);
    // TODO: Implement tactic creation
    console.log("Creating tactic:", form.getFormData());
    setTimeout(() => {
      form.setLoading(false);
      // Navigate to tactics list or show success message
    }, 1000);
  };

  const renderNormalLayout = () => (
    <div className="grid lg:grid-cols-3 gap-8 transition-all duration-300 ease-in-out">
      {/* Left Column - Football Field and Tactic Details */}
      <div className="lg:col-span-2 space-y-6">
        <TacticalField
          waypointsMode={state.waypointsMode}
          horizontalZonesMode={state.horizontalZonesMode}
          verticalSpacesMode={state.verticalSpacesMode}
          isFullScreen={state.isFullScreen}
          onChangeFieldColor={state.handleFieldColorChange}
          onChangePlayerColor={state.handlePlayerColorChange}
          onTogglePlayerLabels={state.handleTogglePlayerLabels}
          showPlayerLabels={state.showPlayerLabels}
          onToggleMarkerType={state.handleToggleMarkerType}
          markerType={state.markerType}
          onToggleWaypoints={state.handleToggleWaypoints}
          onToggleHorizontalZones={state.handleToggleHorizontalZones}
          onToggleVerticalSpaces={state.handleToggleVerticalSpaces}
          onToggleFullScreen={state.handleToggleFullScreen}
        />

        <TacticDetails
          title={form.title}
          setTitle={form.setTitle}
          description={form.description}
          setDescription={form.setDescription}
          selectedOptions={form.selectedOptions}
          loading={form.loading}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Right Column - Options and Preview */}
      <div className="space-y-6">
        <LineupOptions />
        <TacticsOptions />
        <Preview />
      </div>
    </div>
  );

  const renderCreateTacticsPage = () => (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        {renderBackButton(() => navigate(-1))}
        <h1 className="text-4xl font-bold">Create Tactics</h1>
      </div>

      {state.isFullScreen ? (
        <FullscreenLayout
          waypointsMode={state.waypointsMode}
          horizontalZonesMode={state.horizontalZonesMode}
          verticalSpacesMode={state.verticalSpacesMode}
          isFullScreen={state.isFullScreen}
          onChangeFieldColor={state.handleFieldColorChange}
          onChangePlayerColor={state.handlePlayerColorChange}
          onTogglePlayerLabels={state.handleTogglePlayerLabels}
          showPlayerLabels={state.showPlayerLabels}
          onToggleMarkerType={state.handleToggleMarkerType}
          markerType={state.markerType}
          onToggleWaypoints={state.handleToggleWaypoints}
          onToggleHorizontalZones={state.handleToggleHorizontalZones}
          onToggleVerticalSpaces={state.handleToggleVerticalSpaces}
          onToggleFullScreen={state.handleToggleFullScreen}
        />
      ) : (
        renderNormalLayout()
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 lg:px-8">
      {renderCreateTacticsPage()}
    </div>
  );
};

export default function CreateTactics() {
  return (
    <FootballFieldProvider>
      <CreateTacticsContent />
    </FootballFieldProvider>
  );
}
