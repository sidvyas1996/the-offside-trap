import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Loader2, UserPlus, SlidersHorizontal } from "lucide-react";
import EditorBar from "../components/EditorBar";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import { useTacticsForm } from "../hooks/useTacticsForm";
import { useTacticsState } from "../hooks/useTacticsState";
import { useTacticsActions } from "../hooks/useTacticsActions";
import { useAnimation } from "../hooks/useAnimation";
import FullscreenLayout from "../components/tactics/FullscreenLayout";
import TacticalField from "../components/tactics/TacticalField";
import Preview from "../components/tactics/Preview";
import AnimationTimeline from "../components/tactics/AnimationTimeline";
import CreatorsMenu from "../components/ui/creators-menu";
import KitPicker from "../components/tactics/KitPicker";
import PhaseStrip from "../components/tactics/PhaseStrip";
import PlayerEditorPanel from "../components/ui/PlayerEditorPanel";
import BottomSheet from "../components/ui/bottom-sheet";
import MobileArrowDock from "../components/tactics/MobileArrowDock";
import { useIsMobile } from "../hooks/useMediaQuery";
import { TacticEntity } from "../entities/TacticEntity";
import { ANIMATION_PRESETS, buildPresetAnimation } from "../utils/animation-presets";
import { compileMovements } from "../utils/movement-compiler";
import { useTacticV2, type AuthoredBoard } from "../hooks/useTacticV2";
import { migrateTacticToV2 } from "../../../../packages/shared/src";
import type { TacticFormData, FieldSettings, Player, AnimationData, Movement, MovementTempo, TacticArrow } from "../../../../packages/shared/src";

/**
 * Playback compression for physics-grounded time.
 *
 * V2 derives duration from distance at real football speeds, which puts a full
 * move at 10-25s — honest, but much slower than the fixed 5s loop V1 crammed
 * everything into. Dividing by this keeps every *ratio* intact while landing a
 * typical move near the old feel, and it is the one number to change if playback
 * reads too fast or too slow.
 */
const PLAYBACK_TIME_SCALE = 2;

/**
 * Phone sheets.
 *
 * The arrow palette and playback live permanently in the dock, so what is left
 * behind a sheet is the board/marker styling and the export panel — things you
 * set occasionally rather than while drawing.
 */
type MobileSheetId = 'design' | 'motion';

