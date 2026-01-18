import React, { useEffect, useState } from "react";
import { FootballFieldProvider, useFootballField } from "../contexts/FootballFieldContext";
import LineupField from "../components/tactics/LineupField";

interface ExportState {
  rotationAngle: number;
  tiltAngle: number;
  zoomLevel: number;
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
  waypointsMode: boolean;
  horizontalZonesMode: boolean;
  verticalSpacesMode: boolean;
}

const ExportPreviewContent: React.FC = () => {
  const { setPlayers, setOptions } = useFootballField();
  const [exportState, setExportState] = useState<ExportState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Poll for state in case it's injected after component mounts
    const checkForState = () => {
      const state = (window as any).__EXPORT_STATE__;
      if (state) {
        setExportState(state);
        
        // Update players in context
        setPlayers(state.players.map(p => ({
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
        })));
        
        // Update options
        setOptions((prev) => ({
          ...prev,
          fieldColor: state.fieldColor,
          markerType: state.markerType,
          showPlayerLabels: state.showPlayerLabels,
        }));
        
        // Wait for React to update and 3D transforms to render
        setTimeout(() => {
          setIsReady(true);
          // Signal to Playwright that we're ready
          (window as any).__EXPORT_READY__ = true;
        }, 1500);
        return true;
      }
      return false;
    };

    // Check immediately
    if (!checkForState()) {
      // If not found, poll every 100ms for up to 5 seconds
      let attempts = 0;
      const maxAttempts = 50;
      const interval = setInterval(() => {
        attempts++;
        if (checkForState() || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [setPlayers, setOptions]);

  if (!exportState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-white">Loading export preview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 flex items-center justify-center" style={{ margin: 0, padding: '20px' }}>
      <div 
        id="export-field-container"
        className="w-full max-w-7xl"
        style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <LineupField
          waypointsMode={exportState.waypointsMode}
          horizontalZonesMode={exportState.horizontalZonesMode}
          verticalSpacesMode={exportState.verticalSpacesMode}
          onChangeFieldColor={() => {}}
          onChangePlayerColor={() => {}}
          onTogglePlayerLabels={() => {}}
          showPlayerLabels={exportState.showPlayerLabels}
          onToggleMarkerType={() => {}}
          markerType={exportState.markerType}
          onToggleWaypoints={() => {}}
          onToggleHorizontalZones={() => {}}
          onToggleVerticalSpaces={() => {}}
          rotationAngle={exportState.rotationAngle}
          tiltAngle={exportState.tiltAngle}
          zoomLevel={exportState.zoomLevel}
        />
      </div>
    </div>
  );
};

const ExportPreview: React.FC = () => {
  return (
    <FootballFieldProvider>
      <ExportPreviewContent />
    </FootballFieldProvider>
  );
};

export default ExportPreview;

