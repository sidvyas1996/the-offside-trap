import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';

const router = Router();
const usersController = new UsersController();

// Public routes
router.get('/', usersController.getUsers);

export default router;
