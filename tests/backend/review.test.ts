import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { reviewRouter } from '../../backend/src/routes/review';
import * as cacheModule from '../../backend/src/services/cache';

vi.mock('../../backend/src/services/claude', () => ({
  callClaudeReview: vi.fn().mockImplementation(async () => {
    async function* gen() {
      yield '{"bugs": [{"line": 1, "severity": "high", "description": "Null pointer risk", "fix": "if (!val) return;"}], "complexity": {"score": 2, "issues": []}, "naming": [], "refactors": []}';
    }
    return gen();
  })
}));

const app = express();
app.use(express.json());
app.use('/review', reviewRouter);

describe('POST /review', () => {
  beforeEach(async () => {
    await cacheModule.clearAllCache();
  });

  it('validates required fields', async () => {
    const res = await request(app)
      .post('/review')
      .send({ code: 'const x = 1;' })
      .expect(400);

    expect(res.body.error).toContain('Missing required fields');
  });

  it('streams review response with SSE chunks', async () => {
    const response = await request(app)
      .post('/review')
      .send({
        code: 'function foo(val) { return val.bar; }',
        language: 'javascript',
        filePath: '/workspace/foo.js',
        mode: 'selection'
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('event: chunk');
    expect(response.text).toContain('event: complete');
    expect(response.text).toContain('Null pointer risk');
  });

  it('returns cached review on second identical request', async () => {
    const payload = {
      code: 'function cachedFn() { return 42; }',
      language: 'javascript',
      filePath: '/workspace/cached.js',
      mode: 'selection'
    };

    // First call (miss)
    await request(app).post('/review').send(payload).expect(200);

    // Second call (cache hit)
    const secondRes = await request(app).post('/review').send(payload).expect(200);
    expect(secondRes.text).toContain('event: cache_hit');
    expect(secondRes.text).toContain('"cached":true');
  });
});
