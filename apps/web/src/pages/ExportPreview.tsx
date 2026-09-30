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
  /**
   * How the markers are dressed. Optional because older callers send only the
   * fields above; anything omitted keeps the board's own default.
   */
  shirtKitId?: string;
  showShirtNumbers?: boolean;
  markerBgColor?: string;
  markerBorderColor?: string;
  markerTextColor?: string;
  markerSecondaryColor?: string;
  markerDesign?: string;
}

/**
 * Lay the board out this many times larger for the capture.
 *
 * Each marker carries its own 3D transform to face the camera, and Chromium
 * rasterises those layers at the size they are laid out at — a device scale
 * factor does not reach inside them, so at a shirt's true size the kit came out
 * in blocks however sharp the rest of the frame was. Zoom is a layout scale
 * rather than a transform, so everything is simply laid out bigger and painted
 * at that size.
 */
const EXPORT_ZOOM = 3;

/**
 * Hand the exporter the board's painted bounds.
 *
 * Perspective pushes the board's near edge past its own box, and the markers
 * stand proud of the grass with their labels below them — so the pixels that
 * matter reach outside the container. Screenshotting the container's layout box
 * would shave the outermost shirt and its label off, which is what this
 * measurement exists to prevent.
 */
const publishBounds = () => {
  const container = document.getElementById("export-field-container");
  if (!container) return;

  // Every element, not just the markers: a marker's wrapper is positioned but
  // has no size of its own — the shirt inside it is taken out of flow — so
  // measuring wrappers alone collapsed each player to a point and cropped the
  // outermost shirts off a turned board.
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  let measured = 0;
  for (const el of container.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    measured += 1;
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  if (measured === 0) return;

  // Reported unclamped, so a board bigger than the window still says how much
  // room it needs — the exporter grows the window to fit and measures again.
  //
  // Scaled by the same zoom the board is laid out at, so the margin stays the
  // same visual size: measured in page pixels it would shrink to a third. It
  // also has to cover what a rect does not — the markers' drop shadows and the
  // labels' hard shadow paint beyond their own boxes.
  const pad = 32 * EXPORT_ZOOM;
  (window as any).__EXPORT_BOUNDS__ = {
    x: left + window.scrollX - pad,
    y: top + window.scrollY - pad,
    width: right - left + pad * 2,
    height: bottom - top + pad * 2,
  };
};

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
        setPlayers(state.players.map((p: any) => ({
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
        
        // Update options. The marker dressing is spread in only when sent, so
        // a caller that omits it gets the board's defaults rather than blanks.
        setOptions((prev) => ({
          ...prev,
          fieldColor: state.fieldColor,
          markerType: state.markerType,
          showPlayerLabels: state.showPlayerLabels,
          ...(state.shirtKitId && { shirtKitId: state.shirtKitId }),
          ...(state.showShirtNumbers !== undefined && { showShirtNumbers: state.showShirtNumbers }),
          ...(state.markerBgColor && { markerBgColor: state.markerBgColor }),
          ...(state.markerBorderColor && { markerBorderColor: state.markerBorderColor }),
          ...(state.markerTextColor && { markerTextColor: state.markerTextColor }),
          ...(state.markerSecondaryColor && { markerSecondaryColor: state.markerSecondaryColor }),
          ...(state.markerDesign && { markerDesign: state.markerDesign }),
        }));
        
        // Wait for React to update and 3D transforms to render
        setTimeout(() => {
          setIsReady(true);
          publishBounds();
          // The exporter re-measures through this after resizing the window.
          (window as any).__MEASURE_BOUNDS__ = publishBounds;
          // Signal to Playwright that we're ready
          (window as any).__EXPORT_READY__ = true;
        }, 1500);
        return true;
      }
      return false;
    };

    // Check immediately
    if (!checkForState()) {
      // If not found, poll every 100ms for up to 30 seconds — the exporter
      // itself waits that long, so give the state the same window to arrive.
      let attempts = 0;
      const maxAttempts = 300;
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
      {/* On screen the card is the camera's frame: it crops the board and draws
          its own edge. An export is the photograph rather than the frame, so
          the card steps aside here — nothing is cropped (the capture is clipped
          to the board's measured bounds instead) and its chrome would otherwise
          show through behind a board the camera has turned. */}
      <style>{`
        #export-field-container > div {
          overflow: visible !important;
          background: transparent !important;
          border-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
      <div
        id="export-field-container"
        className="w-full max-w-7xl"
        style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s', zoom: EXPORT_ZOOM }}
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

