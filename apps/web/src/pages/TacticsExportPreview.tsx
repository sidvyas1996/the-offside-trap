import React, { useEffect, useState } from "react";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import FootballField from "../components/FootballField";

interface ExportState {
  fieldColor: string;
  players: Array<{
    id: number;
    x: number;
    y: number;
    name: string;
    number: string;
    isCaptain?: boolean;
    hasYellowCard?: boolean;
    hasRedCard?: boolean;
    isStarPlayer?: boolean;
  }>;
  showPlayerLabels: boolean;
  markerType: 'circle' | 'shirt';
}

const TacticsExportPreviewContent: React.FC = () => {
  const { setPlayers, setOptions } = useFootballField();
  const [isReady, setIsReady] = useState(false);
  const [exportState, setExportState] = useState<ExportState | null>(null);

  const applyState = (state: ExportState) => {
    setPlayers(
      state.players.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        name: p.name,
        number: parseInt(p.number) || p.id,
        position: p.number,
        isCaptain: p.isCaptain,
        hasYellowCard: p.hasYellowCard,
        hasRedCard: p.hasRedCard,
        isStarPlayer: p.isStarPlayer,
      }))
    );
    setOptions(prev => ({
      ...prev,
      fieldColor: state.fieldColor,
      markerType: state.markerType,
      showPlayerLabels: state.showPlayerLabels,
      editable: false,
      enableContextMenu: false,
    }));
  };

  // Initial state injection (static export + first frame of video)
  useEffect(() => {
    const isFastMode = new URLSearchParams(window.location.search).has('fast');

    const checkForState = () => {
      const state = (window as any).__EXPORT_STATE__;
      if (!state) return false;

      setExportState(state);
      applyState(state);

      if (isFastMode) {
        requestAnimationFrame(() => {
          setIsReady(true);
          (window as any).__EXPORT_READY__ = true;
        });
      } else {
        setTimeout(() => {
          setIsReady(true);
          (window as any).__EXPORT_READY__ = true;
        }, 1500);
      }
      return true;
    };

    if (!checkForState()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkForState() || attempts >= 50) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Per-frame update listener (video export)
  useEffect(() => {
    const handleFrameUpdate = () => {
      const update = (window as any).__FRAME_UPDATE__;
      if (!update) return;

      applyState({
        fieldColor: update.fieldSettings?.fieldColor || '#0d4b3e',
        players: update.players,
        showPlayerLabels: update.fieldSettings?.showPlayerLabels ?? true,
        markerType: update.fieldSettings?.markerType || 'circle',
      });

      requestAnimationFrame(() => {
        (window as any).__FRAME_READY__ = true;
      });
    };

    window.addEventListener('frameUpdate', handleFrameUpdate);
    return () => window.removeEventListener('frameUpdate', handleFrameUpdate);
  }, []);

  if (!exportState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-white">Loading export preview...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--background)] flex items-center justify-center"
      style={{ padding: '20px' }}
    >
      <div
        id="export-field-container"
        className="w-full max-w-7xl"
        style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <FootballField
          size="fullscreen"
          editable={false}
          waypointsMode={false}
          horizontalZonesMode={false}
          verticalSpacesMode={false}
        />
      </div>
    </div>
  );
};

const TacticsExportPreview: React.FC = () => (
  <FootballFieldProvider>
    <TacticsExportPreviewContent />
  </FootballFieldProvider>
);

export default TacticsExportPreview;
