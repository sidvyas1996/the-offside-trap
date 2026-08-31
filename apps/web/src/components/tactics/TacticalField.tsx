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
  onToggleShirtNumbers?: () => void;
  showShirtNumbers?: boolean;
  onToggleWaypoints: () => void;
  onToggleHorizontalZones: () => void;
  onToggleVerticalSpaces: () => void;
  onToggleFullScreen: () => void;
  onToggleFieldOfView?: () => void;
  studioMode?: boolean;
  /** Draw the board a quarter turn — see FootballField's `portrait`. */
  portrait?: boolean;
  /** Size the board from its container's height — see FootballField. */
  fitHeight?: boolean;
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
  onToggleShirtNumbers,
  showShirtNumbers,
  onToggleWaypoints,
  onToggleHorizontalZones,
  onToggleVerticalSpaces,
  onToggleFullScreen,
  onToggleFieldOfView,
  studioMode = false,
  portrait = false,
  fitHeight = false,
  showSingleMarkerHint = false,
  onPlayerSelect,
}) => {
  if (studioMode) {
    // Wide cap: the 16:9 board is short enough to grow horizontally before it
    // overflows the stage, so let big screens use the room they have. That is a
    // landscape concern — a portrait board grows *taller* as it widens, so a much
    // tighter cap is what keeps it on screen there.
    return (
      <div
        style={
          fitHeight
            // Height-driven: the wrapper fills the stage and the board centres
            // inside whatever room is left between header and dock.
            // Centres the board in whatever room the stage has. `overflow: hidden`
            // is a guard, not a layout tool: on a viewport too short for the
            // board the pitch is cropped rather than squashed, because a
            // distorted board misplaces every marker.
            ? {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                // Lets the board size itself against this box's height via cqh.
                containerType: 'size' as const,
              }
            : { maxWidth: portrait ? 520 : 1400, margin: '0 auto', width: '100%' }
        }
      >
        <FootballField
          waypointsMode={waypointsMode}
          horizontalZonesMode={horizontalZonesMode}
          verticalSpacesMode={verticalSpacesMode}
          isFullScreen={isFullScreen}
          fieldOfViewMode={fieldOfViewMode}
          onPlayerSelect={onPlayerSelect}
          portrait={portrait}
          fitHeight={fitHeight}
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
          portrait={portrait}
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
          onToggleShirtNumbers={onToggleShirtNumbers}
          showShirtNumbers={showShirtNumbers}
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
