import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import PlayerEditorPanel from "../components/ui/PlayerEditorPanel";
import { TacticEntity } from "../entities/TacticEntity";
import type { TacticFormData, Player } from "../../../../packages/shared/src";

const CreateLineupsContent: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const { players, options, setPlayers, setOptions } = useFootballField();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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

  // Load existing lineup when editing
  useEffect(() => {
    if (!editId) return;
    TacticEntity.getById(editId).then(tactic => {
      if (tactic.players) setPlayers(tactic.players);
      if (tactic.title) form.setTitle(tactic.title);
      if (tactic.formation) form.setFormation(tactic.formation);
      if (tactic.description) form.setDescription(tactic.description);
      if (tactic.fieldSettings) {
        const fs = tactic.fieldSettings;
        setOptions(prev => ({
          ...prev,
          fieldColor: fs.fieldColor || prev.fieldColor,
          playerColor: fs.playerColor || prev.playerColor,
          showPlayerLabels: fs.showPlayerLabels ?? prev.showPlayerLabels,
          markerType: fs.markerType || prev.markerType,
          ...(fs.markerBgColor && { markerBgColor: fs.markerBgColor }),
          ...(fs.markerBorderColor && { markerBorderColor: fs.markerBorderColor }),
          ...(fs.markerTextColor && { markerTextColor: fs.markerTextColor }),
          ...(fs.markerSecondaryColor && { markerSecondaryColor: fs.markerSecondaryColor }),
          ...(fs.markerDesign && { markerDesign: fs.markerDesign }),
        }));
        state.setShowPlayerLabels(fs.showPlayerLabels ?? true);
        if (fs.markerType) state.setMarkerType(fs.markerType);
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

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
          markerBgColor: options.markerBgColor,
          markerBorderColor: options.markerBorderColor,
          markerTextColor: options.markerTextColor,
          markerSecondaryColor: options.markerSecondaryColor,
          markerDesign: options.markerDesign,
        },
      };
      const entity = new TacticEntity();
      if (editId) {
        await entity.update(editId, payload);
      } else {
        await entity.create(payload);
      }
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
          onPlayerSelect={setSelectedPlayer}
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
          markerTextColor={options.markerTextColor}
          markerSecondaryColor={options.markerSecondaryColor}
          markerDesign={options.markerDesign}
          onChangeMarkerBgColor={state.handleMarkerBgColorChange}
          onChangeMarkerBorderColor={state.handleMarkerBorderColorChange}
          onChangeMarkerTextColor={state.handleMarkerTextColorChange}
          onChangeMarkerSecondaryColor={state.handleMarkerSecondaryColorChange}
          onChangeMarkerDesign={state.handleMarkerDesignChange}
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
      <PlayerEditorPanel
        player={selectedPlayer}
        allPlayers={players}
        onClose={() => setSelectedPlayer(null)}
        onApply={state.handleUpdatePlayer}
        onNameChange={state.handlePlayerNameChange}
      />
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