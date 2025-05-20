import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register',
    validateRequest(registerSchema),
    authController.register
);

router.post('/login',
    validateRequest(loginSchema),
    authController.login
);

router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/me', authMiddleware, authController.getProfile);

router.post('/logout', authMiddleware, authController.logout);

router.put('/profile',
    authMiddleware,
    authController.updateProfile
);

router.put('/change-password',
    authMiddleware,
    authController.changePassword
);

export default router;