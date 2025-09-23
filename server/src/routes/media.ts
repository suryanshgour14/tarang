import { Router } from 'express';
import { 
  generateUploadUrl,
  deleteMedia,
  getMediaInfo,
  listUserMedia,
  initializeMediaBucket,
  validateMediaUpload,
  validateListMedia
} from '../controllers/mediaController';
import { 
  authenticate, 
  requireOfficial 
} from '../middleware/auth';
import { 
  generalLimiter, 
  mediaUploadLimiter 
} from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /media/upload-url:
 *   post:
 *     summary: Generate signed URL for media upload
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - file_type
 *               - file_size
 *             properties:
 *               file_type:
 *                 type: string
 *                 example: "image/jpeg"
 *               file_size:
 *                 type: integer
 *                 example: 1024000
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/upload-url', 
  authenticate, 
  mediaUploadLimiter,
  validateMediaUpload,
  generateUploadUrl
);

/**
 * @swagger
 * /media/{filePath}:
 *   delete:
 *     summary: Delete media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filePath
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media file deleted successfully
 *       404:
 *         description: Media file not found
 */
router.delete('/:filePath(*)', 
  authenticate, 
  deleteMedia
);

/**
 * @swagger
 * /media/{filePath}:
 *   get:
 *     summary: Get media file info
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filePath
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media file info retrieved successfully
 *       404:
 *         description: Media file not found
 */
router.get('/:filePath(*)', 
  authenticate, 
  getMediaInfo
);

/**
 * @swagger
 * /media:
 *   get:
 *     summary: List user's media files
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Media files retrieved successfully
 */
router.get('/', 
  authenticate, 
  validateListMedia,
  listUserMedia
);

/**
 * @swagger
 * /media/init:
 *   post:
 *     summary: Initialize media bucket (admin only)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Media bucket initialized successfully
 *       403:
 *         description: Admin access required
 */
router.post('/init', 
  authenticate, 
  requireOfficial,
  initializeMediaBucket
);

export default router;
