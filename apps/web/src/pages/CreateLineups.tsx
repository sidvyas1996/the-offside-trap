import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Loader2, Users, SlidersHorizontal } from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import EditorBar from "../components/EditorBar";
import BottomSheet from "../components/ui/bottom-sheet";
import { useIsMobile } from "../hooks/useMediaQuery";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import LineupField from "../components/tactics/LineupField";
import LineupOptions from "../components/tactics/LineupOptions";
import KitPicker from "../components/tactics/KitPicker";
import Preview from "../components/tactics/Preview";
import CreatorsMenu from "../components/ui/creators-menu";
import PlayerEditorPanel from "../components/ui/PlayerEditorPanel";
import { TacticEntity } from "../entities/TacticEntity";
import type { TacticFormData, Player } from "../../../../packages/shared/src";

const CreateLineupsContent: React.FC = () => {
  const isMobile = useIsMobile();
  const [mobileSheet, setMobileSheet] = React.useState(false);
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
          ...(fs.shirtKitId && { shirtKitId: fs.shirtKitId }),
          ...(fs.showShirtNumbers !== undefined && { showShirtNumbers: fs.showShirtNumbers }),
        }));
        state.setShowPlayerLabels(fs.showPlayerLabels ?? true);
        if (fs.markerType) state.setMarkerType(fs.markerType);
        if (fs.showShirtNumbers !== undefined) state.setShowShirtNumbers(fs.showShirtNumbers);
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
          fieldColor: options.fieldColor || '#19a974',
          playerColor: options.playerColor || '#1a1a1a',
          showPlayerLabels: state.showPlayerLabels,
          markerType: state.markerType,
          markerBgColor: options.markerBgColor,
          markerBorderColor: options.markerBorderColor,
          markerTextColor: options.markerTextColor,
          markerSecondaryColor: options.markerSecondaryColor,
          markerDesign: options.markerDesign,
          shirtKitId: options.shirtKitId,
          showShirtNumbers: state.showShirtNumbers,
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
    <div
      className="dot-bg"
      style={
        isMobile
          ? { height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' as const }
          : { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      }
    >

      {/* Contextual editor bar */}
      <div
        style={{
          flexShrink: 0,
          padding: isMobile ? '12px 14px 10px' : '14px 16px 0',
          paddingTop: isMobile ? 'calc(12px + env(safe-area-inset-top, 0px))' : undefined,
        }}
      >
        <EditorBar
          compact={isMobile}
          bare={isMobile}
          kicker="Lineup Creator"
          title={form.title}
          onTitleChange={form.setTitle}
          placeholder="Untitled Lineup"
          actions={
            <>
              {form.formation && (
                <span style={
                  isMobile
                    // Orange here, purple in the Tactics studio — the design uses
                    // the pill colour to say which builder you are in.
                    ? {
                        fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800,
                        color: '#ffffff', background: 'var(--whistle-orange)',
                        border: 'var(--border-w) solid var(--ink)', boxShadow: 'var(--card-shadow)',
                        borderRadius: 9, padding: '6px 10px', flexShrink: 0,
                      }
                    : {
                        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 13, fontWeight: 700,
                        color: "#fff", background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.18)",
                        borderRadius: 10, padding: "7px 13px",
                      }
                }>
                  {form.formation}
                </span>
              )}
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setMobileSheet(true)}
                  aria-label="Lineup settings"
                  style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
                    background: 'var(--surface-container)', border: 'var(--border-w) solid var(--ink)',
                    boxShadow: 'var(--card-shadow)', color: 'var(--on-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <SlidersHorizontal size={18} strokeWidth={2.4} />
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={form.loading}
                className={isMobile ? undefined : "editorbar-btn"}
                aria-label={editId ? 'Update lineup' : 'Save lineup'}
                style={
                  isMobile
                    ? {
                        width: 40, height: 40, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
                        background: 'var(--primary)', color: 'var(--on-primary)',
                        border: 'var(--border-w) solid var(--ink)', boxShadow: 'var(--card-shadow)',
                        opacity: form.loading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }
                    : { background: 'var(--primary)', color: 'var(--ink)', border: 'none', opacity: form.loading ? 0.7 : 1 }
                }
              >
                {form.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={isMobile ? 18 : 15} />}
                {!isMobile && (form.loading ? 'Saving…' : (editId ? 'Update Lineup' : 'Save Lineup'))}
              </button>
            </>
          }
        />
      </div>

      {/* Main area: stage left, options + preview right */}
      {/* Board + toolbar declared once; the phone stacks them and moves the
          details rail into a sheet, the desktop keeps its two columns. */}
      {(() => {
        const lineupBoard = (
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
    portrait={isMobile}
  />
        );
        const lineupToolbar = (
  <CreatorsMenu
      onChangeFieldColor={state.handleFieldColorChange}
      onChangePlayerColor={state.handlePlayerColorChange}
      onTogglePlayerLabels={state.handleTogglePlayerLabels}
      showPlayerLabels={state.showPlayerLabels}
      onToggleMarkerType={state.handleToggleMarkerType}
      markerType={state.markerType}
      onToggleShirtNumbers={state.handleToggleShirtNumbers}
      showShirtNumbers={state.showShirtNumbers}
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
        );

        // Only meaningful once the markers are shirts — a kit has nothing to
        // dress while they are circles.
        const kitPanel = state.markerType === 'shirt' ? (
          <KitPicker value={options.shirtKitId} onChange={state.handleShirtKitChange} />
        ) : null;

        if (isMobile) {
          return (
            <>
              {/* Block, not flex: the LineupField root is a card that sizes to
                  its content, so as a flex item it collapses instead of filling
                  the stage. */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 12px 12px' }}>
                {lineupBoard}
              </div>
              <BottomSheet open={mobileSheet} onClose={() => setMobileSheet(false)} title="Lineup & Kit">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {lineupToolbar}
                  {kitPanel}
                </div>
              </BottomSheet>
            </>
          );
        }

        return (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px', background: 'var(--theme-stage)' }}>
              {lineupBoard}
              <div style={{ marginTop: 16 }}>
                {lineupToolbar}
              </div>
            </div>
        <div style={{ width: 380, borderLeft: 'var(--border-w) solid var(--ink)', background: 'var(--surface-low)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '16px 16px 0' }}>
            <div className="rounded-2xl p-5" style={{ background: "var(--surface-container)", border: "var(--border-w) solid var(--ink)", boxShadow: "var(--card-shadow)" }}>
              <h2 className="panel-title mb-4">
                <span className="icon-chip"><Users size={14} /></span>
                Lineup Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="field-label">Title</label>
                  <Input
                    value={form.title}
                    onChange={e => form.setTitle(e.target.value)}
                    placeholder="e.g. Matchday XI"
                  />
                </div>
                <div>
                  <label className="field-label">Description</label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={e => form.setDescription(e.target.value)}
                    placeholder="Describe this lineup…"
                    className="!rounded-lg !p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="field-label">Formation</label>
                  <Input
                    value={form.formation}
                    onChange={e => form.setFormation(e.target.value)}
                    placeholder="e.g. 4-3-3"
                    style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", letterSpacing: "0.04em" }}
                  />
                </div>
              </div>
            </div>
          </div>
          {kitPanel && <div style={{ padding: '16px 16px 0' }}>{kitPanel}</div>}
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
        );
      })()}

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