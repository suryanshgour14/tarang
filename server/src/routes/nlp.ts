import { Router } from 'express';
import { 
  analyzeText,
  batchAnalyze,
  getRegionalKeywords,
  ingestSocialMedia,
  getNLPStatus,
  validateNLPAnalysis,
  validateBatchAnalysis,
  validateSocialMediaIngest
} from '../controllers/nlpController';
import { 
  authenticate, 
  requireAnalyst 
} from '../middleware/auth';
import { 
  generalLimiter, 
  nlpAnalysisLimiter 
} from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /nlp/analyze:
 *   post:
 *     summary: Analyze text for hazard classification and sentiment
 *     tags: [NLP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "High waves observed near the beach, very dangerous conditions"
 *               source:
 *                 type: string
 *                 enum: [report, social_media]
 *                 default: report
 *     responses:
 *       200:
 *         description: Text analysis completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/analyze', 
  authenticate, 
  nlpAnalysisLimiter,
  validateNLPAnalysis,
  analyzeText
);

/**
 * @swagger
 * /nlp/batch-analyze:
 *   post:
 *     summary: Batch analyze multiple texts
 *     tags: [NLP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - texts
 *             properties:
 *               texts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                   properties:
 *                     text:
 *                       type: string
 *                     source:
 *                       type: string
 *                       enum: [report, social_media]
 *     responses:
 *       200:
 *         description: Batch analysis completed successfully
 *       400:
 *         description: Validation error
 */
router.post('/batch-analyze', 
  authenticate, 
  requireAnalyst,
  nlpAnalysisLimiter,
  validateBatchAnalysis,
  batchAnalyze
);

/**
 * @swagger
 * /nlp/regional-keywords/{region}:
 *   get:
 *     summary: Get regional hazard keywords
 *     tags: [NLP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *           example: "pacific"
 *     responses:
 *       200:
 *         description: Regional keywords retrieved successfully
 */
router.get('/regional-keywords/:region', 
  authenticate, 
  getRegionalKeywords
);

/**
 * @swagger
 * /nlp/social-ingest:
 *   post:
 *     summary: Ingest social media posts for analysis
 *     tags: [NLP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - posts
 *             properties:
 *               posts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - platform
 *                     - content
 *                     - author
 *                     - created_at
 *                     - url
 *                   properties:
 *                     id:
 *                       type: string
 *                     platform:
 *                       type: string
 *                     content:
 *                       type: string
 *                     author:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     url:
 *                       type: string
 *                       format: uri
 *     responses:
 *       200:
 *         description: Social media posts ingested successfully
 *       400:
 *         description: Validation error
 */
router.post('/social-ingest', 
  authenticate, 
  requireAnalyst,
  nlpAnalysisLimiter,
  validateSocialMediaIngest,
  ingestSocialMedia
);

/**
 * @swagger
 * /nlp/status:
 *   get:
 *     summary: Get NLP service status
 *     tags: [NLP]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: NLP service status retrieved successfully
 */
router.get('/status', 
  authenticate, 
  getNLPStatus
);

export default router;
