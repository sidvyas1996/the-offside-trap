import { Router } from 'express';
import { TacticsController } from '../controllers/tactics.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const tacticsController = new TacticsController();

router.get('/', tacticsController.getTacticsSummary);
router.get('/:id', tacticsController.getTacticsById);
router.get('/:id/likes', tacticsController.getTacticLikes);
router.get('/:id/comments', tacticsController.getComments);
router.post('/', tacticsController.createTactic);
router.put('/:id', requireAuth, tacticsController.updateTactic);
router.post('/:id/like', requireAuth, tacticsController.likeTactic);
router.post('/:id/comment', requireAuth, tacticsController.addComment);
export default router;
