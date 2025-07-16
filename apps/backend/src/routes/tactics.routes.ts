import { Router } from 'express';
import { TacticsController } from '../controllers/tactics.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const tacticsController = new TacticsController();

router.get('/', requireAuth, tacticsController.getTacticsSummary);
router.get('/:id', requireAuth, tacticsController.getTacticsById);
router.post('/', requireAuth, tacticsController.createTactic);
router.post('/:id/like', requireAuth, tacticsController.likeTactic);
router.get('/:id/likes', requireAuth, tacticsController.getTacticLikes);
router.post('/:id/comment', requireAuth, tacticsController.addComment);
router.get('/:id/comments', requireAuth, tacticsController.getComments);
export default router;
