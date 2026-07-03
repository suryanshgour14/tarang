import rateLimit, { RateLimitInfo } from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

const getRateLimitInfo = (req: Request): RateLimitInfo | undefined =>
  (req as unknown as { rateLimit?: RateLimitInfo }).rateLimit;

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round(getRateLimitInfo(req)?.resetTime ? (getRateLimitInfo(req)!.resetTime!.getTime() - Date.now()) / 1000 : 900),
    });
  },
});

// Strict rate limiter for report submission
export const reportSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 report submissions per hour
  message: {
    success: false,
    error: 'Too many report submissions from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Report submission rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many report submissions from this IP, please try again later.',
      retryAfter: Math.round(getRateLimitInfo(req)?.resetTime ? (getRateLimitInfo(req)!.resetTime!.getTime() - Date.now()) / 1000 : 3600),
    });
  },
});

// Strict rate limiter for authentication
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Authentication rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: Math.round(getRateLimitInfo(req)?.resetTime ? (getRateLimitInfo(req)!.resetTime!.getTime() - Date.now()) / 1000 : 900),
    });
  },
});

// Rate limiter for media uploads
export const mediaUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 media uploads per hour
  message: {
    success: false,
    error: 'Too many media uploads from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Media upload rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many media uploads from this IP, please try again later.',
      retryAfter: Math.round(getRateLimitInfo(req)?.resetTime ? (getRateLimitInfo(req)!.resetTime!.getTime() - Date.now()) / 1000 : 3600),
    });
  },
});

// Rate limiter for NLP analysis
export const nlpAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 NLP analysis requests per hour
  message: {
    success: false,
    error: 'Too many NLP analysis requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('NLP analysis rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many NLP analysis requests from this IP, please try again later.',
      retryAfter: Math.round(getRateLimitInfo(req)?.resetTime ? (getRateLimitInfo(req)!.resetTime!.getTime() - Date.now()) / 1000 : 3600),
    });
  },
});
