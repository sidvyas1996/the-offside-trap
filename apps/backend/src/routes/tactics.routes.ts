import { Router } from 'express';
import { TacticsController } from '../controllers/tactics.controllers';

const router = Router();
const tacticsController = new TacticsController();

// Tactics routes
router.get('/', tacticsController.getTactics);
//router.get('/:id', tacticsController.getTacticById);
router.post('/', tacticsController.createTactic);
router.post('/:id/like', tacticsController.likeTactic);

export default router;
