import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.middleware';
import routes from './routes';

const app = express();

const PORT = process.env.PORT || 3001;
app.use(cors());

// Middleware
app.use(express.json());
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
});

export default app;
