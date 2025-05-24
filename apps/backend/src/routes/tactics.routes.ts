import { Router } from 'express';
import { TacticsController } from '../controllers/tactics.controllers';

const router = Router();
const tacticsController = new TacticsController();

router.get('/', tacticsController.getTacticsSummary);
router.get('/:id', tacticsController.getTacticsById);
router.post('/', tacticsController.createTactic);
router.post('/:id/like', tacticsController.likeTactic);
router.get('/:id/likes', tacticsController.getTacticLikes);

export default router;
