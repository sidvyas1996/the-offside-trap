import { Router } from 'express';
import { exportField, exportVideo } from '../controllers/export.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { fieldExportLimiter, videoExportLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rendering spins up a headless browser (and ffmpeg for video), so only
// signed-in users may trigger it, and only so often.
router.post('/field', requireAuth, fieldExportLimiter, exportField);
router.post('/video', requireAuth, videoExportLimiter, exportVideo);

export default router;


