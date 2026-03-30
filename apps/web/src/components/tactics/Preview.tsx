import React, { useState } from "react";
import { Target, Image as ImageIcon, Film } from "lucide-react";
import MiniTacticCard from "../MiniTacticCard";
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
  const { players, options } = useFootballField();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);

  const handleExport = async (format: 'png' | 'jpg') => {
    setIsExporting(true);
    try {
      const isTactics = animation !== undefined;
      const fieldState = {
        rotationAngle,
        tiltAngle,
        zoomLevel,
        fieldColor: options.fieldColor || '#0d4b3e',
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
      alert("Add at least 2 keyframes before exporting a video.");
      return;
    }
    setIsExportingVideo(true);
    try {
      const baseFieldState = {
        fieldColor: options.fieldColor || '#0d4b3e',
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
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-[var(--primary)]" />
        Preview
      </h2>
      <MiniTacticCard />

      <div className="mt-4 space-y-2">
        <div className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
          Export Field
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('png')}
            variant="outline"
            className="flex-1"
            disabled={isExporting}
            style={{ borderColor: 'var(--border)', borderRadius: 6 }}
          >
            <ImageIcon size={16} className="mr-2" />
            {isExporting ? 'Exporting...' : 'PNG'}
          </Button>
          <Button
            onClick={() => handleExport('jpg')}
            variant="outline"
            className="flex-1"
            disabled={isExporting}
            style={{ borderColor: 'var(--border)', borderRadius: 6 }}
          >
            <ImageIcon size={16} className="mr-2" />
            {isExporting ? 'Exporting...' : 'JPG'}
          </Button>
        </div>

        {animation !== undefined && (
          <Button
            onClick={handleExportVideo}
            variant="outline"
            className="w-full"
            disabled={isExportingVideo || (animation?.keyframes.length ?? 0) < 2}
            style={{ borderColor: 'var(--border)', borderRadius: 6 }}
          >
            <Film size={16} className="mr-2" />
            {isExportingVideo ? 'Rendering MP4...' : 'Export MP4'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Preview; 