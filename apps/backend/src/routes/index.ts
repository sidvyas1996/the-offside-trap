import { Router } from 'express';
import authRoutes from './auth.routes';
import tacticsRoutes from './tactics.routes';
import usersRoutes from './user.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/tactics', tacticsRoutes);
router.use('/users', usersRoutes);

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'The Offside Trap API',
        version: '1.0.0',
        description: 'Football tactics sharing platform API',
        endpoints: {
            auth: '/api/auth',
            tactics: '/api/tactics',
            users: '/api/users'
        },
        health: '/health'
    });
});

export default router;