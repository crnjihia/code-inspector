import { Router, Request, Response } from 'express';
import { getCache, setCache } from '../services/cache';
import { callClaudeReview } from '../services/claude';
import { computeHash } from '../utils/hash';
import { parseClaudeReview } from '../utils/parser';

export const reviewRouter = Router();

reviewRouter.post('/', async (req: Request, res: Response) => {
  const { code, language, filePath, mode } = req.body;
  if (!code || !language || !filePath || !mode) {
    return res.status(400).json({ error: 'Missing required fields: code, language, filePath, mode' });
  }

  const key = computeHash(`${code}${language}${mode}`);

  // SSE streaming setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const cached = await getCache(key);
    if (cached) {
      // Emit cached flag and full review
      res.write(`event: cache_hit\ndata: ${JSON.stringify({ key, cached: true })}\n\n`);
      res.write(`event: complete\ndata: ${JSON.stringify({ ...cached, cached: true })}\n\n`);
      return res.end();
    }

    // Call Claude streaming
    res.write(`event: status\ndata: ${JSON.stringify({ status: 'analyzing', hash: key })}\n\n`);
    const stream = await callClaudeReview({ code, language, filePath, mode });

    let accumulatedText = '';
    for await (const chunk of stream) {
      accumulatedText += chunk;
      res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // Parse the full structured JSON from Claude
    const parsedReview = parseClaudeReview(accumulatedText);

    // Cache the parsed review for 24h
    await setCache(key, parsedReview, 24 * 60 * 60);

    // Send complete event with full structured review
    res.write(`event: complete\ndata: ${JSON.stringify({ ...parsedReview, cached: false })}\n\n`);
    res.end();
  } catch (e: any) {
    console.error('Claude review error:', e);
    res.write(`event: error\ndata: ${JSON.stringify({ error: e.message || 'Review service failed' })}\n\n`);
    res.end();
  }
});
