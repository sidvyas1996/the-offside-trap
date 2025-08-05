import React from "react";
import FootballField from "../FootballField";
import CreatorsMenu from "../ui/creators-menu";

interface TacticalFieldProps {
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

const TacticalField: React.FC<TacticalFieldProps> = ({
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
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">Tactical Field</h2>
      <div className="w-full flex justify-center">
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
  );
};

export default TacticalField; 