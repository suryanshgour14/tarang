import { supabaseAdmin } from '../config/database';
import { MediaUploadRequest, MediaUploadResponse } from '../types';
import { AppError, ValidationError } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class MediaService {
  /**
   * Generate signed URL for media upload
   */
  static async generateUploadUrl(
    userId: string,
    uploadRequest: MediaUploadRequest
  ): Promise<MediaUploadResponse> {
    try {
      // Validate file type
      const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/quicktime',
      ];

      if (!allowedTypes.includes(uploadRequest.file_type)) {
        throw new ValidationError(`File type ${uploadRequest.file_type} not allowed`);
      }

      // Validate file size
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
      if (uploadRequest.file_size > maxSize) {
        throw new ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`);
      }

      // Generate unique file path
      const fileExtension = uploadRequest.file_type.split('/')[1];
      const fileName = `${userId}/${uuidv4()}.${fileExtension}`;
      const filePath = `media/${fileName}`;

      // Generate signed URL for upload
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(filePath, {
          upsert: false,
        });

      if (error || !data) {
        logger.error('Failed to generate signed URL:', error);
        throw new AppError('Failed to generate upload URL');
      }

      const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/media/${filePath}`;

      logger.info('Upload URL generated successfully:', { userId, filePath });

      return {
        upload_url: data.signedUrl,
        public_url: publicUrl,
        file_path: filePath,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      logger.error('Error generating upload URL:', error);
      throw new AppError('Failed to generate upload URL');
    }
  }

  /**
   * Delete media file
   */
  static async deleteMedia(userId: string, filePath: string): Promise<void> {
    try {
      // Verify file belongs to user
      if (!filePath.startsWith(`media/${userId}/`)) {
        throw new AppError('Access denied: File does not belong to user');
      }

      const { error } = await supabaseAdmin.storage
        .from('media')
        .remove([filePath]);

      if (error) {
        logger.error('Failed to delete media file:', error);
        throw new AppError('Failed to delete media file');
      }

      logger.info('Media file deleted successfully:', { userId, filePath });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deleting media file:', error);
      throw new AppError('Failed to delete media file');
    }
  }

  /**
   * Get media file info
   */
  static async getMediaInfo(filePath: string): Promise<{
    file_path: string;
    public_url: string;
    size: number;
    created_at: string;
  }> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()!,
        });

      if (error || !data || data.length === 0) {
        throw new AppError('Media file not found');
      }

      const file = data[0]!;
      const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/media/${filePath}`;

      return {
        file_path: filePath,
        public_url: publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting media info:', error);
      throw new AppError('Failed to get media info');
    }
  }

  /**
   * List user's media files
   */
  static async listUserMedia(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .list(`media/${userId}`, {
          limit,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        logger.error('Failed to list user media:', error);
        throw new AppError('Failed to list media files');
      }

      return data || [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error listing user media:', error);
      throw new AppError('Failed to list media files');
    }
  }

  /**
   * Create media bucket if it doesn't exist
   */
  static async ensureMediaBucket(): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin.storage.getBucket('media');

      if (error && error.message.includes('not found')) {
        // Create bucket
        const { error: createError } = await supabaseAdmin.storage.createBucket('media', {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/quicktime',
          ],
          fileSizeLimit: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
        });

        if (createError) {
          logger.error('Failed to create media bucket:', createError);
          throw new AppError('Failed to create media bucket');
        }

        logger.info('Media bucket created successfully');
      } else if (error) {
        logger.error('Error checking media bucket:', error);
        throw new AppError('Failed to check media bucket');
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error ensuring media bucket:', error);
      throw new AppError('Failed to ensure media bucket');
    }
  }
}
