import React, { useState } from "react";
import { Download, Image as ImageIcon, Film } from "lucide-react";
import { Button } from "../ui/button";
import { api } from "../../lib/api";
import { useFootballField } from "../../contexts/FootballFieldContext";
import type { AnimationData } from "../../../../../packages/shared/src";

interface PreviewProps {
  rotationAngle?: number;
  tiltAngle?: number;
  zoomLevel?: number;
  animation?: AnimationData;
}

const Preview: React.FC<PreviewProps> = ({
  rotationAngle = 0,
  tiltAngle = 20,
  zoomLevel = 1.0,
  animation,
}) => {
  const { players, options, ball } = useFootballField();
  const [isExporting, setIsExporting] = useState(false);

  // Export buttons: violet chips with the hard shadow; MP4 is the one green action.
  const exportBtn = (primary = false): React.CSSProperties => ({
    borderRadius: 10,
    border: 'var(--border-w) solid var(--ink)',
    background: primary ? 'var(--primary)' : 'var(--surface-high)',
    color: primary ? 'var(--on-primary)' : 'var(--on-surface)',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 12,
    padding: '9px 12px',
    boxShadow: 'var(--shadow-sm)',
  });
  const [isExportingVideo, setIsExportingVideo] = useState(false);

  const handleExport = async (format: 'png' | 'jpg') => {
    setIsExporting(true);
    try {
      const isTactics = animation !== undefined;
      const fieldState = {
        rotationAngle,
        tiltAngle,
        zoomLevel,
        fieldColor: options.fieldColor || '#19a974',
        players: players.map(player => ({
          id: player.id,
          x: player.x,
          y: player.y,
          name: player.name || `Player ${player.number}`,
          number: player.position || player.number.toString(),
          isCaptain: player.isCaptain,
          hasYellowCard: player.hasYellowCard,
          hasRedCard: player.hasRedCard,
          isStarPlayer: player.isStarPlayer,
        })),
        showPlayerLabels: options.showPlayerLabels ?? true,
        markerType: options.markerType || 'circle',
        ...(isTactics && { ball }),
        waypointsMode: false,
        horizontalZonesMode: false,
        verticalSpacesMode: false,
        format,
        previewType: isTactics ? 'tactics' : 'lineup',
      };

      const response = await api.post('/export/field', fieldState, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `lineup-field.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting field:", error);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVideo = async () => {
    if (!animation || animation.keyframes.length < 2) {
      alert("Draw a movement or a pass on the pitch (or pick a preset) before exporting a video.");
      return;
    }
    setIsExportingVideo(true);
    try {
      const baseFieldState = {
        fieldColor: options.fieldColor || '#19a974',
        players: players.map(player => ({
          id: player.id,
          x: player.x,
          y: player.y,
          name: player.name || `Player ${player.number}`,
          number: player.position || player.number.toString(),
          isCaptain: player.isCaptain,
          hasYellowCard: player.hasYellowCard,
          hasRedCard: player.hasRedCard,
          isStarPlayer: player.isStarPlayer,
        })),
        showPlayerLabels: options.showPlayerLabels ?? true,
        markerType: options.markerType || 'circle',
        ball,
      };
      const response = await api.post('/export/video', { animation, baseFieldState }, {
        responseType: 'blob',
        timeout: 300000, // 5 min timeout for video export
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tactic.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting video:", error);
      alert("Failed to export video. Please try again.");
    } finally {
      setIsExportingVideo(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--surface-container)", border: "var(--border-w) solid var(--ink)", boxShadow: "var(--card-shadow)" }}
    >
      {/* No mini pitch: the board on the left already shows exactly what exports. */}
      <h2 className="panel-title mb-4">
        <span className="icon-chip"><Download size={14} /></span>
        Export
      </h2>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('png')}
            variant="outline"
            className="flex-1"
            style={exportBtn()}
            disabled={isExporting}
          >
            <ImageIcon size={14} className="mr-2" />
            {isExporting ? 'Exporting...' : 'PNG'}
          </Button>
          <Button
            onClick={() => handleExport('jpg')}
            variant="outline"
            className="flex-1"
            style={exportBtn()}
            disabled={isExporting}
          >
            <ImageIcon size={14} className="mr-2" />
            {isExporting ? 'Exporting...' : 'JPG'}
          </Button>
        </div>

        {animation !== undefined && (
          <Button
            onClick={handleExportVideo}
            variant="outline"
            className="w-full"
            style={exportBtn(true)}
            disabled={isExportingVideo || (animation?.keyframes.length ?? 0) < 2}
          >
            <Film size={14} className="mr-2" />
            {isExportingVideo ? 'Rendering MP4...' : 'Export MP4'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Preview; 