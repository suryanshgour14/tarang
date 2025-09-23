import { Request, Response, NextFunction } from 'express';
import { MediaService } from '../services/mediaService';
import { MediaUploadSchema } from '../types';
import { validateBody, validateQuery } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../utils/logger';

const ListMediaQuerySchema = z.object({
  limit: z.string().transform(Number).default('50'),
});

/**
 * Generate signed URL for media upload
 */
export const generateUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const uploadRequest = req.body;
    
    const uploadData = await MediaService.generateUploadUrl(userId, uploadRequest);
    
    logger.info('Upload URL generated:', { userId, filePath: uploadData.file_path });
    
    res.json({
      success: true,
      data: uploadData,
      message: 'Upload URL generated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete media file
 */
export const deleteMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { filePath } = req.params;
    
    await MediaService.deleteMedia(userId, filePath);
    
    logger.info('Media file deleted:', { userId, filePath });
    
    res.json({
      success: true,
      message: 'Media file deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get media file info
 */
export const getMediaInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filePath } = req.params;
    
    const mediaInfo = await MediaService.getMediaInfo(filePath);
    
    res.json({
      success: true,
      data: mediaInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List user's media files
 */
export const listUserMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { limit } = req.query;
    
    const mediaFiles = await MediaService.listUserMedia(userId, limit as number);
    
    res.json({
      success: true,
      data: mediaFiles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize media bucket (admin only)
 */
export const initializeMediaBucket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await MediaService.ensureMediaBucket();
    
    logger.info('Media bucket initialized');
    
    res.json({
      success: true,
      message: 'Media bucket initialized successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Export validation middleware
export const validateMediaUpload = validateBody(MediaUploadSchema);
export const validateListMedia = validateQuery(ListMediaQuerySchema);
