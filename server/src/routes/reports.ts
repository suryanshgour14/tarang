import { Router } from 'express';
import { 
  createReport,
  getReportById,
  getReports,
  updateReportStatus,
  deleteReport,
  getHeatmapData,
  getReportsByGeohash,
  getReportStats,
  bulkCreateReports,
  validateCreateReport,
  validateUpdateReport,
  validateReportFilters,
  validateHeatmapFilters
} from '../controllers/reportController';
import { 
  authenticate, 
  requireCitizen, 
  requireOfficial,
  canAccessReport 
} from '../middleware/auth';
import { 
  generalLimiter, 
  reportSubmissionLimiter 
} from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - location
 *             properties:
 *               description:
 *                 type: string
 *                 example: "High waves observed near the beach"
 *               media_urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image1.jpg"]
 *               location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 37.7749
 *                   longitude:
 *                     type: number
 *                     example: -122.4194
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/', 
  authenticate, 
  requireCitizen,
  reportSubmissionLimiter,
  validateCreateReport,
  createReport
);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get reports with filters
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, verified, rejected]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: min_lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: min_lon
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_lon
 *         schema:
 *           type: number
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/', 
  authenticate, 
  generalLimiter,
  validateReportFilters,
  getReports
);

/**
 * @swagger
 * /reports/heatmap:
 *   get:
 *     summary: Get heatmap data for reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grid_size
 *         schema:
 *           type: number
 *           default: 0.01
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Heatmap data retrieved successfully
 */
router.get('/heatmap', 
  authenticate, 
  validateHeatmapFilters,
  getHeatmapData
);

/**
 * @swagger
 * /reports/geohash:
 *   get:
 *     summary: Get reports grouped by geohash
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: precision
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Geohash data retrieved successfully
 */
router.get('/geohash', 
  authenticate, 
  getReportsByGeohash
);

/**
 * @swagger
 * /reports/stats:
 *   get:
 *     summary: Get report statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', 
  authenticate, 
  requireOfficial,
  getReportStats
);

/**
 * @swagger
 * /reports/sync:
 *   post:
 *     summary: Sync offline reports
 *     tags: [Reports]
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
 *                     - description
 *                     - location
 *                   properties:
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
 *     responses:
 *       201:
 *         description: Reports synced successfully
 */
router.post('/sync', 
  authenticate, 
  requireCitizen,
  bulkCreateReports
);

/**
 * @swagger
 * /reports/{reportId}:
 *   get:
 *     summary: Get report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *       404:
 *         description: Report not found
 */
router.get('/:reportId', 
  authenticate, 
  canAccessReport,
  getReportById
);

/**
 * @swagger
 * /reports/{reportId}/verify:
 *   patch:
 *     summary: Verify or reject report (officials only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, rejected]
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *       403:
 *         description: Official access required
 */
router.patch('/:reportId/verify', 
  authenticate, 
  requireOfficial,
  validateUpdateReport,
  updateReportStatus
);

/**
 * @swagger
 * /reports/{reportId}:
 *   delete:
 *     summary: Delete report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 */
router.delete('/:reportId', 
  authenticate, 
  canAccessReport,
  deleteReport
);

export default router;
