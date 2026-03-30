import { Router } from 'express';
import { exportField, exportVideo } from '../controllers/export.controller';

const router = Router();

router.post('/field', exportField);
router.post('/video', exportVideo);

export default router;


