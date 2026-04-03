import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Loader2 } from "lucide-react";
import { renderBackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import { useAnimation } from "../hooks/useAnimation";
import FullscreenLayout from "../components/tactics/FullscreenLayout";
import TacticalField from "../components/tactics/TacticalField";
import TacticDetails from "../components/tactics/TacticDetails";
import Preview from "../components/tactics/Preview";
import AnimationTimeline from "../components/tactics/AnimationTimeline";
import CreatorsMenu from "../components/ui/creators-menu";
import PlayerEditorPanel from "../components/ui/PlayerEditorPanel";
import { TacticEntity } from "../entities/TacticEntity";
import type { TacticFormData, FieldSettings, Player, AnimationData } from "../../../../packages/shared/src";

const CreateTacticsContent: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const { players, setPlayers, options, setOptions } = useFootballField();

  // Custom hooks
  const form = useTacticsForm();
  const state = useTacticsState();
  const [fieldOfViewMode, setFieldOfViewMode] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
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
    markerBgColor: options.markerBgColor,
    markerBorderColor: options.markerBorderColor,
    markerTextColor: options.markerTextColor,
    markerSecondaryColor: options.markerSecondaryColor,
    markerDesign: options.markerDesign,
    fieldOfViewMode,
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
        ...(frameFieldSettings.markerBgColor && { markerBgColor: frameFieldSettings.markerBgColor }),
        ...(frameFieldSettings.markerBorderColor && { markerBorderColor: frameFieldSettings.markerBorderColor }),
        ...(frameFieldSettings.markerTextColor && { markerTextColor: frameFieldSettings.markerTextColor }),
        ...(frameFieldSettings.markerSecondaryColor && { markerSecondaryColor: frameFieldSettings.markerSecondaryColor }),
        ...(frameFieldSettings.markerDesign && { markerDesign: frameFieldSettings.markerDesign }),
      }));
    },
  });

  // Load existing tactic when editing
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
        if (fs.fieldOfViewMode !== undefined) setFieldOfViewMode(fs.fieldOfViewMode);
      }
      if (tactic.animation) animation.loadAnimation(tactic.animation as AnimationData);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

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
      const entity = new TacticEntity();
      if (editId) {
        await entity.update(editId, payload);
      } else {
        await entity.create(payload);
      }
      navigate('/');
    } catch (err) {
      console.error("Failed to save tactic:", err);
      alert("Failed to save tactic. Please try again.");
    } finally {
      form.setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Studio top bar */}
      <div style={{ background: 'var(--theme-card)', borderBottom: '1px solid var(--theme-border)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {renderBackButton(() => navigate(-1))}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--theme-muted)' }}>Tactics Studio</div>
            <input
              value={form.title}
              onChange={e => form.setTitle(e.target.value)}
              placeholder="Untitled Tactic"
              style={{
                fontSize: 14, fontWeight: 600, color: 'var(--theme-bright-text)',
                background: 'transparent', border: 'none', outline: 'none',
                padding: 0, width: 220, cursor: 'text',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* formation badge */}
          {form.formation && <span style={{ fontSize: 12, background: 'var(--theme-badge-bg)', border: '1px solid var(--theme-border-btn)', borderRadius: 6, padding: '3px 10px', color: 'var(--theme-secondary-text)', fontFamily: 'monospace' }}>{form.formation}</span>}
          <Button onClick={handleSubmit} disabled={form.loading} className="btn-primary">
            {form.loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />{editId ? 'Update Tactic' : 'Save Tactic'}</>}
          </Button>
        </div>
      </div>

      {/* Main studio area */}
      {state.isFullScreen ? (
        <FullscreenLayout
          waypointsMode={state.waypointsMode}
          horizontalZonesMode={state.horizontalZonesMode}
          verticalSpacesMode={state.verticalSpacesMode}
          isFullScreen={state.isFullScreen}
          onChangeFieldColor={state.handleFieldColorChange}
          onChangePlayerColor={state.handlePlayerColorChange}
          onChangeMarkerBgColor={state.handleMarkerBgColorChange}
          onChangeMarkerBorderColor={state.handleMarkerBorderColorChange}
          onTogglePlayerLabels={state.handleTogglePlayerLabels}
          showPlayerLabels={state.showPlayerLabels}
          onToggleMarkerType={state.handleToggleMarkerType}
          markerType={state.markerType}
          onToggleWaypoints={state.handleToggleWaypoints}
          onToggleHorizontalZones={state.handleToggleHorizontalZones}
          onToggleVerticalSpaces={state.handleToggleVerticalSpaces}
          onToggleFullScreen={state.handleToggleFullScreen}
          onPlayerSelect={setSelectedPlayer}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 56px)' }}>

          {/* Left — field stage */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Stage: field + toolbar */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0', background: 'var(--theme-stage)' }}>
              {/* TacticalField in studioMode */}
              <TacticalField
                studioMode
                showSingleMarkerHint
                waypointsMode={state.waypointsMode}
                horizontalZonesMode={state.horizontalZonesMode}
                verticalSpacesMode={state.verticalSpacesMode}
                isFullScreen={state.isFullScreen}
                onChangeFieldColor={state.handleFieldColorChange}
                onChangePlayerColor={state.handlePlayerColorChange}
                onChangeMarkerBgColor={state.handleMarkerBgColorChange}
                onChangeMarkerBorderColor={state.handleMarkerBorderColorChange}
                onChangeMarkerTextColor={state.handleMarkerTextColorChange}
                onChangeMarkerSecondaryColor={state.handleMarkerSecondaryColorChange}
                onChangeMarkerDesign={state.handleMarkerDesignChange}
                onTogglePlayerLabels={state.handleTogglePlayerLabels}
                showPlayerLabels={state.showPlayerLabels}
                onToggleMarkerType={state.handleToggleMarkerType}
                markerType={state.markerType}
                onToggleWaypoints={state.handleToggleWaypoints}
                onToggleHorizontalZones={state.handleToggleHorizontalZones}
                onToggleVerticalSpaces={state.handleToggleVerticalSpaces}
                onToggleFullScreen={state.handleToggleFullScreen}
                fieldOfViewMode={fieldOfViewMode}
                onToggleFieldOfView={() => setFieldOfViewMode(prev => !prev)}
                onPlayerSelect={setSelectedPlayer}
              />

              {/* Toolbar: 3-category CreatorsMenu rendered separately under the field */}
              <div style={{ marginTop: 16 }}>
                <CreatorsMenu
                  onChangeFieldColor={state.handleFieldColorChange}
                  onChangePlayerColor={state.handlePlayerColorChange}
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
                  onToggleFullScreen={state.handleToggleFullScreen}
                  isFullScreen={state.isFullScreen}
                  onToggleFieldOfView={() => setFieldOfViewMode(prev => !prev)}
                  fieldOfViewMode={fieldOfViewMode}
                  showSingleMarkerHint
                />
              </div>
            </div>

            {/* Animation timeline bar */}
            <div style={{ flexShrink: 0, borderTop: '1px solid var(--theme-border)', background: 'var(--theme-panel)', padding: '12px 24px' }}>
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
            </div>
          </div>

          {/* Right panel — details */}
          <div style={{ width: 420, borderLeft: '1px solid var(--theme-border)', background: 'var(--theme-panel)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
            {/* Tactic Details — styled for dark studio */}
            <div style={{ padding: 20 }}>
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
            {/* Divider */}
            <div style={{ height: 1, background: 'var(--theme-border)' }} />
            {/* Preview / Export */}
            <div style={{ padding: 20 }}>
              <Preview animation={animation.getAnimation()} />
            </div>
          </div>
        </div>
      )}

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

export default function CreateTactics() {
  return (
    <FootballFieldProvider>
      <CreateTacticsContent />
    </FootballFieldProvider>
  );
}
