import { Request, Response } from 'express';
import { ScreenshotService } from '../services/screenshot.service';
import { VideoExportService } from '../services/video.export.service';
import type { AnimationData } from '@the-offside-trap/shared';

interface ExportRequest {
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
  format: 'png' | 'jpg';
}

export const exportField = async (req: Request, res: Response) => {
  try {
    const fieldState: ExportRequest = req.body;

    // Validate required fields
    if (
      typeof fieldState.rotationAngle !== 'number' ||
      typeof fieldState.tiltAngle !== 'number' ||
      typeof fieldState.zoomLevel !== 'number' ||
      !Array.isArray(fieldState.players)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid field state provided',
      });
    }

    // Log the received values for debugging
    console.log('Export request received:', {
      rotationAngle: fieldState.rotationAngle,
      tiltAngle: fieldState.tiltAngle,
      zoomLevel: fieldState.zoomLevel,
      playerCount: fieldState.players.length,
      markerType: fieldState.markerType,
      showPlayerLabels: fieldState.showPlayerLabels,
    });

    const format = fieldState.format || 'png';
    const imageFormat = format === 'jpg' ? 'jpeg' : 'png';
    const previewType: 'lineup' | 'tactics' = (req.body.previewType === 'tactics') ? 'tactics' : 'lineup';

    // Capture screenshot
    const screenshot = await ScreenshotService.captureField(fieldState, imageFormat, previewType);

    // Set response headers
    res.setHeader('Content-Type', `image/${imageFormat}`);
    res.setHeader('Content-Disposition', `attachment; filename="lineup-field.${format}"`);
    res.setHeader('Content-Length', screenshot.length.toString());

    // Send the image
    res.send(screenshot);
  } catch (error) {
    console.error('Error exporting field:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export field image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const exportVideo = async (req: Request, res: Response) => {
  try {
    const { animation, baseFieldState } = req.body as {
      animation: AnimationData;
      baseFieldState: {
        fieldColor: string;
        players: Array<{ id: number; x: number; y: number; name: string; number: string; }>;
        showPlayerLabels: boolean;
        markerType: 'circle' | 'shirt';
      };
    };

    if (!animation || !animation.keyframes || animation.keyframes.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Animation must have at least 2 keyframes',
      });
    }

    if (!baseFieldState || !Array.isArray(baseFieldState.players)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base field state',
      });
    }

    console.log(`Video export: ${animation.keyframes.length} keyframes, ${animation.durationMs}ms, ${animation.fps}fps`);

    const mp4Buffer = await VideoExportService.exportAnimation(animation, baseFieldState);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="tactic.mp4"');
    res.setHeader('Content-Length', mp4Buffer.length.toString());
    res.send(mp4Buffer);
  } catch (error) {
    console.error('Error exporting video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export video',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

