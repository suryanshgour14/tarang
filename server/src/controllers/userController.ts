import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { CreateUserSchema } from '../types';
import { validateBody, validateQuery } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../utils/logger';

const GetUsersQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  role: z.string().optional(),
});

/**
 * Register a new user
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body;
    const user = await UserService.createUser(userData);
    
    logger.info('User registered successfully:', { userId: user.id, email: user.email });
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = await UserService.getUserById(userId);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, role } = req.query;
    const result = await UserService.getUsers(page, limit, role);
    
    res.json({
      success: true,
      data: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 */
export const updateCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const user = await UserService.updateUser(userId, updateData);
    
    logger.info('User profile updated:', { userId, updates: updateData });
    
    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user by ID (admin only)
 */
export const updateUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const user = await UserService.updateUser(userId, updateData);
    
    logger.info('User updated by admin:', { userId, updates: updateData });
    
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user by ID (admin only)
 */
export const deleteUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    await UserService.deleteUser(userId);
    
    logger.info('User deleted by admin:', { userId });
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email (admin only)
 */
export const verifyUserEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    await UserService.verifyUserEmail(userId);
    
    logger.info('User email verified by admin:', { userId });
    
    res.json({
      success: true,
      message: 'User email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync OAuth user to custom users table
 */
export const syncOAuthUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authUser } = req.body;
    
    if (!authUser || !authUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Auth user data is required',
      });
    }
    
    const user = await UserService.syncOAuthUser(authUser);
    
    logger.info('OAuth user synced successfully:', { userId: user.id, email: user.email });
    
    res.json({
      success: true,
      data: user,
      message: 'OAuth user synced successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Export validation middleware
export const validateRegisterUser = validateBody(CreateUserSchema);
export const validateGetUsers = validateQuery(GetUsersQuerySchema);
