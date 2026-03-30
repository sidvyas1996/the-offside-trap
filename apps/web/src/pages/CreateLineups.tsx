import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { renderBackButton } from "../components/ui/back-button";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import LineupField from "../components/tactics/LineupField";
import TacticDetails from "../components/tactics/TacticDetails";
import LineupOptions from "../components/tactics/LineupOptions";
import Preview from "../components/tactics/Preview";
import CreatorsMenu from "../components/ui/creators-menu";
import { TacticEntity } from "../entities/TacticEntity";
import type { TacticFormData } from "../../../../packages/shared/src";

const CreateLineupsContent: React.FC = () => {
  const navigate = useNavigate();
  const { players, options } = useFootballField();

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

  // Field rotation, tilt, and zoom state
  const [rotationAngle, setRotationAngle] = useState(0);
  const [tiltAngle, setTiltAngle] = useState(20);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Rotation and tilt handlers
  const handleRotateLeft = () => {
    setRotationAngle((prev) => (prev - 15 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotationAngle((prev) => (prev + 15) % 360);
  };

  const handleTiltUp = () => {
    setTiltAngle((prev) => Math.min(45, prev + 5));
  };

  const handleTiltDown = () => {
    setTiltAngle((prev) => Math.max(0, prev - 5));
  };

  // Zoom handlers
  const handleZoomOut = () => {
    if (zoomLevel === 1.2) {
      setZoomLevel(1.0);
    } else if (zoomLevel === 1.0) {
      setZoomLevel(0.75);
    }
  };

  const handleZoomIn = () => {
    if (zoomLevel === 0.75) {
      setZoomLevel(1.0);
    } else if (zoomLevel === 1.0) {
      setZoomLevel(1.2);
    }
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
        fieldSettings: {
          fieldColor: options.fieldColor || '#0d4b3e',
          playerColor: options.playerColor || '#1a1a1a',
          showPlayerLabels: state.showPlayerLabels,
          markerType: state.markerType,
        },
      };
      await new TacticEntity().create(payload);
      navigate('/');
    } catch (err) {
      console.error("Failed to create lineup:", err);
      alert("Failed to save lineup. Please try again.");
    } finally {
      form.setLoading(false);
    }
  };

  const renderCreateLineupsPage = () => (
    <div className="max-w-[1152px] mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        {renderBackButton(() => navigate(-1))}
        <h1 className="text-4xl font-bold">Create Lineups</h1>
      </div>

      <div className="flex flex-col gap-4 transition-all duration-300 ease-in-out">
        {/* Lineup Field */}
        <LineupField
          waypointsMode={state.waypointsMode}
          horizontalZonesMode={state.horizontalZonesMode}
          verticalSpacesMode={state.verticalSpacesMode}
          onChangeFieldColor={state.handleFieldColorChange}
          onChangePlayerColor={state.handlePlayerColorChange}
          onTogglePlayerLabels={state.handleTogglePlayerLabels}
          showPlayerLabels={state.showPlayerLabels}
          onToggleMarkerType={state.handleToggleMarkerType}
          markerType={state.markerType}
          onToggleWaypoints={state.handleToggleWaypoints}
          onToggleHorizontalZones={state.handleToggleHorizontalZones}
          onToggleVerticalSpaces={state.handleToggleVerticalSpaces}
          rotationAngle={rotationAngle}
          tiltAngle={tiltAngle}
          onRotationChange={setRotationAngle}
          onTiltChange={setTiltAngle}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onTiltUp={handleTiltUp}
          onTiltDown={handleTiltDown}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />

        {/* CreatorsMenu - Horizontal toolbar below field */}
        <CreatorsMenu
          onChangeFieldColor={state.handleFieldColorChange}
          onChangePlayerColor={state.handlePlayerColorChange}
          onTogglePlayerLabels={state.handleTogglePlayerLabels}
          showPlayerLabels={state.showPlayerLabels}
          onToggleMarkerType={state.handleToggleMarkerType}
          markerType={state.markerType}
          onToggleWaypoints={state.handleToggleWaypoints}
          waypointsMode={state.waypointsMode}
          onToggleHorizontalZones={state.handleToggleHorizontalZones}
          horizontalZonesMode={state.horizontalZonesMode}
          onToggleVerticalSpaces={state.handleToggleVerticalSpaces}
          verticalSpacesMode={state.verticalSpacesMode}
          rotationAngle={rotationAngle}
          tiltAngle={tiltAngle}
          zoomLevel={zoomLevel}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onTiltUp={handleTiltUp}
          onTiltDown={handleTiltDown}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          markerBgColor={options.markerBgColor}
          markerBorderColor={options.markerBorderColor}
          onChangeMarkerBgColor={state.handleMarkerBgColorChange}
          onChangeMarkerBorderColor={state.handleMarkerBorderColorChange}
        />
      </div>
      
      <div className="space-y-6 transition-all duration-300 ease-in-out">

          {/* Tactic Details */}
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

        {/* Options and Preview - Below Field */}
        <div className="grid lg:grid-cols-2 gap-6">
          <LineupOptions />
          <Preview 
            rotationAngle={rotationAngle}
            tiltAngle={tiltAngle}
            zoomLevel={zoomLevel}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 lg:px-8">
      {renderCreateLineupsPage()}
    </div>
  );
};

export default function CreateLineups() {
  return (
    <FootballFieldProvider>
      <CreateLineupsContent />
    </FootballFieldProvider>
  );
} 