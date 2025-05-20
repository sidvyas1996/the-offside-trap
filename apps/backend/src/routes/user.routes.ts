import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authMiddleware, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();
const usersController = new UsersController();

// Public user profiles
router.get('/:userId', optionalAuth, usersController.getUserProfile);

router.get('/:userId/tactics', optionalAuth, usersController.getUserTactics);

router.get('/:userId/stats', usersController.getUserStats);

// Protected routes - current user only
router.get('/me/saved', authMiddleware, usersController.getSavedTactics);

router.get('/me/liked', authMiddleware, usersController.getLikedTactics);

router.get('/me/analytics', authMiddleware, usersController.getUserAnalytics);

router.get('/me/activity', authMiddleware, usersController.getUserActivity);

// Follow system (for future)
router.post('/:userId/follow', authMiddleware, usersController.followUser);

router.delete('/:userId/follow', authMiddleware, usersController.unfollowUser);

router.get('/:userId/followers', usersController.getFollowers);

router.get('/:userId/following', usersController.getFollowing);

export default router;