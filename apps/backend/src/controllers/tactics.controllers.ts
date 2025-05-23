import { Request, Response } from 'express';
import { TacticFormData } from '@the-offside-trap/shared';
import { tacticsService } from '../services/tactics.service';

export class TacticsController {
  async getTactics(req: Request, res: Response) {
    try {
      const filters = req.query;
      const tactics = await tacticsService.getTactics(filters);
      res.json({ success: true, data: tactics });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async createTactic(req: Request, res: Response) {
    try {
      const tacticData: TacticFormData = req.body;
      const userId = '';
      //req.user.id; // From auth middleware

      const tactic = await tacticsService.createTactic(tacticData, userId);
      res.status(201).json({ success: true, data: tactic });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async likeTactic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = '';
      //req.user.id;

      await tacticsService.toggleLike(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
  async getTacticLikes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await tacticsService.getTacticLikes(id, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const status = errorMessage === 'Tactic not found' ? 404 : 500;
      res.status(status).json({ success: false, error: errorMessage });
    }
  }
}
