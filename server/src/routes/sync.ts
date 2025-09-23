import { Router } from 'express';
import { 
  syncOfflineReports,
  getSyncStatus,
  validateOfflineSync
} from '../controllers/syncController';
import { authenticate } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /sync:
 *   post:
 *     summary: Sync offline reports
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reports
 *             properties:
 *               reports:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - description
 *                     - location
 *                     - created_at
 *                     - device_id
 *                   properties:
 *                     id:
 *                       type: string
 *                     description:
 *                       type: string
 *                     media_urls:
 *                       type: array
 *                       items:
 *                         type: string
 *                     location:
 *                       type: object
 *                       required:
 *                         - latitude
 *                         - longitude
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     device_id:
 *                       type: string
 *     responses:
 *       201:
 *         description: Reports synced successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/', 
  authenticate, 
  generalLimiter,
  validateOfflineSync,
  syncOfflineReports
);

/**
 * @swagger
 * /sync/status:
 *   get:
 *     summary: Get sync status
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/status', 
  authenticate, 
  getSyncStatus
);

export default router;
