import React from "react";
import FootballField from "../FootballField";
import CreatorsMenu from "../ui/creators-menu";

interface FullscreenLayoutProps {
  waypointsMode: boolean;
  horizontalZonesMode: boolean;
  verticalSpacesMode: boolean;
  isFullScreen: boolean;
  onChangeFieldColor: (color: string) => void;
  onChangePlayerColor: (color: string) => void;
  onTogglePlayerLabels: () => void;
  showPlayerLabels: boolean;
  onToggleMarkerType: () => void;
  markerType: 'circle' | 'shirt';
  onToggleWaypoints: () => void;
  onToggleHorizontalZones: () => void;
  onToggleVerticalSpaces: () => void;
  onToggleFullScreen: () => void;
}

const FullscreenLayout: React.FC<FullscreenLayoutProps> = ({
  waypointsMode,
  horizontalZonesMode,
  verticalSpacesMode,
  isFullScreen,
  onChangeFieldColor,
  onChangePlayerColor,
  onTogglePlayerLabels,
  showPlayerLabels,
  onToggleMarkerType,
  markerType,
  onToggleWaypoints,
  onToggleHorizontalZones,
  onToggleVerticalSpaces,
  onToggleFullScreen,
}) => {
  return (
    <div className="min-h-screen bg-[var(--background)] transition-all duration-300 ease-in-out">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Tactical Field</h2>
          <div className="text-sm text-[var(--text-secondary)]">
            Full Screen Mode - Drag players to position them
          </div>
        </div>
        <div className="w-full flex justify-center items-center">
          <FootballField 
            waypointsMode={waypointsMode} 
            horizontalZonesMode={horizontalZonesMode}
            verticalSpacesMode={verticalSpacesMode}
            isFullScreen={isFullScreen}
          />
        </div>
        <div className="mt-4">
          <CreatorsMenu
            onChangeFieldColor={onChangeFieldColor}
            onChangePlayerColor={onChangePlayerColor}
            onTogglePlayerLabels={onTogglePlayerLabels}
            showPlayerLabels={showPlayerLabels}
            onToggleMarkerType={onToggleMarkerType}
            markerType={markerType}
            onToggleWaypoints={onToggleWaypoints}
            waypointsMode={waypointsMode}
            onToggleHorizontalZones={onToggleHorizontalZones}
            horizontalZonesMode={horizontalZonesMode}
            onToggleVerticalSpaces={onToggleVerticalSpaces}
            verticalSpacesMode={verticalSpacesMode}
            onToggleFullScreen={onToggleFullScreen}
            isFullScreen={isFullScreen}
          />
        </div>
      </div>
    </div>
  );
};

export default FullscreenLayout; 