import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300'), // 300 requests per 15 mins (approx 1 req/3s avg)
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 mins
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later',
  },
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || '50'), // 50 requests per minute
  message: {
    error: 'Too many AI requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
