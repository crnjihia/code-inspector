import { Router, Request, Response } from 'express';
import { callClaudeRefactor } from '../services/claude';

export const refactorRouter = Router();

refactorRouter.post('/', async (req: Request, res: Response) => {
  const { code, language, filePath } = req.body;
  if (!code || !language || !filePath) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const refactored = await callClaudeRefactor({ code, language, filePath });
    res.json({ refactored });
  } catch (e: any) {
    console.error('Claude refactor error:', e);
    res.status(500).json({ error: 'Refactor service failed' });
  }
});
