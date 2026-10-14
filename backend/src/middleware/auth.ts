import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow health endpoint without authentication
  if (req.path === '/health') {
    return next();
  }

  const configuredKey = process.env.CODE_INSPECTOR_API_KEY;

  // If no API key configured on server, allow dev mode
  if (!configuredKey) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.substring('Bearer '.length).trim();
  if (token !== configuredKey) {
    return res.status(403).json({ error: 'Invalid API token' });
  }

  next();
}
