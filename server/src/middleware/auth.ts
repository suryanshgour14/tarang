import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { AuthenticationError, AuthorizationError } from '../types';
import { User } from '../types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * Middleware to authenticate users using Supabase JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No valid authorization header found');
    }

    const token = authHeader.substring(7);
    
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Get user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new AuthenticationError('User not found in database');
    }

    req.user = userData as User;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Authentication error:', error);
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is citizen
 */
export const requireCitizen = requireRole(['citizen']);

/**
 * Middleware to check if user is official or analyst
 */
export const requireOfficial = requireRole(['official', 'analyst']);

/**
 * Middleware to check if user is analyst
 */
export const requireAnalyst = requireRole(['analyst']);

/**
 * Middleware to check if user can access a specific report
 * Citizens can only access their own reports
 * Officials and analysts can access all reports
 */
export const canAccessReport = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Officials and analysts can access all reports
  if (['official', 'analyst'].includes(req.user.role)) {
    next();
    return;
  }

  // Citizens can only access their own reports
  const reportUserId = req.params.userId || req.body.user_id;
  if (req.user.role === 'citizen' && reportUserId !== req.user.id) {
    res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your own reports.',
    });
    return;
  }

  next();
};

/**
 * Optional authentication middleware
 * Sets user if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      next();
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!userError && userData) {
      req.user = userData as User;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
