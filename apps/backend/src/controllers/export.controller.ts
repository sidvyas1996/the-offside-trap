import { Request, Response } from 'express';
import { ScreenshotService } from '../services/screenshot.service';

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

    // Capture screenshot
    const screenshot = await ScreenshotService.captureField(fieldState, imageFormat);

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

