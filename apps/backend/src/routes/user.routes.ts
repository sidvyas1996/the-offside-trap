import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { updateMeSchema, usernameAvailableSchema } from '../schemas/users.schemas';

const router = Router();
const usersController = new UsersController();

// Auth routes
router.get('/', usersController.getUsers);
router.get('/me', requireAuth, usersController.getUserById);
router.patch(
  '/me',
  requireAuth,
  validateRequest(updateMeSchema, 'body'),
  usersController.updateMe,
);
router.get(
  '/username-available',
  requireAuth,
  validateRequest(usernameAvailableSchema, 'query'),
  usersController.checkUsername,
);

export default router;
