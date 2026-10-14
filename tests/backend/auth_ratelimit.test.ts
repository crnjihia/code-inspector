import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authMiddleware } from '../../backend/src/middleware/auth';
import { rateLimitMiddleware } from '../../backend/src/middleware/rateLimit';

describe('Auth & Rate Limiting Middleware', () => {
  const originalKey = process.env.CODE_INSPECTOR_API_KEY;

  beforeEach(() => {
    process.env.CODE_INSPECTOR_API_KEY = 'secret-test-token';
  });

  afterEach(() => {
    process.env.CODE_INSPECTOR_API_KEY = originalKey;
  });

  const app = express();
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(authMiddleware);
  app.use(rateLimitMiddleware);
  app.get('/protected', (_req, res) => res.json({ data: 'secure' }));

  it('allows access to /health without Authorization header', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects protected routes when Authorization header is missing', async () => {
    const res = await request(app).get('/protected').expect(401);
    expect(res.body.error).toContain('Missing or malformed Authorization header');
  });

  it('rejects protected routes when token is invalid', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer wrong-token')
      .expect(403);
    expect(res.body.error).toContain('Invalid API token');
  });

  it('allows protected route with valid Bearer token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer secret-test-token')
      .expect(200);
    expect(res.body.data).toBe('secure');
  });
});
