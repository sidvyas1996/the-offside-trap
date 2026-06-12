import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Loader2 } from "lucide-react";
import { renderBackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import LineupField from "../components/tactics/LineupField";
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

  // Zoom handlers — 100% = field fills the stage; above that the view
  // crops at the stage edges like a camera, so zoom works at any rotation
  const ZOOM_STEPS = [0.75, 1.0, 1.2, 1.5];
  const handleZoomOut = () => {
    const i = ZOOM_STEPS.indexOf(zoomLevel);
    if (i > 0) setZoomLevel(ZOOM_STEPS[i - 1]);
  };

  const handleZoomIn = () => {
    const i = ZOOM_STEPS.indexOf(zoomLevel);
    if (i >= 0 && i < ZOOM_STEPS.length - 1) setZoomLevel(ZOOM_STEPS[i + 1]);
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Studio top bar — title, description, formation, save */}
      <div className="glass-bar" style={{ padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {renderBackButton(() => navigate(-1))}
          <div style={{ width: 1, height: 26, background: 'var(--hairline-strong)' }} />
          <div>
            <div className="kicker" style={{ marginBottom: 1 }}>Lineup Creator</div>
            <input
              className="studio-title-input"
              value={form.title}
              onChange={e => form.setTitle(e.target.value)}
              placeholder="Untitled Lineup"
            />
          </div>
        </div>

        {/* Description — inline, top bar */}
        <input
          value={form.description}
          onChange={e => form.setDescription(e.target.value)}
          placeholder="Add a short description…"
          style={{
            flex: 1,
            maxWidth: 520,
            background: 'var(--surface-high)',
            border: '1px solid var(--hairline)',
            borderRadius: 99,
            padding: '8px 16px',
            fontSize: 13,
            color: 'var(--on-surface)',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
          {/* Formation — editable mono chip */}
          <input
            className="chip-mono"
            value={form.formation}
            onChange={e => form.setFormation(e.target.value)}
            style={{ width: 76, textAlign: 'center', outline: 'none' }}
            title="Formation"
          />
          <Button onClick={handleSubmit} disabled={form.loading} className="btn-primary" style={{ padding: '8px 18px', borderRadius: 9 }}>
            {form.loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />{editId ? 'Update Lineup' : 'Save Lineup'}</>}
          </Button>
        </div>
      </div>

      {/* Main area: stage left, options + preview right */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 58px)' }}>

        {/* Left — field stage */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px', background: 'var(--theme-stage)' }}>
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
        <div style={{ marginTop: 16 }}>
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
        </div>

        {/* Right panel — options + preview */}
        <div style={{ width: 380, borderLeft: '1px solid var(--hairline)', background: 'var(--surface-low)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: 16 }}>
            <LineupOptions />
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <Preview
              rotationAngle={rotationAngle}
              tiltAngle={tiltAngle}
              zoomLevel={zoomLevel}
            />
          </div>
        </div>
      </div>

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