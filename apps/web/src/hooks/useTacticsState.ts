import { useState, useEffect } from "react";
import { useFootballField } from "../contexts/FootballFieldContext";
import { useCreateTactics } from "../contexts/CreateTacticsContext";
import { defaultLineupSingle } from "../utils/default-lineup-single";
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
  } = useFootballField();

  // UI State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [homeColor, setHomeColor] = useState("#16A34A");
  const [showPlayerLabels, setShowPlayerLabels] = useState(true);
  const [markerType, setMarkerType] = useState<'circle' | 'shirt'>('circle');
  
  // Mode States
  const [waypointsMode, setWaypointsMode] = useState(false);
  const [horizontalZonesMode, setHorizontalZonesMode] = useState(false);
  const [verticalSpacesMode, setVerticalSpacesMode] = useState(false);

  // Set context step to final for toolbar visibility
  useEffect(() => {
    setContextStep(WORKFLOW_STEPS.FINAL);
  }, [setContextStep]);

  // Initialize players and actions
  useEffect(() => {
    setPlayers(defaultLineupSingle);
    setOptions((prev) => ({
      ...prev,
      size: "fullscreen",
      editable: true,
      fieldColor: DEFAULT_FOOTBALL_FIELD_COLOUR,
      playerColor: homeColor,
      enableContextMenu: true
    }));
  }, [setPlayers, setOptions, homeColor]);

  const handlePlayerNameChange = (id: number, newName: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p)),
    );
  };

  const handleUpdatePlayer = (id: number, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const handleFieldColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, fieldColor: color }));

  const handlePlayerColorChange = (color: string) =>
    setOptions((prev) => ({ ...prev, playerColor: color }));

  const handleTogglePlayerLabels = () => {
    setShowPlayerLabels((prev) => !prev);
    setOptions((prev) => ({ ...prev, showPlayerLabels: !showPlayerLabels }));
  };

  const handleToggleMarkerType = () => {
    const newMarkerType = markerType === 'circle' ? 'shirt' : 'circle';
    setMarkerType(newMarkerType);
    setOptions((prev) => ({ ...prev, markerType: newMarkerType }));
  };

  const handleToggleWaypoints = () => {
    setWaypointsMode((prev) => !prev);
  };

  const handleToggleHorizontalZones = () => {
    setHorizontalZonesMode((prev) => !prev);
  };

  const handleToggleVerticalSpaces = () => {
    setVerticalSpacesMode((prev) => !prev);
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

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
    players,
    fieldRef,

    // Actions
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

    // Handlers
    handlePlayerNameChange,
    handleUpdatePlayer,
    handleFieldColorChange,
    handlePlayerColorChange,
    handleTogglePlayerLabels,
    handleToggleMarkerType,
    handleToggleWaypoints,
    handleToggleHorizontalZones,
    handleToggleVerticalSpaces,
    handleToggleFullScreen,
    resetTactics,
  };
}; 