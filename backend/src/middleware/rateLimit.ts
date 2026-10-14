import rateLimit from 'express-rate-limit';

export const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const instanceId = req.headers['x-instance-id'];
    if (typeof instanceId === 'string' && instanceId.trim()) {
      return instanceId.trim();
    }
    return req.ip || 'anonymous';
  },
  skip: (req) => req.path === '/health',
  message: { error: 'Too many requests, please try again later.' }
});
