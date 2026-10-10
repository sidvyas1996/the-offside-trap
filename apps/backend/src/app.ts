import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './middlewares/error.middleware';
import routes from './routes';

const app = express();

const PORT = process.env.PORT || 3001;
app.use(cors());
// @types/compression pulls in Express 5's types; the middleware itself is
// version-agnostic.
app.use(compression() as unknown as express.RequestHandler);

// Middleware
// Tactics carry their compiled animation: a keyframe per frame, each with every
// player on both teams. Express's 100kb default rejects an ordinary animated
// tactic ("request entity too large"); the largest the schema allows (60s at
// 60fps, 22 players) is ~6MB.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.all('/{*any}', (req, res, next) => {
  next(
    res.status(404).json({
      success: false,
      error: 'Route not found',
    }),
  );
});

// Global error handler
app.use(errorHandler);

export default app;
