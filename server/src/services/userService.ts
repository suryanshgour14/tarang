import { supabase, supabaseAdmin } from '../config/database';
import { User, CreateUserRequest } from '../types';
import { ConflictError, NotFoundError, AppError } from '../types';
import { logger } from '../utils/logger';

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: 'temp_password_123', // This should be set by the user via email verification
        email_confirm: false,
        user_metadata: {
          name: userData.name,
          role: userData.role,
        },
      });

      if (authError || !authData.user) {
        logger.error('Failed to create user in Supabase Auth:', authError);
        throw new AppError('Failed to create user account');
      }

      // Create user record in database
      const { data: user, error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        })
        .select()
        .single();

      if (dbError || !user) {
        // Clean up auth user if database insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        logger.error('Failed to create user in database:', dbError);
        throw new AppError('Failed to create user record');
      }

      logger.info('User created successfully:', { userId: user.id, email: user.email });
      return user as User;
    } catch (error) {
      if (error instanceof ConflictError || error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating user:', error);
      throw new AppError('Failed to create user');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new NotFoundError('User not found');
      }

      return user as User;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error getting user by ID:', error);
      throw new AppError('Failed to get user');
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new NotFoundError('User not found');
      }

      return user as User;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error getting user by email:', error);
      throw new AppError('Failed to get user');
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updateData: Partial<CreateUserRequest>): Promise<User> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error || !user) {
        throw new NotFoundError('User not found or update failed');
      }

      logger.info('User updated successfully:', { userId, updates: updateData });
      return user as User;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating user:', error);
      throw new AppError('Failed to update user');
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      // Delete user from database
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) {
        logger.error('Failed to delete user from database:', dbError);
        throw new AppError('Failed to delete user from database');
      }

      // Delete user from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        logger.error('Failed to delete user from Supabase Auth:', authError);
        // Don't throw error here as user is already deleted from database
      }

      logger.info('User deleted successfully:', { userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deleting user:', error);
      throw new AppError('Failed to delete user');
    }
  }

  /**
   * Get all users with pagination
   */
  static async getUsers(page: number = 1, limit: number = 20, role?: string): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      let query = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' });

      if (role === 'citizen' || role === 'official' || role === 'analyst') {
        query = query.eq('role', role);
      }

      const { data: users, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error getting users:', error);
        throw new AppError('Failed to get users');
      }

      return {
        users: users as User[],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting users:', error);
      throw new AppError('Failed to get users');
    }
  }

  /**
   * Verify user email
   */
  static async verifyUserEmail(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });

      if (error) {
        logger.error('Failed to verify user email:', error);
        throw new AppError('Failed to verify user email');
      }

      logger.info('User email verified successfully:', { userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error verifying user email:', error);
      throw new AppError('Failed to verify user email');
    }
  }

  /**
   * Sync OAuth user to custom users table
   * This is called when a user signs in with OAuth providers like Google
   */
  static async syncOAuthUser(authUser: any): Promise<User> {
    try {
      // Check if user already exists in our custom table
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (existingUser) {
        // User exists, return the existing user
        return existingUser as User;
      }

      // User doesn't exist in our table, create them
      const userData = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        role: authUser.user_metadata?.role || 'citizen',
      };

      const { data: user, error: dbError } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (dbError || !user) {
        logger.error('Failed to sync OAuth user to database:', dbError);
        throw new AppError('Failed to sync user to database');
      }

      logger.info('OAuth user synced successfully:', { userId: user.id, email: user.email });
      return user as User;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error syncing OAuth user:', error);
      throw new AppError('Failed to sync OAuth user');
    }
  }
}
