import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { renderBackButton } from "../components/ui/back-button";
import { FootballFieldProvider } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import LineupField from "../components/tactics/LineupField";
import TacticDetails from "../components/tactics/TacticDetails";
import LineupOptions from "../components/tactics/LineupOptions";
import Preview from "../components/tactics/Preview";
import CreatorsMenu from "../components/ui/creators-menu";

const CreateLineupsContent: React.FC = () => {
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

  const handleSubmit = () => {
    form.setLoading(true);
    // TODO: Implement lineup creation
    console.log("Creating lineup:", form.getFormData());
    setTimeout(() => {
      form.setLoading(false);
      // Navigate to tactics list or show success message
    }, 1000);
  };

  const renderCreateLineupsPage = () => (
    <div className="max-w-[1152px] mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        {renderBackButton(() => navigate(-1))}
        <h1 className="text-4xl font-bold">Create Lineups</h1>
      </div>

      <div className="flex gap-4 items-start transition-all duration-300 ease-in-out">
        {/* Lineup Field - Left Side */}
        <div className="flex-1">
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
        </div>
        
        {/* CreatorsMenu - Vertical on the right */}
        <div className="flex-shrink-0 self-start">
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
          />
        </div>
      </div>
      
      <div className="space-y-6 transition-all duration-300 ease-in-out">

          {/* Tactic Details */}
          <TacticDetails
            title={form.title}
            setTitle={form.setTitle}
            description={form.description}
            setDescription={form.setDescription}
            selectedOptions={form.selectedOptions}
            loading={form.loading}
            onSubmit={handleSubmit}
          />

        {/* Options and Preview - Below Field */}
        <div className="grid lg:grid-cols-2 gap-6">
          <LineupOptions />
          <Preview />
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