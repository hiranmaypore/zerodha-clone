const rateLimit = require('express-rate-limit');

// ── General API limiter ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

// ── Strict limiter for auth routes (login/signup) ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
});

// ── Order rate limiter (prevent rapid-fire trading bots) ──
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Order rate limit exceeded. Slow down.' },
});

module.exports = { apiLimiter, authLimiter, orderLimiter };
