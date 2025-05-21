import { Router } from 'express';
import usersRoutes from './user.routes';
import tacticsRoutes from './tactics.routes';

const router = Router();

// Mount route modules
router.use('/users', usersRoutes);
router.use('/tactics', tacticsRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Football Tactics API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      tactics: '/api/tactics',
    },
  });
});

export default router;
