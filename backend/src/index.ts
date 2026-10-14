import express from 'express';
import dotenv from 'dotenv';
import { reviewRouter } from './routes/review';
import { refactorRouter } from './routes/refactor';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { clearAllCache } from './services/cache';

dotenv.config();

export const app = express();
app.use(express.json());

// Public health check route
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'code-inspector-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Protected routes
app.use(authMiddleware);
app.use(rateLimitMiddleware);

app.use('/review', reviewRouter);
app.use('/refactor', refactorRouter);

app.post('/cache/clear', async (_req, res) => {
  try {
    await clearAllCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear cache' });
  }
});

const PORT = process.env.PORT ?? 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Code Inspector backend listening on port ${PORT}`);
  });
}
