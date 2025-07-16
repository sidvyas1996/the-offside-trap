import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const usersController = new UsersController();

// Auth routes
router.get('/', usersController.getUsers);
router.get('/me', requireAuth, usersController.getUserById);

export default router;
