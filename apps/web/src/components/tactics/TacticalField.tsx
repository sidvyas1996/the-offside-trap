import React from "react";
import FootballField from "../FootballField";
import CreatorsMenu from "../ui/creators-menu";

interface TacticalFieldProps {
  waypointsMode: boolean;
  horizontalZonesMode: boolean;
  verticalSpacesMode: boolean;
  fieldOfViewMode?: boolean;
  isFullScreen: boolean;
  onChangeFieldColor: (color: string) => void;
  onChangePlayerColor: (color: string) => void;
  markerBgColor?: string;
  markerBorderColor?: string;
  markerTextColor?: string;
  markerSecondaryColor?: string;
  markerDesign?: import('../../contexts/FootballFieldContext').MarkerDesign;
  onChangeMarkerBgColor?: (color: string) => void;
  onChangeMarkerBorderColor?: (color: string) => void;
  onChangeMarkerTextColor?: (color: string) => void;
  onChangeMarkerSecondaryColor?: (color: string) => void;
  onChangeMarkerDesign?: (design: import('../../contexts/FootballFieldContext').MarkerDesign) => void;
  onTogglePlayerLabels: () => void;
  showPlayerLabels: boolean;
  onToggleMarkerType: () => void;
  markerType: 'circle' | 'shirt';
  onToggleWaypoints: () => void;
  onToggleHorizontalZones: () => void;
  onToggleVerticalSpaces: () => void;
  onToggleFullScreen: () => void;
  onToggleFieldOfView?: () => void;
  studioMode?: boolean;
  showSingleMarkerHint?: boolean;
  onPlayerSelect?: (player: import('../../../../../packages/shared').Player) => void;
}

const TacticalField: React.FC<TacticalFieldProps> = ({
  waypointsMode,
  horizontalZonesMode,
  verticalSpacesMode,
  fieldOfViewMode = false,
  isFullScreen,
  onChangeFieldColor,
  onChangePlayerColor,
  markerBgColor,
  markerBorderColor,
  markerTextColor,
  markerSecondaryColor,
  markerDesign,
  onChangeMarkerBgColor,
  onChangeMarkerBorderColor,
  onChangeMarkerTextColor,
  onChangeMarkerSecondaryColor,
  onChangeMarkerDesign,
  onTogglePlayerLabels,
  showPlayerLabels,
  onToggleMarkerType,
  markerType,
  onToggleWaypoints,
  onToggleHorizontalZones,
  onToggleVerticalSpaces,
  onToggleFullScreen,
  onToggleFieldOfView,
  studioMode = false,
  showSingleMarkerHint = false,
  onPlayerSelect,
}) => {
  if (studioMode) {
    return (
      <div style={{ maxWidth: 950, margin: '0 auto', width: '100%' }}>
        <FootballField
          waypointsMode={waypointsMode}
          horizontalZonesMode={horizontalZonesMode}
          verticalSpacesMode={verticalSpacesMode}
          isFullScreen={isFullScreen}
          fieldOfViewMode={fieldOfViewMode}
          onPlayerSelect={onPlayerSelect}
        />
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">Tactical Field</h2>
      <div className="w-full flex justify-center">
        <FootballField
          waypointsMode={waypointsMode}
          horizontalZonesMode={horizontalZonesMode}
          verticalSpacesMode={verticalSpacesMode}
          isFullScreen={isFullScreen}
          fieldOfViewMode={fieldOfViewMode}
          onPlayerSelect={onPlayerSelect}
        />
      </div>
      <div className="mt-4">
        <CreatorsMenu
          onChangeFieldColor={onChangeFieldColor}
          onChangePlayerColor={onChangePlayerColor}
          markerBgColor={markerBgColor}
          markerBorderColor={markerBorderColor}
          markerTextColor={markerTextColor}
          markerSecondaryColor={markerSecondaryColor}
          markerDesign={markerDesign}
          onChangeMarkerBgColor={onChangeMarkerBgColor}
          onChangeMarkerBorderColor={onChangeMarkerBorderColor}
          onChangeMarkerTextColor={onChangeMarkerTextColor}
          onChangeMarkerSecondaryColor={onChangeMarkerSecondaryColor}
          onChangeMarkerDesign={onChangeMarkerDesign}
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
          onToggleFieldOfView={onToggleFieldOfView}
          fieldOfViewMode={fieldOfViewMode}
          showSingleMarkerHint={showSingleMarkerHint}
        />
      </div>
    </div>
  );
};

export default TacticalField;
