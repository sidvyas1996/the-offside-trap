import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Loader2, SlidersHorizontal, Palette, Camera, Layers, Shirt, Circle, CaseSensitive, RotateCcw, RotateCw, ChevronUp, ChevronDown } from "lucide-react";
import EditorBar from "../components/EditorBar";
import BottomSheet from "../components/ui/bottom-sheet";
import { useIsMobile } from "../hooks/useMediaQuery";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import LineupField from "../components/tactics/LineupField";
import LineupOptions, { FORMATION_PRESETS } from "../components/tactics/LineupOptions";
import CreatorsMenu from "../components/ui/creators-menu";
import PlayerEditorPanel from "../components/ui/PlayerEditorPanel";
import { TacticEntity } from "../entities/TacticEntity";
import type { TacticFormData, Player } from "../../../../packages/shared/src";

const CreateLineupsContent: React.FC = () => {
  const isMobile = useIsMobile();
  const [mobileSheet, setMobileSheet] = React.useState(false);
  const [pitchTab, setPitchTab] = useState<"style" | "camera" | "overlays">("style");
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const { players, options, setPlayers, setOptions } = useFootballField();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Custom hooks
  const form = useTacticsForm();
  const state = useTacticsState();
  useTacticsActions(
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

  const handleSnapToFormation = (formationName: string) => {
    form.setFormation(formationName);
    const preset = FORMATION_PRESETS[formationName] || FORMATION_PRESETS["4-3-3"];
    if (!preset) return;
    setPlayers((prevPlayers) => {
      return prevPlayers.map((p, idx) => {
        const posInfo = preset[idx] || preset[preset.length - 1];
        return {
          ...p,
          x: posInfo.x,
          y: posInfo.y,
          position: posInfo.position,
        };
      });
    });
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
        formation: form.formation || "4-3-3",
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
      className="dot-bg min-h-screen"
      style={{
        padding: isMobile ? "12px" : "20px 28px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: isMobile ? 12 : 18 }}>
        {/* Editor pill — the same header the Studio uses */}
        <EditorBar
          kicker="Lineup Creator"
          title={form.title}
          onTitleChange={form.setTitle}
          placeholder="Matchday XI — Press high, trap late"
          compact={isMobile}
          bare={isMobile}
          actions={
            <>
              <span className="chip-formation" style={isMobile ? { width: 62, padding: '6px 4px', fontSize: 12, borderRadius: 9 } : undefined}>
                {form.formation || "4-3-3"}
              </span>

              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setMobileSheet(true)}
                  aria-label="Lineup settings"
                  style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0, cursor: "pointer",
                    background: "var(--surface-container)", border: "var(--border-w) solid var(--ink)",
                    boxShadow: "var(--card-shadow)", color: "var(--on-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <SlidersHorizontal size={18} strokeWidth={2.4} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMobileSheet(!mobileSheet)}
                  className="editorbar-btn editorbar-btn--ghost"
                >
                  <SlidersHorizontal size={14} /> Setup
                </button>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={form.loading}
                className="editorbar-btn editorbar-btn--primary"
              >
                {form.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}
                {form.loading ? "Saving…" : editId ? "Update Lineup" : "Save Lineup"}
              </button>
            </>
          }
        />

        {/* Main Workspace Layout: Pitch Stage Left, Options Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Pitch Stage */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 relative">
            <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: isMobile ? 420 : 620 }}>
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

              {/* Floating Pitch Toolbar Overlay at Bottom Center */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto max-w-[95%]">
                {/* Tab selector */}
                <div className="pitch-toolbar-tabs">
                  {([
                    { id: "style", label: "Style", Icon: Palette },
                    { id: "camera", label: "Camera", Icon: Camera },
                    { id: "overlays", label: "Overlays", Icon: Layers },
                  ] as const).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPitchTab(id)}
                      className={`pitch-toolbar-tab${pitchTab === id ? " active" : ""}`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>

                {/* Sub-controls for active tab */}
                <div className="pitch-toolbar flex-wrap justify-center" style={{ gap: 10, padding: "8px 16px" }}>
                  {pitchTab === "style" && (
                    <>
                      <button
                        type="button"
                        onClick={state.handleToggleMarkerType}
                        className={`tool-btn${state.markerType === "shirt" ? " active" : ""}`}
                        style={{ fontSize: 12, padding: "5px 12px" }}
                      >
                        <Shirt size={14} /> Jersey
                      </button>
                      <button
                        type="button"
                        onClick={state.handleToggleMarkerType}
                        className={`tool-btn${state.markerType === "circle" ? " active" : ""}`}
                        style={{ fontSize: 12, padding: "5px 12px" }}
                      >
                        <Circle size={14} /> Circle
                      </button>

                      <div className="tool-divider" />

                      <div className="flex items-center gap-1.5">
                        {[
                          { color: '#c6f24e', name: 'Lime' },
                          { color: '#15803d', name: 'Green' },
                          { color: '#2563eb', name: 'Blue' },
                          { color: '#ea580c', name: 'Orange' },
                          { color: '#111827', name: 'Dark' },
                        ].map((s) => (
                          <button
                            key={s.color}
                            type="button"
                            title={s.name}
                            onClick={() => state.handleMarkerBgColorChange(s.color)}
                            className={`tool-swatch${options.markerBgColor === s.color ? " active" : ""}`}
                            style={{ background: s.color }}
                          />
                        ))}
                      </div>

                      <div className="tool-divider" />

                      <button
                        type="button"
                        onClick={state.handleTogglePlayerLabels}
                        className={`tool-btn${state.showPlayerLabels ? " active" : ""}`}
                        style={{ fontSize: 12, padding: "5px 12px" }}
                      >
                        <CaseSensitive size={14} /> Names
                      </button>
                    </>
                  )}

                  {pitchTab === "camera" && (
                    <>
                      <button type="button" onClick={handleRotateLeft} className="tool-btn" style={{ fontSize: 12, padding: "5px 12px" }}>
                        <RotateCcw size={14} /> Rotate left
                      </button>
                      <button type="button" onClick={handleRotateRight} className="tool-btn" style={{ fontSize: 12, padding: "5px 12px" }}>
                        <RotateCw size={14} /> Rotate right
                      </button>
                      <div className="tool-divider" />
                      <button type="button" onClick={handleTiltUp} className="tool-btn" style={{ fontSize: 12, padding: "5px 12px" }}>
                        <ChevronUp size={14} /> Tilt up
                      </button>
                      <button type="button" onClick={handleTiltDown} className="tool-btn" style={{ fontSize: 12, padding: "5px 12px" }}>
                        <ChevronDown size={14} /> Tilt down
                      </button>
                    </>
                  )}

                  {pitchTab === "overlays" && (
                    <>
                      <button
                        type="button"
                        onClick={state.handleToggleHorizontalZones}
                        className={`tool-btn${state.horizontalZonesMode ? " active" : ""}`}
                        style={{ fontSize: 12, padding: "5px 12px" }}
                      >
                        Horizontal zones
                      </button>
                      <button
                        type="button"
                        onClick={state.handleToggleVerticalSpaces}
                        className={`tool-btn${state.verticalSpacesMode ? " active" : ""}`}
                        style={{ fontSize: 12, padding: "5px 12px" }}
                      >
                        Vertical spaces
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Options Panel */}
          <div className="lg:col-span-5 xl:col-span-4">
            <LineupOptions
              title={form.title}
              onTitleChange={form.setTitle}
              description={form.description}
              onDescriptionChange={form.setDescription}
              formation={form.formation}
              onFormationChange={form.setFormation}
              onSnapToFormation={handleSnapToFormation}
              onSelectPlayer={setSelectedPlayer}
              selectedPlayerId={selectedPlayer?.id}
            />
          </div>
        </div>

        {/* Mobile Setup Bottom Sheet */}
        {isMobile && (
          <BottomSheet open={mobileSheet} onClose={() => setMobileSheet(false)} title="Pitch Settings">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            </div>
          </BottomSheet>
        )}
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

