import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Loader2, Swords } from "lucide-react";
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
  const {
    players, setPlayers, options, setOptions,
    oppositionPlayers, setOppositionPlayers,
    oppositionOptions, setOppositionOptions,
    showOpposition,
    arrows, setArrows, arrowTool, setArrowTool, arrowBallColor, setArrowBallColor, arrowRunColor, setArrowRunColor,
  } = useFootballField();

  // Custom hooks
  const form = useTacticsForm();
  const state = useTacticsState();
  const [fieldOfViewMode, setFieldOfViewMode] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [activeTeam, setActiveTeam] = React.useState<'home' | 'away'>('home');

  const actions = useTacticsActions(
    state.players,
    state.setPlayers,
    state.setActions,
    state.setDraggedPlayer,
    state.fieldRef,
    state.handlePlayerNameChange,
    state.handleUpdatePlayer,
    // Opposition
    oppositionPlayers,
    state.setOppositionPlayers,
    state.setOppositionActions,
    state.setDraggedOppositionPlayer,
    state.handleOppPlayerNameChange,
    state.handleUpdateOppositionPlayer,
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

  const getOppositionFieldSettings = (): FieldSettings => ({
    fieldColor: options.fieldColor || '#0d4b3e',
    playerColor: '#ef4444',
    showPlayerLabels: state.oppShowPlayerLabels,
    markerType: state.oppMarkerType,
    markerBgColor: oppositionOptions.markerBgColor,
    markerBorderColor: oppositionOptions.markerBorderColor,
    markerTextColor: oppositionOptions.markerTextColor,
    markerSecondaryColor: oppositionOptions.markerSecondaryColor,
    markerDesign: oppositionOptions.markerDesign,
  });

  // Animation hook — when playing back, override players + field settings
  const animation = useAnimation({
    onFrame: (framePlayers, frameFieldSettings, frameOppositionPlayers) => {
      setPlayers(framePlayers);
      if (frameOppositionPlayers) setOppositionPlayers(frameOppositionPlayers);
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
      if (tactic.oppositionPlayers && tactic.oppositionPlayers.length > 0) {
        setOppositionPlayers(tactic.oppositionPlayers);
        state.setShowOpposition(true);
      }
      if (tactic.oppositionFieldSettings) {
        const fs = tactic.oppositionFieldSettings;
        setOppositionOptions(prev => ({
          ...prev,
          showPlayerLabels: fs.showPlayerLabels ?? prev.showPlayerLabels,
          markerType: fs.markerType || prev.markerType,
          ...(fs.markerBgColor && { markerBgColor: fs.markerBgColor }),
          ...(fs.markerBorderColor && { markerBorderColor: fs.markerBorderColor }),
          ...(fs.markerTextColor && { markerTextColor: fs.markerTextColor }),
          ...(fs.markerSecondaryColor && { markerSecondaryColor: fs.markerSecondaryColor }),
          ...(fs.markerDesign && { markerDesign: fs.markerDesign }),
        }));
        state.setOppShowPlayerLabels(fs.showPlayerLabels ?? true);
        if (fs.markerType) state.setOppMarkerType(fs.markerType);
      }
      if (tactic.arrows && tactic.arrows.length > 0) setArrows(tactic.arrows);
      if (tactic.animation) animation.loadAnimation(tactic.animation as AnimationData);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleAddKeyframe = () => {
    animation.addKeyframe(
      players,
      getCurrentFieldSettings(),
      showOpposition ? oppositionPlayers : undefined,
    );
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
        ...(showOpposition && {
          oppositionPlayers,
          oppositionFieldSettings: getOppositionFieldSettings(),
        }),
        ...(arrows.length > 0 && { arrows }),
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

  // Switch active team tab to 'away' automatically when opposition is turned on
  useEffect(() => {
    if (!showOpposition) setActiveTeam('home');
  }, [showOpposition]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Studio top bar */}
      <div className="glass-bar" style={{ padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {renderBackButton(() => navigate(-1))}
          <div style={{ width: 1, height: 26, background: 'var(--hairline-strong)' }} />
          <div>
            <div className="kicker" style={{ marginBottom: 1 }}>Tactics Studio</div>
            <input
              className="studio-title-input"
              value={form.title}
              onChange={e => form.setTitle(e.target.value)}
              placeholder="Untitled Tactic"
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* formation badge */}
          {form.formation && <span className="chip-mono">{form.formation}</span>}

          {/* Opposition toggle */}
          <Button
            onClick={state.handleToggleOpposition}
            variant="outline"
            type="button"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, padding: '7px 14px',
              borderColor: showOpposition ? 'rgba(239,68,68,0.5)' : undefined,
              background: showOpposition ? 'rgba(239,68,68,0.10)' : undefined,
              color: showOpposition ? '#f87171' : undefined,
              borderRadius: 9,
            }}
            title={showOpposition ? "Remove opposition team" : "Add opposition team"}
          >
            <Swords size={14} />
            {showOpposition ? 'vs Opposition' : 'Add Opposition'}
          </Button>

          <Button onClick={handleSubmit} disabled={form.loading} className="btn-primary" style={{ padding: '8px 18px', borderRadius: 9 }}>
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
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 58px)' }}>

          {/* Left — field stage */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Stage: field + toolbar */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0', background: 'var(--theme-stage)' }}>
              <TacticalField
                studioMode
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

              {/* Toolbar */}
              <div style={{ marginTop: 16 }}>
                <CreatorsMenu
                  onChangeFieldColor={state.handleFieldColorChange}
                  onChangePlayerColor={state.handlePlayerColorChange}
                  // Home team marker props
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
                    // Arrow tools
                  arrowTool={arrowTool}
                  onSetArrowTool={setArrowTool}
                  arrowBallColor={arrowBallColor}
                  onChangeArrowBallColor={setArrowBallColor}
                  arrowRunColor={arrowRunColor}
                  onChangeArrowRunColor={setArrowRunColor}
                  onClearArrows={() => setArrows([])}
                  // Team tabs
                  showOpposition={showOpposition}
                  activeTeam={activeTeam}
                  onSetActiveTeam={setActiveTeam}
                  // Away team marker props
                  oppMarkerBgColor={oppositionOptions.markerBgColor}
                  oppMarkerBorderColor={oppositionOptions.markerBorderColor}
                  oppMarkerTextColor={oppositionOptions.markerTextColor}
                  oppMarkerSecondaryColor={oppositionOptions.markerSecondaryColor}
                  oppMarkerDesign={oppositionOptions.markerDesign}
                  onChangeOppMarkerBgColor={state.handleOppMarkerBgColorChange}
                  onChangeOppMarkerBorderColor={state.handleOppMarkerBorderColorChange}
                  onChangeOppMarkerTextColor={state.handleOppMarkerTextColorChange}
                  onChangeOppMarkerSecondaryColor={state.handleOppMarkerSecondaryColorChange}
                  onChangeOppMarkerDesign={state.handleOppMarkerDesignChange}
                  onOppTogglePlayerLabels={state.handleOppTogglePlayerLabels}
                  oppShowPlayerLabels={state.oppShowPlayerLabels}
                  onOppToggleMarkerType={state.handleOppToggleMarkerType}
                  oppMarkerType={state.oppMarkerType}
                />
              </div>
            </div>

            {/* Animation timeline bar */}
            <div style={{ flexShrink: 0, borderTop: '1px solid var(--hairline)', background: 'var(--surface-low)', padding: '12px 24px' }}>
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
          <div style={{ width: 400, borderLeft: '1px solid var(--hairline)', background: 'var(--surface-low)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: 16 }}>
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
            <div style={{ padding: '0 16px 16px' }}>
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
