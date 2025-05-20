import { Router } from 'express';
import { TacticsController } from '../controllers/tactics.controller';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createTacticSchema, updateTacticSchema, tacticFiltersSchema } from '../schemas/tactics.schemas';

const router = Router();
const tacticsController = new TacticsController();

// Public routes (with optional auth for personalization)
router.get('/',
    optionalAuth,
    validateRequest(tacticFiltersSchema, 'query'),
    tacticsController.getTactics
);

router.get('/trending', optionalAuth, tacticsController.getTrendingTactics);

router.get('/featured', optionalAuth, tacticsController.getFeaturedTactics);

router.get('/popular', optionalAuth, tacticsController.getPopularTactics);

router.get('/search',
    optionalAuth,
    tacticsController.searchTactics
);

router.get('/:id', optionalAuth, tacticsController.getTacticById);

// Protected routes - require authentication
router.post('/',
    authMiddleware,
    validateRequest(createTacticSchema),
    tacticsController.createTactic
);

router.put('/:id',
    authMiddleware,
    validateRequest(updateTacticSchema),
    tacticsController.updateTactic
);

router.delete('/:id', authMiddleware, tacticsController.deleteTactic);

// Interaction routes
router.post('/:id/like', authMiddleware, tacticsController.likeTactic);

router.post('/:id/save', authMiddleware, tacticsController.saveTactic);

router.delete('/:id/save', authMiddleware, tacticsController.unsaveTactic);

router.post('/:id/duplicate', authMiddleware, tacticsController.duplicateTactic);

// Comments routes
router.get('/:id/comments', tacticsController.getComments);

router.post('/:id/comments',
    authMiddleware,
    tacticsController.addComment
);

router.put('/:id/comments/:commentId',
    authMiddleware,
    tacticsController.updateComment
);

router.delete('/:id/comments/:commentId',
    authMiddleware,
    tacticsController.deleteComment
);

// Analytics routes
router.get('/:id/stats', tacticsController.getTacticStats);

router.post('/:id/view', optionalAuth, tacticsController.recordView);

// Formation and tags helpers
router.get('/meta/formations', tacticsController.getFormations);

router.get('/meta/tags', tacticsController.getPopularTags);

export default router;