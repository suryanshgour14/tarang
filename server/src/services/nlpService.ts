import { NLPAnalysisRequest, NLPAnalysisResponse } from '../types';
import { AppError } from '../types';
import { logger } from '../utils/logger';

export class NLPService {
  private static nlpServiceUrl: string;
  private static nlpApiKey: string;

  static initialize() {
    this.nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:8000';
    this.nlpApiKey = process.env.NLP_SERVICE_API_KEY || '';
  }

  /**
   * Analyze text for hazard classification and sentiment
   */
  static async analyzeText(analysisRequest: NLPAnalysisRequest): Promise<NLPAnalysisResponse> {
    try {
      // If no NLP service is configured, use local analysis
      if (!this.nlpServiceUrl || this.nlpServiceUrl === 'http://localhost:8000') {
        return this.localAnalysis(analysisRequest.text);
      }

      // Call external NLP service
      const response = await fetch(`${this.nlpServiceUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.nlpApiKey}`,
        },
        body: JSON.stringify(analysisRequest),
      });

      if (!response.ok) {
        logger.warn('NLP service unavailable, falling back to local analysis');
        return this.localAnalysis(analysisRequest.text);
      }

      const result = await response.json();
      return result as NLPAnalysisResponse;
    } catch (error) {
      logger.warn('NLP service error, falling back to local analysis:', error);
      return this.localAnalysis(analysisRequest.text);
    }
  }

  /**
   * Local analysis fallback
   */
  private static localAnalysis(text: string): NLPAnalysisResponse {
    const lowerText = text.toLowerCase();
    
    // Hazard keywords
    const hazardKeywords = [
      'tsunami', 'tidal wave', 'surge', 'flood', 'flooding',
      'storm surge', 'high tide', 'wave', 'waves', 'rough sea',
      'dangerous', 'hazard', 'warning', 'alert', 'emergency',
      'evacuate', 'evacuation', 'damage', 'destruction',
      'coastal', 'beach', 'shore', 'ocean', 'sea'
    ];

    // Sentiment keywords
    const positiveKeywords = ['good', 'safe', 'calm', 'peaceful', 'beautiful', 'clear'];
    const negativeKeywords = ['bad', 'dangerous', 'scary', 'terrible', 'awful', 'frightening'];

    // Classify hazard type
    let hazardClassification = 'none';
    let confidence = 0.5;

    if (lowerText.includes('tsunami') || lowerText.includes('tidal wave')) {
      hazardClassification = 'tsunami';
      confidence = 0.9;
    } else if (lowerText.includes('storm surge') || lowerText.includes('surge')) {
      hazardClassification = 'storm_surge';
      confidence = 0.8;
    } else if (lowerText.includes('flood') || lowerText.includes('flooding')) {
      hazardClassification = 'flooding';
      confidence = 0.7;
    } else if (lowerText.includes('wave') || lowerText.includes('rough sea')) {
      hazardClassification = 'high_waves';
      confidence = 0.6;
    }

    // Calculate sentiment
    let sentimentScore = 0;
    const words = lowerText.split(/\s+/);
    
    words.forEach(word => {
      if (positiveKeywords.includes(word)) {
        sentimentScore += 1;
      } else if (negativeKeywords.includes(word)) {
        sentimentScore -= 1;
      }
    });

    // Normalize sentiment to -1 to 1 range
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore / words.length * 10));

    // Extract tags
    const tags = hazardKeywords.filter(keyword => lowerText.includes(keyword));

    return {
      tags,
      sentiment_score: sentimentScore,
      confidence,
      hazard_classification: hazardClassification,
    };
  }

  /**
   * Batch analyze multiple texts
   */
  static async batchAnalyze(requests: NLPAnalysisRequest[]): Promise<NLPAnalysisResponse[]> {
    try {
      const results = await Promise.all(
        requests.map(request => this.analyzeText(request))
      );
      
      return results;
    } catch (error) {
      logger.error('Error in batch analysis:', error);
      throw new AppError('Failed to perform batch analysis');
    }
  }

  /**
   * Get hazard keywords for a specific region
   */
  static getRegionalHazardKeywords(region: string): string[] {
    const regionalKeywords: { [key: string]: string[] } = {
      'pacific': ['tsunami', 'earthquake', 'volcanic', 'typhoon'],
      'atlantic': ['hurricane', 'storm surge', 'nor\'easter'],
      'indian': ['cyclone', 'monsoon', 'storm surge'],
      'arctic': ['ice', 'freeze', 'blizzard'],
    };

    return regionalKeywords[region.toLowerCase()] || [];
  }

  /**
   * Validate text for analysis
   */
  static validateText(text: string): { isValid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: 'Text cannot be empty' };
    }

    if (text.length > 10000) {
      return { isValid: false, error: 'Text exceeds maximum length of 10000 characters' };
    }

    if (text.length < 10) {
      return { isValid: false, error: 'Text is too short for meaningful analysis' };
    }

    return { isValid: true };
  }
}
