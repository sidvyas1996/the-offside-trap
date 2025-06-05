import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';

const router = Router();
const usersController = new UsersController();

// Public routes
router.get('/', usersController.getUsers);
router.get('/me', usersController.getUserById);
router.post('/me', usersController.createUser);

export default router;
