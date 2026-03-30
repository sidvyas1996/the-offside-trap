import React from "react";
import { useNavigate } from "react-router-dom";
import { renderBackButton } from "../components/ui/back-button";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import { useAnimation } from "../hooks/useAnimation";
import FullscreenLayout from "../components/tactics/FullscreenLayout";
import TacticalField from "../components/tactics/TacticalField";
import TacticDetails from "../components/tactics/TacticDetails";
import TacticsOptions from "../components/tactics/TacticsOptions";
import Preview from "../components/tactics/Preview";
import AnimationTimeline from "../components/tactics/AnimationTimeline";
import { TacticEntity } from "../entities/TacticEntity";
import type { TacticFormData, FieldSettings } from "../../../../packages/shared/src";

const CreateTacticsContent: React.FC = () => {
  const navigate = useNavigate();
  const { players, setPlayers, options, setOptions } = useFootballField();

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

  const getCurrentFieldSettings = (): FieldSettings => ({
    fieldColor: options.fieldColor || '#0d4b3e',
    playerColor: options.playerColor || '#1a1a1a',
    showPlayerLabels: state.showPlayerLabels,
    markerType: state.markerType,
  });

  // Animation hook — when playing back, override players + field settings
  const animation = useAnimation({
    onFrame: (framePlayers, frameFieldSettings) => {
      setPlayers(framePlayers);
      setOptions(prev => ({
        ...prev,
        fieldColor: frameFieldSettings.fieldColor,
        playerColor: frameFieldSettings.playerColor,
        showPlayerLabels: frameFieldSettings.showPlayerLabels,
        markerType: frameFieldSettings.markerType,
      }));
    },
  });

  const handleAddKeyframe = () => {
    animation.addKeyframe(players, getCurrentFieldSettings());
  };

  const handleSubmit = async () => {
    if (!form.isFormValid()) {
      alert("Please fill in title (3+ chars), description (10+ chars), and a valid formation (e.g. 4-3-3).");
      return;
    }
    form.setLoading(true);
    try {
      const payload: TacticFormData = {
        title: form.title,
        formation: form.formation,
        tags: form.tags,
        description: form.description,
        players,
        fieldSettings: getCurrentFieldSettings(),
        animation: animation.keyframes.length > 0 ? animation.getAnimation() : undefined,
      };
      await new TacticEntity().create(payload);
      navigate('/');
    } catch (err) {
      console.error("Failed to create tactic:", err);
      alert("Failed to save tactic. Please try again.");
    } finally {
      form.setLoading(false);
    }
  };

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
    <div className="grid lg:grid-cols-3 gap-8 transition-all duration-300 ease-in-out">
      {/* Left Column - Football Field, Animation Timeline, and Tactic Details */}
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

        <AnimationTimeline
          keyframes={animation.keyframes}
          currentTimeMs={animation.currentTimeMs}
          isPlaying={animation.isPlaying}
          durationMs={animation.durationMs}
          fps={animation.fps}
          onPlay={animation.play}
          onPause={animation.pause}
          onAddKeyframe={handleAddKeyframe}
          onRemoveKeyframe={animation.removeKeyframe}
          onUpdateKeyframeTime={animation.updateKeyframeTime}
          onSeek={animation.seekTo}
          onSetDuration={animation.setDuration}
          onSetFps={animation.setFps}
        />

        <TacticDetails
          title={form.title}
          setTitle={form.setTitle}
          description={form.description}
          setDescription={form.setDescription}
          formation={form.formation}
          setFormation={form.setFormation}
          selectedOptions={form.selectedOptions}
          loading={form.loading}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Right Column - Options and Preview */}
      <div className="space-y-6">
        <TacticsOptions />
        <Preview animation={animation.getAnimation()} />
      </div>
    </div>
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
