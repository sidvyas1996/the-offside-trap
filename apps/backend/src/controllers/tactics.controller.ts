import { Request, Response } from 'express';
import { TacticFormData } from '@the-offside-trap/shared';
import { tacticsService } from '../services/tactics.service';
import { commentsService } from '../services/comments.service';

export class TacticsController {
  async getTacticsSummary(req: Request, res: Response) {
    try {
      const filters = req.query;
      const tactics = await tacticsService.getTacticsSummary(filters);
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
  async getTacticsById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tactics = await tacticsService.getTacticById(id);
      res.json({ success: true, data: tactics });
    } catch (error) {
      console.error(error);
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

  async addComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = '17fbb4d6-11fb-4456-b376-84579a1b99e6';
      //req.user.id; // From auth middleware

      const comment = await commentsService.addComment(id, userId, content);
      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async getComments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const comments = await commentsService.getComments(id, page, limit);
      res.json({ success: true, data: comments });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const status = errorMessage === 'Tactic not found' ? 404 : 500;
      res.status(status).json({ success: false, error: errorMessage });
    }
  }
}
