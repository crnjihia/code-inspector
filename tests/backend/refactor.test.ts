import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { refactorRouter } from '../../backend/src/routes/refactor';

vi.mock('../../backend/src/services/claude', () => ({
  callClaudeRefactor: vi.fn().mockResolvedValue('function cleanCode() {\n  return 42;\n}')
}));

const app = express();
app.use(express.json());
app.use('/refactor', refactorRouter);

describe('POST /refactor', () => {
  it('validates required fields', async () => {
    const res = await request(app)
      .post('/refactor')
      .send({ code: 'function dirty() {}' })
      .expect(400);

    expect(res.body.error).toContain('Missing required fields');
  });

  it('returns refactored code block', async () => {
    const res = await request(app)
      .post('/refactor')
      .send({
        code: 'function dirty() { return 42; }',
        language: 'javascript',
        filePath: '/workspace/test.js'
      })
      .expect(200);

    expect(res.body.refactored).toBeDefined();
    expect(res.body.refactored).toContain('cleanCode');
  });
});
