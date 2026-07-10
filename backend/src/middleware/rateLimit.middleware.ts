import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';

// Standard rate limiter for API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Tight limiter for auth endpoints so /login and /register are not open to
// brute-force. 10 attempts per 15 min per IP is safe for a real user (they
// won't fumble their password 10 times) and painful for an attacker.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count SUCCESSFUL logins against the limit — only failed attempts.
  // Attackers guessing passwords will keep failing; a real user who logs in
  // fine won't be locked out by prior tab reloads.
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response, _next: NextFunction, options) => {
    console.warn(`[SECURITY] ${req.id || 'unknown'} - AUTH RATE LIMIT HIT IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  }
});

// Stricter rate limiter specifically for upload routes to prevent DOS
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 uploads per hour
  message: {
    success: false,
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    message: 'Upload limit reached, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, _next: NextFunction, options) => {
    console.warn(`[SECURITY] ${req.id || 'unknown'} - UPLOAD RATE LIMIT HIT IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  }
});