const CreateTacticsContent: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const {
    players, setPlayers, options, setOptions,
    oppositionPlayers, setOppositionPlayers,
    oppositionOptions, setOppositionOptions,
    showOpposition,
    ball, setBall, setIsAnimating,
    movements, setMovements, passes, setPasses, setLoopDurationMs, setShowBeats, movementMode, setMovementMode,
    arrows, setArrows, arrowTool, setArrowTool, arrowBallColor, setArrowBallColor, arrowRunColor, setArrowRunColor,
    currentBeat, setCurrentBeat, showAllBeats, setShowAllBeats, setPreviewingPhase,
  } = useFootballField();

  // Custom hooks
  const form = useTacticsForm();
  const state = useTacticsState();
  const [fieldOfViewMode, setFieldOfViewMode] = React.useState(false);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const isMobile = useIsMobile();
  const [mobileSheet, setMobileSheet] = React.useState<MobileSheetId | null>(null);
  /**
   * Collapsed tools = "show me the pitch". The stage then runs the board
   * edge-to-edge, which is the only way it actually gets bigger: a portrait
   * board is width-limited on a phone, so the gutters are the constraint, not
   * the dock's height.
   */
  const [toolsCollapsed, setToolsCollapsed] = React.useState(false);
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
    fieldOfViewMode,
    ball,
  });

  const getOppositionFieldSettings = (): FieldSettings => ({
    fieldColor: options.fieldColor || '#19a974',
    playerColor: '#ef4444',
    showPlayerLabels: state.oppShowPlayerLabels,
    markerType: state.oppMarkerType,
    markerBgColor: oppositionOptions.markerBgColor,
    markerBorderColor: oppositionOptions.markerBorderColor,
    markerTextColor: oppositionOptions.markerTextColor,
    markerSecondaryColor: oppositionOptions.markerSecondaryColor,
    markerDesign: oppositionOptions.markerDesign,
    shirtKitId: oppositionOptions.shirtKitId,
    showShirtNumbers: state.oppShowShirtNumbers,
  });

  // Tracks the visual settings last pushed to the field during playback, so a
  // frame that only moved players doesn't also rebuild the options object. That
  // object is a dependency of every marker's props, so churning it once per
  // frame re-rendered the whole field 60 times a second for nothing.
  const lastPushedVisualsRef = React.useRef<string | null>(null);

  // Animation hook — when playing back, override players + field settings
  const animation = useAnimation({
    onFrame: (framePlayers, frameFieldSettings, frameOppositionPlayers) => {
      setPlayers(framePlayers);
      if (frameOppositionPlayers) setOppositionPlayers(frameOppositionPlayers);
      if (frameFieldSettings.ball) setBall(frameFieldSettings.ball);

      const visuals = {
        fieldColor: frameFieldSettings.fieldColor,
        playerColor: frameFieldSettings.playerColor,
        showPlayerLabels: frameFieldSettings.showPlayerLabels,
        markerType: frameFieldSettings.markerType,
        ...(frameFieldSettings.markerBgColor && { markerBgColor: frameFieldSettings.markerBgColor }),
        ...(frameFieldSettings.markerBorderColor && { markerBorderColor: frameFieldSettings.markerBorderColor }),
        ...(frameFieldSettings.markerTextColor && { markerTextColor: frameFieldSettings.markerTextColor }),
        ...(frameFieldSettings.markerSecondaryColor && { markerSecondaryColor: frameFieldSettings.markerSecondaryColor }),
        ...(frameFieldSettings.markerDesign && { markerDesign: frameFieldSettings.markerDesign }),
        ...(frameFieldSettings.shirtKitId && { shirtKitId: frameFieldSettings.shirtKitId }),
        ...(frameFieldSettings.showShirtNumbers !== undefined && { showShirtNumbers: frameFieldSettings.showShirtNumbers }),
      };
      const fingerprint = JSON.stringify(visuals);
      if (fingerprint === lastPushedVisualsRef.current) return;
      lastPushedVisualsRef.current = fingerprint;
      setOptions(prev => ({ ...prev, ...visuals }));
    },
  });

  // Markers must drop their positional CSS transition while the rAF loop is
  // driving them, or they lag behind their own target position.
  useEffect(() => {
    setIsAnimating(animation.isPlaying);
  }, [animation.isPlaying, setIsAnimating]);

  // Gesture capture converts a dwell in milliseconds into a fraction of the
  // loop, so it needs the loop length that lives in the animation hook.
  useEffect(() => {
    setLoopDurationMs(animation.durationMs);
  }, [animation.durationMs, setLoopDurationMs]);


  /**
   * Which authoring surface owns the keyframes.
   *
   * Presets still write keyframes directly, so without this the recompile effect
   * below would immediately overwrite a freshly applied preset with the (empty)
   * compilation of zero movements. It also keeps tactics saved before gestures
   * existed playable instead of silently blanking them.
   */
  const [animationSource, setAnimationSource] = React.useState<'movements' | 'keyframes'>('movements');

  /**
   * Whether the tactic's arrows are its animation.
   *
   * A new tactic starts true so drawing an arrow just works. Loading a tactic
   * saved before arrows carried motion leaves it false, so those arrows stay
   * static annotation and the tactic looks exactly as it always did.
   */
  const [fromArrows, setFromArrows] = React.useState(!editId);

  // Beat badges belong on the pitch only while arrows are the animation — on a
  // static diagram they would just be clutter.
  useEffect(() => {
    setShowBeats(fromArrows);
  }, [fromArrows, setShowBeats]);

  /**
   * The board on screen is not always the board being authored.
   *
   * Two things now write poses straight into `players`: playback, and stepping to a
   * later beat to see where everyone has got to. Both are *displays*. The tactic's
   * starting shape is the thing arrows are measured from, so compiling from whatever
   * happens to be on screen would let a preview become the truth — a full-back
   * previewed 40m upfield would silently become a full-back who starts there.
   *
   * So: while you are authoring beat 1 with playback stopped, the live board *is*
   * the authored board. The moment either display takes over, the authored board
   * freezes and is restored when you come back.
   */
  const previewing = animation.isPlaying || currentBeat > 1;
  const wasPreviewingRef = React.useRef(false);
  const [authored, setAuthored] = React.useState<AuthoredBoard>({
    players,
    oppositionPlayers,
    ball,
  });

  useEffect(() => {
    setPreviewingPhase(previewing);
  }, [previewing, setPreviewingPhase]);

  /**
   * Capture and restore, deliberately in one place.
   *
   * They are mutually exclusive and the ordering between them is the whole
   * correctness argument, so splitting them across two effects just invites one to
   * run against a board the other has not finished fixing. Held as state rather
   * than a ref so a capture re-renders and the compile below sees it immediately —
   * with a ref, a drag would compile against the *previous* authored board.
   *
   * A layout effect so the restore lands before paint: a frame of the preview pose
   * showing up as the authored board would read as the tactic having changed.
   */
  React.useLayoutEffect(() => {
    if (previewing) {
      wasPreviewingRef.current = true;
      return;
    }
    if (wasPreviewingRef.current) {
      setPlayers(authored.players);
      setOppositionPlayers(authored.oppositionPlayers);
      setBall(authored.ball);
      wasPreviewingRef.current = false;
      // Emphatically do not capture on this pass: the board on screen is still the
      // preview's pose, and capturing it is exactly the corruption to avoid.
      return;
    }
    if (
      authored.players === players &&
      authored.oppositionPlayers === oppositionPlayers &&
      authored.ball === ball
    ) {
      return;
    }
    setAuthored({ players, oppositionPlayers, ball });
  }, [previewing, players, oppositionPlayers, ball, authored, setPlayers, setOppositionPlayers, setBall]);

  /**
   * The compiled tactic.
   *
   * V2: an arrow's `beat` is its phase, and duration comes out of distance over
   * speed rather than being a share of a fixed loop. That is what stops a four-unit
   * shift taking as long as a forty-unit overlap just because they share a beat.
   */
  const v2 = useTacticV2({
    arrows,
    board: authored,
    fieldSettings: getCurrentFieldSettings(),
    enabled: fromArrows,
    fps: animation.fps,
    timeScale: PLAYBACK_TIME_SCALE,
  });

  /**
   * Gesture-authored movements still compile through V1.
   *
   * `movementMode` writes `movements`/`passes`, which V2 does not yet author — only
   * the arrow surface has been moved over. Rather than silently stop animating those
   * tactics, the old compiler keeps them working, gated so the two can never both
   * own the keyframes.
   */
  const legacyGestures = !fromArrows && (movements.length > 0 || passes.nodes.length > 0);

  useEffect(() => {
    if (animationSource !== 'movements' || animation.isPlaying) return;

    if (legacyGestures) {
      const compiled = compileMovements({
        movements,
        passes,
        players,
        oppositionPlayers: showOpposition ? oppositionPlayers : undefined,
        ball,
        fieldSettings: getCurrentFieldSettings(),
        durationMs: animation.durationMs,
        fps: animation.fps,
      });
      animation.setKeyframes(compiled?.keyframes ?? []);
      return;
    }

    animation.setKeyframes(v2.keyframes);
    // getCurrentFieldSettings is rebuilt every render; the values it reads are
    // already covered by the dependencies that matter for geometry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    v2.keyframes, legacyGestures, movements, passes, players, oppositionPlayers,
    showOpposition, ball, animation.durationMs, animation.fps, animation.isPlaying,
    animationSource,
  ]);

  // V2 derives the loop length, so the playback clock has to follow it rather than
  // the other way round — a fixed loop is what forced every beat to be a share.
  useEffect(() => {
    if (animationSource !== 'movements' || legacyGestures || v2.durationMs <= 0) return;
    animation.setDuration(v2.durationMs);
  }, [v2.durationMs, animationSource, legacyGestures, animation.setDuration]);

  // Drawing anything hands ownership back to the authoring surface.
  useEffect(() => {
    if (movements.length > 0 || passes.nodes.length > 0 || (fromArrows && arrows.length > 0)) {
      setAnimationSource('movements');
    }
  }, [movements.length, passes.nodes.length, fromArrows, arrows.length]);

  // --- Phases ---------------------------------------------------------------

  /** One new beat past the end is reachable; that is how you start the next one. */
  const maxBeat = v2.phaseCount + 1;

  const handleSetPhase = React.useCallback(
    (n: number) => setCurrentBeat(Math.max(1, Math.min(n, maxBeat))),
    [maxBeat, setCurrentBeat],
  );
  const handleStep = React.useCallback(
    () => setCurrentBeat(b => Math.min(b + 1, maxBeat)),
    [maxBeat, setCurrentBeat],
  );

  // Deleting the last arrow in a beat can leave you standing past the end.
  useEffect(() => {
    setCurrentBeat(b => Math.min(b, maxBeat));
  }, [maxBeat, setCurrentBeat]);

  /**
   * Fast-forward the board to the start of the beat being authored.
   *
   * This is the whole point of Step: you draw beat 3 from where the players
   * actually are once beats 1 and 2 have played, rather than from the kick-off
   * shape. Beat 1 is left alone because that *is* the authored board.
   */
  useEffect(() => {
    if (animation.isPlaying || currentBeat <= 1) return;
    const pose = v2.boardAtPhase(currentBeat);
    setPlayers(pose.players);
    setOppositionPlayers(pose.oppositionPlayers);
    setBall(pose.ball);
  }, [currentBeat, v2.boardAtPhase, animation.isPlaying, setPlayers, setOppositionPlayers, setBall]);

  // Spacebar is Step. Guarded against text fields and focused controls, where the
  // spacebar already means something.
  useEffect(() => {
    if (!fromArrows) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.tagName === 'BUTTON' ||
          el.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      handleStep();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fromArrows, handleStep]);

  const handleUpdateMovement = (id: string, patch: Partial<Movement>) => {
    setMovements(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  const handleRemoveMovement = (id: string) => {
    setMovements(prev => prev.filter(m => m.id !== id));
  };

  /** Removing a leg also has to drop any run that was timed to arrive at it. */
  const handleRemovePassNode = (index: number) => {
    setPasses(prev => ({ ...prev, nodes: prev.nodes.filter((_, i) => i !== index) }));
    setMovements(prev => prev.map(m => {
      if (m.syncToPassNode === undefined) return m;
      if (m.syncToPassNode === index) return { ...m, syncToPassNode: undefined };
      // Later nodes shift down by one, so their links have to follow.
      return m.syncToPassNode > index ? { ...m, syncToPassNode: m.syncToPassNode - 1 } : m;
    }));
  };

  const handleToggleClosed = () => {
    setPasses(prev => ({ ...prev, closed: prev.closed === false }));
  };

  // --- Arrow motion ---------------------------------------------------------
  const patchArrow = (id: string, patch: Partial<TacticArrow>) =>
    setArrows(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));

  const handleSetArrowBeat = (id: string, beat: number) => patchArrow(id, { beat });
  const handleSetArrowTempo = (id: string, tempo: MovementTempo) => patchArrow(id, { tempo });
  const handleRemoveArrow = (id: string) => setArrows(prev => prev.filter(a => a.id !== id));

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
          ...(fs.shirtKitId && { shirtKitId: fs.shirtKitId }),
          ...(fs.showShirtNumbers !== undefined && { showShirtNumbers: fs.showShirtNumbers }),
        }));
        state.setShowPlayerLabels(fs.showPlayerLabels ?? true);
        if (fs.markerType) state.setMarkerType(fs.markerType);
        if (fs.showShirtNumbers !== undefined) state.setShowShirtNumbers(fs.showShirtNumbers);
        if (fs.fieldOfViewMode !== undefined) setFieldOfViewMode(fs.fieldOfViewMode);
        if (fs.ball) setBall(fs.ball);
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
          ...(fs.shirtKitId && { shirtKitId: fs.shirtKitId }),
          ...(fs.showShirtNumbers !== undefined && { showShirtNumbers: fs.showShirtNumbers }),
        }));
        state.setOppShowPlayerLabels(fs.showPlayerLabels ?? true);
        if (fs.markerType) state.setOppMarkerType(fs.markerType);
        if (fs.showShirtNumbers !== undefined) state.setOppShowShirtNumbers(fs.showShirtNumbers);
      }
      if (tactic.arrows && tactic.arrows.length > 0) setArrows(tactic.arrows);
      if (tactic.animation) {
        const data = tactic.animation as AnimationData;
        animation.loadAnimation(data);

        /**
         * Ask the migration what this tactic actually is.
         *
         * It answers the one question that matters on load: does this animate at
         * all? A tactic drawn before arrows carried motion has arrows but no
         * `fromArrows`, and must keep them as decoration — deciding that here, with
         * the same converter the golden tests cover, is what stops every old diagram
         * in the database from springing to life when someone opens it.
         */
        const migrated = migrateTacticToV2({
          animation: data,
          arrows: tactic.arrows ?? null,
          players: tactic.players ?? [],
          oppositionPlayers: tactic.oppositionPlayers ?? null,
          fieldSettings: tactic.fieldSettings ?? null,
        });
        if (migrated.warnings.length > 0) {
          console.info('[tactic migration]', migrated.source, migrated.warnings);
        }

        if (migrated.source === 'arrows') {
          // Arrows are the animation and V2 recompiles them from the board, so there
          // is nothing else to restore.
          setFromArrows(true);
          setAnimationSource('movements');
        } else if (migrated.source === 'movements') {
          // Gesture-authored: still V1's compiler until that surface moves over too.
          setFromArrows(false);
          if (data.passes && data.passes.nodes.length > 0) setPasses(data.passes);
          setMovements(data.movements ?? []);
          setAnimationSource('movements');
        } else {
          // Presets and pre-gesture tactics: keep the keyframes exactly as authored.
          setFromArrows(false);
          setAnimationSource('keyframes');
        }
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleApplyPreset = (presetId: string) => {
    const preset = ANIMATION_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const data = buildPresetAnimation(preset, players, getCurrentFieldSettings(), animation.fps);
    if (!data) {
      alert("Presets need a full 11-player lineup.");
      return;
    }

    // A preset is a fully sequenced pattern, so it replaces whatever is there.
    // Only interrupt when there is actually something to lose.
    const authored = movements.length + Math.max(0, passes.nodes.length - 1);
    if (authored > 0) {
      const count = authored;
      const ok = window.confirm(
        `Replace your ${count} action${count !== 1 ? 's' : ''} with the "${preset.name}" preset?`,
      );
      if (!ok) return;
    }

    // Presets author keyframes directly, so hand ownership over — otherwise the
    // recompile effect would overwrite them on the next render.
    setMovements([]);
    setPasses({ nodes: [] });
    setAnimationSource('keyframes');
    animation.loadAnimation(data);

    // Paint frame 0 onto the field ourselves: loadAnimation doesn't touch the
    // field (onFrame only fires during playback), and animation.getInterpolatedFrame
    // closes over the previous keyframes so it would be stale this tick.
    const first = data.keyframes[0];
    if (first) {
      setPlayers(first.players);
      if (first.fieldSettings.ball) setBall(first.fieldSettings.ball);
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
        fieldSettings: getCurrentFieldSettings(),
        // getAnimation carries the compiled keyframes, which is all the MP4 exporter
        // reads. The authoring source rides alongside so the tactic reopens editable
        // rather than as opaque keyframes: arrows for V2, movements for legacy
        // gestures. `tacticV2` is the compiled phase state — redundant with the
        // arrows today, but it is what lets playback stop depending on stored
        // keyframes later.
        animation: animation.keyframes.length > 0
          ? {
              ...animation.getAnimation(),
              movements,
              ...(passes.nodes.length > 0 && { passes }),
              ...(fromArrows && { fromArrows: true }),
              ...(fromArrows && v2.phaseCount > 0 && { tacticV2: v2.state }),
              loop: true,
            }
          : undefined,
        // null (not omission) so removing opposition/arrows clears them on update
        oppositionPlayers: showOpposition ? oppositionPlayers : null,
        oppositionFieldSettings: showOpposition ? getOppositionFieldSettings() : null,
        arrows: arrows.length > 0 ? arrows : null,
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

  // Description lives under the title in the header rather than in a rail panel:
  // the header already owns the tactic's identity, and a details card there just
  // restated it. It stays visible rather than folded because saving requires 10+
  // characters — a required field behind a disclosure is a trap.
  const isDescriptionShort = form.description.trim().length > 0 && form.description.trim().length < 10;
  const studioSubtitle = (
    <input
      value={form.description}
      onChange={e => form.setDescription(e.target.value)}
      placeholder="Add a description…"
      aria-label="Tactic description"
      title="Describe your tactical approach (10 characters minimum)"
      className="editor-subtitle-input"
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12.5,
        color: isDescriptionShort ? 'var(--whistle-orange)' : 'rgba(255,255,255,0.72)',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        padding: 0,
        marginTop: 1,
        width: isMobile ? '100%' : 'min(46vw, 420px)',
      }}
    />
  );

  /**
   * Phone header controls: formation pill + settings + save, per the design.
   *
   * The desktop bar's wordy "Add Opposition" / "Save Tactic" buttons are icons
   * here. Settings is an addition to the design board — the board shows only
   * the pill and save, but dropping every pitch and marker control from the
   * phone build would remove real function, so it gets the quietest treatment
   * of the three.
   */
  const mobileStudioActions = (
    <>
      <input
        value={form.formation}
        onChange={e => form.setFormation(e.target.value)}
        aria-label="Formation"
        placeholder="4-3-3"
        style={{
          width: 58, textAlign: 'center', flexShrink: 0,
          background: 'var(--playmaker-purple)',
          border: `2px solid ${/^\d+-\d+(-\d+)*$/.test(form.formation) ? 'var(--ink)' : 'var(--whistle-orange)'}`,
          borderRadius: 9, padding: '6px 4px',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
          color: '#ffffff', outline: 'none',
          boxShadow: 'var(--card-shadow)',
        }}
      />
      <button
        type="button"
        onClick={() => setMobileSheet('design')}
        aria-label="Board settings"
        style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
          background: 'var(--surface-container)', border: 'var(--border-w) solid var(--ink)',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <SlidersHorizontal size={18} strokeWidth={2.4} />
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={form.loading}
        aria-label={editId ? 'Update tactic' : 'Save tactic'}
        style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
          background: 'var(--primary)', border: 'var(--border-w) solid var(--ink)',
          boxShadow: 'var(--card-shadow)', opacity: form.loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {form.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} strokeWidth={2.4} />}
      </button>
    </>
  );

  const studioActions = (
    <>
      {/* Formation is edited where it is displayed — it used to be a read-only
          chip here and a separate input in the rail. */}
      <input
        value={form.formation}
        onChange={e => form.setFormation(e.target.value)}
        placeholder="4-3-3"
        aria-label="Formation"
        title="Formation, e.g. 4-3-3"
        style={{
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 13, fontWeight: 700,
          color: "#fff", background: "rgba(255,255,255,0.08)",
          border: `1.5px solid ${/^\d+-\d+(-\d+)*$/.test(form.formation) ? 'rgba(255,255,255,0.18)' : 'var(--whistle-orange)'}`,
          borderRadius: 10, padding: "7px 10px", width: 84, textAlign: "center",
          outline: "none",
        }}
      />
      <button
        onClick={state.handleToggleOpposition}
        type="button"
        className="editorbar-btn"
        style={{
          background: showOpposition ? 'var(--whistle-orange)' : 'rgba(255,255,255,0.06)',
          color: showOpposition ? 'var(--ink)' : '#fff',
          border: `1.5px solid ${showOpposition ? 'var(--whistle-orange)' : 'rgba(255,255,255,0.22)'}`,
        }}
        title={showOpposition ? "Remove opposition team" : "Add opposition team"}
      >
        <UserPlus size={15} />
        {isMobile ? 'Opposition' : (showOpposition ? 'vs Opposition' : 'Add Opposition')}
      </button>
      <button
        onClick={handleSubmit}
        disabled={form.loading}
        className="editorbar-btn"
        style={{ background: 'var(--primary)', color: 'var(--ink)', border: 'none', opacity: form.loading ? 0.7 : 1 }}
      >
        {form.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}
        {form.loading ? 'Saving…' : (isMobile ? 'Save' : (editId ? 'Update Tactic' : 'Save Tactic'))}
      </button>
    </>
  );

  // ---------------------------------------------------------------------------
  // Studio surfaces, declared once and placed differently per layout.
  //
  // The desktop studio is a two-column stage + 400px rail; the phone studio is a
  // full-bleed board with the same panels behind two bottom sheets. Hoisting the
  // JSX rather than forking the page is what keeps that a *placement* difference:
  // CreatorsMenu alone takes ~45 props, and a second copy of that call is a
  // second thing to keep in step every time a handler is added.
  // ---------------------------------------------------------------------------
  const fieldStage = (
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
        onToggleShirtNumbers={state.handleToggleShirtNumbers}
        showShirtNumbers={state.showShirtNumbers}
        onToggleWaypoints={state.handleToggleWaypoints}
        onToggleHorizontalZones={state.handleToggleHorizontalZones}
        onToggleVerticalSpaces={state.handleToggleVerticalSpaces}
        onToggleFullScreen={state.handleToggleFullScreen}
        fieldOfViewMode={fieldOfViewMode}
        onToggleFieldOfView={() => setFieldOfViewMode(prev => !prev)}
        onPlayerSelect={setSelectedPlayer}
        portrait={isMobile}
        fitHeight={isMobile}
      />
  );

  const creatorsMenu = (
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
        onToggleShirtNumbers={state.handleToggleShirtNumbers}
        showShirtNumbers={state.showShirtNumbers}
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
        onOppToggleShirtNumbers={state.handleOppToggleShirtNumbers}
        oppShowShirtNumbers={state.oppShowShirtNumbers}
      />
  );

  // The kit only applies to shirt markers, and each team picks its own — so the
  // panel follows the team tab the toolbar is currently on.
  const activeIsAway = showOpposition && activeTeam === 'away';
  const kitPanel = (activeIsAway ? state.oppMarkerType : state.markerType) === 'shirt' ? (
    <KitPicker
      team={activeIsAway ? 'away' : 'home'}
      value={activeIsAway ? oppositionOptions.shirtKitId : options.shirtKitId}
      onChange={activeIsAway ? state.handleOppShirtKitChange : state.handleShirtKitChange}
    />
  ) : null;

  const motionPanels = (
    <>
      {kitPanel}
      {fromArrows && (
        <PhaseStrip
          current={currentBeat}
          count={v2.phaseCount}
          onSetPhase={handleSetPhase}
          onStep={handleStep}
          showAll={showAllBeats}
          onToggleShowAll={() => setShowAllBeats(prev => !prev)}
          warnings={v2.warnings}
          durationMs={v2.durationMs}
          disabled={animation.isPlaying}
        />
      )}

      <AnimationTimeline
        arrows={arrows}
        fromArrows={fromArrows}
        currentBeat={currentBeat}
        derivedDurationMs={legacyGestures ? undefined : v2.durationMs}
        onToggleFromArrows={() => setFromArrows(prev => !prev)}
        onSetBeat={handleSetArrowBeat}
        onSetTempo={handleSetArrowTempo}
        onRemoveArrow={handleRemoveArrow}
        players={players}
        oppositionPlayers={oppositionPlayers}
        keyframeCount={animation.keyframes.length}
        isPlaying={animation.isPlaying}
        durationMs={animation.durationMs}
        fps={animation.fps}
        onPlay={animation.play}
        onPause={animation.pause}
        onSetDuration={animation.setDuration}
        onSetFps={animation.setFps}
        onApplyPreset={handleApplyPreset}
      />

      <Preview animation={animation.getAnimation()} />
    </>
  );

  return (
    <div
      className="dot-bg"
      style={
        isMobile
          // One screen, no page scroll: header, board and dock each take their
          // share of the viewport. dvh rather than vh so the browser's collapsing
          // URL bar does not push the dock off the bottom.
          // `relative` so the dock can anchor to the studio rather than the viewport.
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
          kicker="Tactics Studio"
          title={form.title}
          onTitleChange={form.setTitle}
          placeholder="Untitled Tactic"
          // The description lives in the Design sheet on a phone; the header has
          // room for one line, and the title is the one that identifies the doc.
          subtitle={isMobile ? undefined : studioSubtitle}
          actions={isMobile ? mobileStudioActions : studioActions}
          compact={isMobile}
          bare={isMobile}
        />
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
          onToggleShirtNumbers={state.handleToggleShirtNumbers}
          showShirtNumbers={state.showShirtNumbers}
          onToggleWaypoints={state.handleToggleWaypoints}
          onToggleHorizontalZones={state.handleToggleHorizontalZones}
          onToggleVerticalSpaces={state.handleToggleVerticalSpaces}
          onToggleFullScreen={state.handleToggleFullScreen}
          onPlayerSelect={setSelectedPlayer}
        />
      ) : isMobile ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            // Not transitioned: animating padding relayouts the board on every
            // frame, which re-fires the ResizeObserver behind the marker scale
            // for the whole duration. The swap should be instant anyway — the
            // point of collapsing is to see the pitch now.
            padding: toolsCollapsed ? '0 0 6px' : '0 16px 12px',
          }}
        >
          {fieldStage}
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

          {/* Left — field stage */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Stage: field + toolbar + timeline, all in one scroll flow */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 24px', background: 'var(--theme-stage)' }}>
              {fieldStage}

              {/* Toolbar */}
              <div style={{ marginTop: 16 }}>
                {creatorsMenu}
              </div>
            </div>
          </div>

          {/* Right rail — purely for authoring. Title, description and formation
              all live in the header now, so what used to be a details card here
              (restating them) is gone; Movement used to sit under the pitch, where
              it squeezed the board into a letterbox. */}
          <div style={{ width: 400, borderLeft: 'var(--border-w) solid var(--ink)', background: 'var(--surface-low)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {motionPanels}
            </div>
          </div>
        </div>
      )}

      {/* Phone: the arrow palette and playback are permanent — drawing is the
          job, and a tool picker you have to open first makes every arrow three
          taps. Everything you set only occasionally stays behind a sheet. */}
      {isMobile && !state.isFullScreen && (
        <>
          <MobileArrowDock
            arrowTool={arrowTool}
            onSetArrowTool={setArrowTool}
            currentPhase={fromArrows ? currentBeat : 1}
            phaseCount={fromArrows ? Math.max(1, v2.phaseCount) : 1}
            onStep={handleStep}
            isPlaying={animation.isPlaying}
            onPlay={animation.play}
            onPause={animation.pause}
            currentTimeMs={animation.currentTimeMs}
            durationMs={animation.durationMs}
            collapsed={toolsCollapsed}
            onToggleCollapsed={() => setToolsCollapsed(c => !c)}
          />

          <BottomSheet open={mobileSheet === 'design'} onClose={() => setMobileSheet(null)} title="Board & Motion">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {studioSubtitle && (
                <div style={{ background: 'var(--surface-low)', border: 'var(--border-w) solid var(--ink)', borderRadius: 12, padding: '10px 12px' }}>
                  <div className="kicker" style={{ marginBottom: 6 }}>Description</div>
                  {studioSubtitle}
                </div>
              )}
              <button
                type="button"
                onClick={state.handleToggleOpposition}
                className="editorbar-btn"
                style={{
                  alignSelf: 'flex-start',
                  background: showOpposition ? 'var(--whistle-orange)' : 'var(--surface-low)',
                  color: 'var(--ink)',
                  border: `2px solid ${showOpposition ? 'var(--whistle-orange)' : 'var(--ink)'}`,
                }}
              >
                <UserPlus size={15} />
                {showOpposition ? 'vs Opposition' : 'Add Opposition'}
              </button>
              {creatorsMenu}
              {motionPanels}
            </div>
          </BottomSheet>
        </>
      )}

      <PlayerEditorPanel
        player={selectedPlayer}
        allPlayers={players}
        onClose={() => setSelectedPlayer(null)}
        onApply={state.handleUpdatePlayer}
        onNameChange={state.handlePlayerNameChange}
        mobile={isMobile}
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
