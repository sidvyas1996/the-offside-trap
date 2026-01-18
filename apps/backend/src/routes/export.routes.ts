import { Router } from 'express';
import { exportField } from '../controllers/export.controller';

const router = Router();

router.post('/field', exportField);

export default router;


