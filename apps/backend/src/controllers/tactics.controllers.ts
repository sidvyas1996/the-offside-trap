import { Request, Response } from 'express';
import { TacticFormData, TacticResponse } from '@the-offside-trap/shared';
import { tacticsService } from '../services/tactics.service';

export class TacticsController {
    async getTactics(req: Request, res: Response) {
        try {
            const filters = req.query;
            const tactics = await tacticsService.getTactics(filters);
            res.json({ success: true, data: tactics });
        } catch (error) {
          //  res.status(500).json({ success: false, error: error.message });
            console.error(error);
            throw error;
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
            throw error;
            //res.status(400).json({ success: false, error: error.message });
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
           throw error;
            // res.status(400).json({ success: false, error: error.message });
        }
    }
}