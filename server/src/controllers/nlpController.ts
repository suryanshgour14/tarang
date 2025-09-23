import { Request, Response, NextFunction } from 'express';
import { NLPService } from '../services/nlpService';
import { NLPAnalysisSchema, SocialMediaIngestSchema } from '../types';
import { validateBody } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../utils/logger';

const BatchAnalysisSchema = z.object({
  texts: z.array(z.object({
    text: z.string(),
    source: z.enum(['report', 'social_media']).optional().default('report'),
  })),
});

/**
 * Analyze text for hazard classification and sentiment
 */
export const analyzeText = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysisRequest = req.body;
    
    // Validate text
    const validation = NLPService.validateText(analysisRequest.text);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const result = await NLPService.analyzeText(analysisRequest);
    
    logger.info('Text analysis completed:', { 
      textLength: analysisRequest.text.length,
      hazardClassification: result.hazard_classification,
      sentimentScore: result.sentiment_score,
      tagsCount: result.tags.length,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch analyze multiple texts
 */
export const batchAnalyze = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { texts } = req.body;
    
    // Validate all texts
    for (const textObj of texts) {
      const validation = NLPService.validateText(textObj.text);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: `Text validation failed: ${validation.error}`,
        });
      }
    }

    const results = await NLPService.batchAnalyze(texts);
    
    logger.info('Batch analysis completed:', { 
      textCount: texts.length,
      resultsCount: results.length,
    });
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get regional hazard keywords
 */
export const getRegionalKeywords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region } = req.params;
    const keywords = NLPService.getRegionalHazardKeywords(region);
    
    res.json({
      success: true,
      data: {
        region,
        keywords,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ingest social media posts for analysis
 */
export const ingestSocialMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { posts } = req.body;
    
    // Analyze each post
    const analysisPromises = posts.map((post: any) => 
      NLPService.analyzeText({
        text: post.content,
        source: 'social_media',
      })
    );

    const analyses = await Promise.all(analysisPromises);
    
    // Filter posts with hazard indicators
    const hazardPosts = posts.filter((post: any, index: number) => {
      const analysis = analyses[index];
      return analysis.hazard_classification !== 'none' || 
             analysis.sentiment_score < -0.3 ||
             analysis.tags.length > 0;
    });

    logger.info('Social media ingestion completed:', { 
      totalPosts: posts.length,
      hazardPosts: hazardPosts.length,
    });
    
    res.json({
      success: true,
      data: {
        total_posts: posts.length,
        hazard_posts: hazardPosts.length,
        analyses,
        hazard_posts_data: hazardPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get NLP service status
 */
export const getNLPStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nlpServiceUrl = process.env.NLP_SERVICE_URL;
    const isExternalService = nlpServiceUrl && nlpServiceUrl !== 'http://localhost:8000';
    
    res.json({
      success: true,
      data: {
        service_type: isExternalService ? 'external' : 'local',
        service_url: nlpServiceUrl,
        status: 'operational',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export validation middleware
export const validateNLPAnalysis = validateBody(NLPAnalysisSchema);
export const validateBatchAnalysis = validateBody(BatchAnalysisSchema);
export const validateSocialMediaIngest = validateBody(SocialMediaIngestSchema);
