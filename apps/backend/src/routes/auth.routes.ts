import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authController = new AuthController();

const router = Router();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/token-refresh', authController.tokenRefresh);
//router.post('/logout', authController.logout);
//router.post('/logout', authController.logout);

export default router;
