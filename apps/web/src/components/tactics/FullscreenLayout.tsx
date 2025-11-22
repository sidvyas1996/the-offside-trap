import React from "react";
import LineupField from "./LineupField";
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
  rotationAngle?: number;
  tiltAngle?: number;
  onRotationChange?: (angle: number) => void;
  onTiltChange?: (angle: number) => void;
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
  rotationAngle,
  tiltAngle,
  onRotationChange,
  onTiltChange,
}) => {
  return (
    <div className="min-h-screen bg-[var(--background)] transition-all duration-300 ease-in-out">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Lineup Field</h2>
          <div className="text-sm text-[var(--text-secondary)]">
            Full Screen Mode - Drag players to position them
          </div>
        </div>
        <LineupField
          waypointsMode={waypointsMode}
          horizontalZonesMode={horizontalZonesMode}
          verticalSpacesMode={verticalSpacesMode}
          isFullScreen={isFullScreen}
          onChangeFieldColor={onChangeFieldColor}
          onChangePlayerColor={onChangePlayerColor}
          onTogglePlayerLabels={onTogglePlayerLabels}
          showPlayerLabels={showPlayerLabels}
          onToggleMarkerType={onToggleMarkerType}
          markerType={markerType}
          onToggleWaypoints={onToggleWaypoints}
          onToggleHorizontalZones={onToggleHorizontalZones}
          onToggleVerticalSpaces={onToggleVerticalSpaces}
          onToggleFullScreen={onToggleFullScreen}
          rotationAngle={rotationAngle}
          tiltAngle={tiltAngle}
          onRotationChange={onRotationChange}
          onTiltChange={onTiltChange}
        />
      </div>
    </div>
  );
};

export default FullscreenLayout; 