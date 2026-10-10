import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthedRequest } from './auth.middleware';

// Export renders spin up a headless browser (and ffmpeg for video), so they are
// the most expensive thing a client can ask for. Limits are per user, which is
// why these must run after requireAuth: behind Render's proxy every request
// shares an IP unless `trust proxy` is configured, and keying by account is the
// fairer budget anyway.
//
// The store is in-memory, which is correct for a single instance; scaling out
// would need a shared store (e.g. Redis) or each instance grants its own quota.
//
// Like compression in app.ts, express-rate-limit resolves the hoisted Express 5
// types, hence the casts; the middleware itself is version-agnostic.
const exportLimiter = (windowMs: number, limit: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: req => (req as unknown as AuthedRequest).user!.id,
    // We never key by IP, so the X-Forwarded-For sanity check only produces
    // noise on Render.
    validate: { xForwardedForHeader: false },
    message: {
      success: false,
      error: 'Too many export requests. Please wait a moment and try again.',
    },
  }) as unknown as RequestHandler;

// Image exports: a quick re-render, but still a browser launch each time.
export const fieldExportLimiter = exportLimiter(60 * 1000, 10);

// Video exports: frame-by-frame capture plus encoding — seconds to minutes each.
export const videoExportLimiter = exportLimiter(10 * 60 * 1000, 5);
