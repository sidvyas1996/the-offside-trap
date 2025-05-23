import { Router } from 'express';
import { TacticsController } from '../controllers/tactics.controllers';

const router = Router();
const tacticsController = new TacticsController();

router.get('/', tacticsController.getTactics);
//router.get('/:id', tacticsController.getTacticById);
router.post('/', tacticsController.createTactic);
router.post('/:id/like', tacticsController.likeTactic);
router.get('/:id/likes', tacticsController.getTacticLikes);

export default router;
