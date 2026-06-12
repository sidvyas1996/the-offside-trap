import { useState, useEffect, useCallback } from "react";
import { useFootballField } from "../contexts/FootballFieldContext";
import type { MarkerDesign } from "../contexts/FootballFieldContext";
import { useCreateTactics } from "../contexts/CreateTacticsContext";
import { defaultLineupSingle } from "../utils/default-lineup-single";
import { defaultLineupOpposition } from "../utils/default-lineup-opposition";
import { DEFAULT_FOOTBALL_FIELD_COLOUR } from "../utils/colors";
import type { Player } from "../../../../packages/shared/src";

const WORKFLOW_STEPS = {
  START: "start",
  BUILD_LINEUPS: "build_lineups",
  TACTICS_OPTIONS: "tactics_options",
  FINAL: "final",
};

export const useTacticsState = () => {
  const { setCurrentStep: setContextStep } = useCreateTactics();
  const {
    players,
    setPlayers,
    setOptions,
    setActions,
    setDraggedPlayer,
    fieldRef,
    setOppositionPlayers,
    setOppositionOptions,
    setOppositionActions,
    setDraggedOppositionPlayer,
    showOpposition,
    setShowOpposition,
  } = useFootballField();

  // UI State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [homeColor, setHomeColor] = useState("#16A34A");
  const [showPlayerLabels, setShowPlayerLabels] = useState(true);
  const [markerType, setMarkerType] = useState<'circle' | 'shirt'>('circle');

  // Opposition-specific UI state
  const [oppShowPlayerLabels, setOppShowPlayerLabels] = useState(true);
  const [oppMarkerType, setOppMarkerType] = useState<'circle' | 'shirt'>('circle');

  // Mode States
  const [waypointsMode, setWaypointsMode] = useState(false);
  const [horizontalZonesMode, setHorizontalZonesMode] = useState(false);
  const [verticalSpacesMode, setVerticalSpacesMode] = useState(false);

  // Set context step to final for toolbar visibility
  useEffect(() => {
    setContextStep(WORKFLOW_STEPS.FINAL);
  }, [setContextStep]);

  // Initialize home players and options
  useEffect(() => {
    setPlayers(defaultLineupSingle);
    setOptions((prev) => ({
      ...prev,
      size: "fullscreen",
      editable: true,
      fieldColor: DEFAULT_FOOTBALL_FIELD_COLOUR,
      playerColor: homeColor,
      enableContextMenu: true,
    }));
  }, [setPlayers, setOptions, homeColor]);

  // Initialize opposition players when toggled on
  useEffect(() => {
    if (showOpposition) {
      setOppositionPlayers((prev) => prev.length > 0 ? prev : (defaultLineupOpposition as () => Player[])());
    }
  }, [showOpposition, setOppositionPlayers]);

  // — Home team handlers —
  // Stable identities: these feed useTacticsActions' effect deps, so an
  // unmemoized version re-fires setActions every render (infinite loop).
  const handlePlayerNameChange = useCallback((id: number, newName: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  }, [setPlayers]);

  const handleUpdatePlayer = useCallback((id: number, updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, [setPlayers]);

  const handleFieldColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, fieldColor: color }));

  const handlePlayerColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, playerColor: color }));

  const handleMarkerBgColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, markerBgColor: color }));

  const handleMarkerBorderColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, markerBorderColor: color }));

  const handleMarkerTextColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, markerTextColor: color }));

  const handleMarkerSecondaryColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, markerSecondaryColor: color }));

  const handleMarkerDesignChange = (design: MarkerDesign) =>
    setOptions((prev) => ({ ...prev, markerDesign: design }));

  const handleTogglePlayerLabels = () => {
    setShowPlayerLabels((prev) => !prev);
    setOptions((prev) => ({ ...prev, showPlayerLabels: !showPlayerLabels }));
  };

  const handleToggleMarkerType = () => {
    const newMarkerType = markerType === 'circle' ? 'shirt' : 'circle';
    setMarkerType(newMarkerType);
    setOptions((prev) => ({ ...prev, markerType: newMarkerType }));
  };

  // — Opposition team handlers —
  const handleOppPlayerNameChange = useCallback((id: number, newName: string) => {
    setOppositionPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  }, [setOppositionPlayers]);

  const handleUpdateOppositionPlayer = useCallback((id: number, updates: Partial<Player>) => {
    setOppositionPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, [setOppositionPlayers]);

  const handleOppMarkerBgColorChange = (color: string) =>
    setOppositionOptions((prev) => ({ ...prev, markerBgColor: color }));

  const handleOppMarkerBorderColorChange = (color: string) =>
    setOppositionOptions((prev) => ({ ...prev, markerBorderColor: color }));

  const handleOppMarkerTextColorChange = (color: string) =>
    setOppositionOptions((prev) => ({ ...prev, markerTextColor: color }));

  const handleOppMarkerSecondaryColorChange = (color: string) =>
    setOppositionOptions((prev) => ({ ...prev, markerSecondaryColor: color }));

  const handleOppMarkerDesignChange = (design: MarkerDesign) =>
    setOppositionOptions((prev) => ({ ...prev, markerDesign: design }));

  const handleOppTogglePlayerLabels = () => {
    setOppShowPlayerLabels((prev) => !prev);
    setOppositionOptions((prev) => ({ ...prev, showPlayerLabels: !oppShowPlayerLabels }));
  };

  const handleOppToggleMarkerType = () => {
    const newMarkerType = oppMarkerType === 'circle' ? 'shirt' : 'circle';
    setOppMarkerType(newMarkerType);
    setOppositionOptions((prev) => ({ ...prev, markerType: newMarkerType }));
  };

  // — Mode toggles —
  const handleToggleWaypoints = () => setWaypointsMode((prev) => !prev);
  const handleToggleHorizontalZones = () => setHorizontalZonesMode((prev) => !prev);
  const handleToggleVerticalSpaces = () => setVerticalSpacesMode((prev) => !prev);
  const handleToggleFullScreen = () => setIsFullScreen((prev) => !prev);
  const handleToggleOpposition = () => setShowOpposition((prev) => !prev);

  const resetTactics = () => {
    setPlayers(defaultLineupSingle);
    setWaypointsMode(false);
    setHorizontalZonesMode(false);
    setVerticalSpacesMode(false);
  };

  return {
    // State
    isFullScreen,
    homeColor,
    showPlayerLabels,
    markerType,
    waypointsMode,
    horizontalZonesMode,
    verticalSpacesMode,
    showOpposition,
    oppShowPlayerLabels,
    oppMarkerType,
    players,
    fieldRef,

    // Setters
    setIsFullScreen,
    setHomeColor,
    setShowPlayerLabels,
    setMarkerType,
    setWaypointsMode,
    setHorizontalZonesMode,
    setVerticalSpacesMode,
    setPlayers,
    setOptions,
    setActions,
    setDraggedPlayer,
    setOppositionPlayers,
    setOppositionOptions,
    setOppositionActions,
    setDraggedOppositionPlayer,
    setShowOpposition,
    setOppShowPlayerLabels,
    setOppMarkerType,

    // Home handlers
    handlePlayerNameChange,
    handleUpdatePlayer,
    handleFieldColorChange,
    handlePlayerColorChange,
    handleMarkerBgColorChange,
    handleMarkerBorderColorChange,
    handleMarkerTextColorChange,
    handleMarkerSecondaryColorChange,
    handleMarkerDesignChange,
    handleTogglePlayerLabels,
    handleToggleMarkerType,

    // Opposition handlers
    handleOppPlayerNameChange,
    handleUpdateOppositionPlayer,
    handleOppMarkerBgColorChange,
    handleOppMarkerBorderColorChange,
    handleOppMarkerTextColorChange,
    handleOppMarkerSecondaryColorChange,
    handleOppMarkerDesignChange,
    handleOppTogglePlayerLabels,
    handleOppToggleMarkerType,

    // Mode toggles
    handleToggleWaypoints,
    handleToggleHorizontalZones,
    handleToggleVerticalSpaces,
    handleToggleFullScreen,
    handleToggleOpposition,
    resetTactics,
  };
};
