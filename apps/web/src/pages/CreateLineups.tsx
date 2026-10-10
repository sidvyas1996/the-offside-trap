import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Loader2, SlidersHorizontal, Palette, Camera, Layers, Shirt, Circle, CaseSensitive, RotateCcw, Hash, Image as ImageIcon } from "lucide-react";
import { api } from "../lib/api";
import { exportErrorMessage } from "../utils/export-error";
import EditorBar from "../components/EditorBar";
import BottomSheet from "../components/ui/bottom-sheet";
import RotationDial from "../components/ui/RotationDial";
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

/**
 * Resting camera: square-on bearing, broadcast tilt, pulled back a touch.
 *
 * 90% rather than a full 100%: at 100% the board spans the frame exactly, so
 * any rotation immediately crops its corners. The margin buys room to turn.
 */
const DEFAULT_CAMERA = { rotation: 0, tilt: 28, zoom: 0.9 };

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, suffix, onChange }) => (
  <label className="tool-slider-row">
    <span className="tool-slider-label">{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="tool-range"
    />
    <span className="tool-slider-value">
      {Math.round(value)}
      {suffix}
    </span>
  </label>
);

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
  const [rotationAngle, setRotationAngle] = useState(DEFAULT_CAMERA.rotation);
  const [tiltAngle, setTiltAngle] = useState(DEFAULT_CAMERA.tilt);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_CAMERA.zoom);

  // Rotation and tilt handlers. Rotation is deliberately left unwrapped: 359 ->
  // 0 reads to CSS as a full turn backwards and animates the whole way round.
  const handleRotateLeft = () => {
    setRotationAngle((prev) => prev - 15);
  };

  const handleRotateRight = () => {
    setRotationAngle((prev) => prev + 15);
  };

  const [isExporting, setIsExporting] = useState<null | "png" | "jpg">(null);

  /**
   * Render the board server-side and hand back the image.
   *
   * The whole look travels with the request — camera, kit, marker colours and
   * whichever overlays are showing — because the exporter re-renders this same
   * board from the payload rather than photographing the page.
   */
  const handleExport = async (format: "png" | "jpg") => {
    setIsExporting(format);
    try {
      const response = await api.post(
        "/export/field",
        {
          rotationAngle,
          tiltAngle,
          zoomLevel,
          fieldColor: options.fieldColor || "#19a974",
          players: players.map((player) => ({
            id: player.id,
            x: player.x,
            y: player.y,
            name: player.name || `Player ${player.number}`,
            // The squad number, or a short code if one was typed on the marker.
            // `position` also carries the squad list's role name, which would
            // otherwise arrive at the exporter as the shirt's number.
            number:
              player.position && player.position.length <= 2
                ? player.position
                : player.number.toString(),
            isCaptain: player.isCaptain,
            hasYellowCard: player.hasYellowCard,
            hasRedCard: player.hasRedCard,
            isStarPlayer: player.isStarPlayer,
          })),
          showPlayerLabels: state.showPlayerLabels,
          markerType: state.markerType,
          showShirtNumbers: state.showShirtNumbers,
          shirtKitId: options.shirtKitId,
          markerBgColor: options.markerBgColor,
          markerBorderColor: options.markerBorderColor,
          markerTextColor: options.markerTextColor,
          markerSecondaryColor: options.markerSecondaryColor,
          markerDesign: options.markerDesign,
          waypointsMode: false,
          horizontalZonesMode: state.horizontalZonesMode,
          verticalSpacesMode: state.verticalSpacesMode,
          format,
          previewType: "lineup",
        },
        { responseType: "blob" },
      );

      const slug =
        (form.title || "lineup").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lineup";
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting lineup:", error);
      alert(exportErrorMessage(error, "Failed to export image. Please try again."));
    } finally {
      setIsExporting(null);
    }
  };

  // Both halves of the marker style are kept in step the way the toolbar's own
  // toggle does it — the board reads the state, the save payload reads options.
  const handleUseShirtMarkers = () => {
    state.setMarkerType('shirt');
    setOptions((prev) => ({ ...prev, markerType: 'shirt' }));
  };

  const handleTiltUp = () => {
    setTiltAngle((prev) => Math.min(45, prev + 5));
  };

  const handleTiltDown = () => {
    setTiltAngle((prev) => Math.max(0, prev - 5));
  };

  // Stepped zoom for the phone's +/- buttons. They move to the next stop past
  // wherever the slider left things rather than matching a stop exactly, so any
  // value in between — the 90% resting zoom included — still steps.
  const ZOOM_STEPS = [0.75, 0.9, 1.0, 1.2, 1.5];
  const EPSILON = 0.001;
  const handleZoomOut = () => {
    setZoomLevel((z) => [...ZOOM_STEPS].reverse().find((s) => s < z - EPSILON) ?? z);
  };

  const handleZoomIn = () => {
    setZoomLevel((z) => ZOOM_STEPS.find((s) => s > z + EPSILON) ?? z);
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
            <div className="relative">
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
            </div>

            {/* Pitch Toolbar (below pitch, no longer overlapping it) */}
            <div className="flex flex-col items-center gap-2 mx-auto max-w-[95%]">
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

                    {/* A circle always carries its number, so this only has
                        something to turn off once the markers are shirts. */}
                    {state.markerType === "shirt" && (
                      <button
                        type="button"
                        onClick={state.handleToggleShirtNumbers}
                        className={`tool-btn${state.showShirtNumbers ? " active" : ""}`}
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        title={state.showShirtNumbers ? "Hide numbers on shirts" : "Show numbers on shirts"}
                      >
                        <Hash size={14} /> Numbers
                      </button>
                    )}

                    <div className="tool-divider" />

                    <label className="tool-colour" title="Number colour">
                      <Hash size={13} />
                      <span className="tool-swatch" style={{ background: options.markerTextColor ?? "#ffffff" }} />
                      <input
                        type="color"
                        value={options.markerTextColor ?? "#ffffff"}
                        onChange={(e) => state.handleMarkerTextColorChange(e.target.value)}
                        aria-label="Number colour"
                      />
                    </label>
                  </>
                )}

                {pitchTab === "camera" && (
                  <>
                    <RotationDial rotation={rotationAngle} onChange={setRotationAngle} />

                    <div className="flex flex-col gap-1.5" style={{ minWidth: 180 }}>
                      <SliderRow label="Tilt" value={tiltAngle} min={0} max={45} suffix="°" onChange={setTiltAngle} />
                      <SliderRow
                        label="Zoom"
                        value={Math.round(zoomLevel * 100)}
                        min={75}
                        max={150}
                        suffix="%"
                        onChange={(v) => setZoomLevel(v / 100)}
                      />
                    </div>

                    <div className="tool-divider" />

                    <button
                      type="button"
                      onClick={() => {
                        // Settle on the nearest square-on turn rather than a
                        // literal 0: a camera spun twice round should come back
                        // the short way, not rewind everywhere it has been.
                        setRotationAngle(
                          (r) => Math.round((r - DEFAULT_CAMERA.rotation) / 360) * 360 + DEFAULT_CAMERA.rotation,
                        );
                        setTiltAngle(DEFAULT_CAMERA.tilt);
                        setZoomLevel(DEFAULT_CAMERA.zoom);
                      }}
                      className="tool-btn"
                      style={{ fontSize: 12, padding: "5px 12px" }}
                      title="Reset camera"
                    >
                      <RotateCcw size={14} /> Reset
                    </button>

                    <div className="tool-divider" />

                    {(["png", "jpg"] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => handleExport(format)}
                        disabled={isExporting !== null}
                        className="tool-btn"
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        title={`Export this view as ${format.toUpperCase()}`}
                      >
                        {isExporting === format ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ImageIcon size={14} />
                        )}
                        {format.toUpperCase()}
                      </button>
                    ))}
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
              markerType={state.markerType}
              onUseShirtMarkers={handleUseShirtMarkers}
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

