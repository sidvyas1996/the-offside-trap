import React, { useState } from "react";
import { Target, Image as ImageIcon } from "lucide-react";
import MiniTacticCard from "../MiniTacticCard";
import { Button } from "../ui/button";
import { api } from "../../lib/api";
import { useFootballField } from "../../contexts/FootballFieldContext";

interface PreviewProps {
  rotationAngle?: number;
  tiltAngle?: number;
  zoomLevel?: number;
}

const Preview: React.FC<PreviewProps> = ({ 
  rotationAngle = 0, 
  tiltAngle = 20, 
  zoomLevel = 1.0 
}) => {
  const { players, options } = useFootballField();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'png' | 'jpg') => {
    setIsExporting(true);
    try {
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
      </div>
    </div>
  );
};

export default Preview; 