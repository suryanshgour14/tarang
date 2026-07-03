import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService';
import { OfflineSyncSchema } from '../types';
import { validateBody } from '../middleware/validation';
import { logger } from '../utils/logger';

/**
 * Sync offline reports
 */
export const syncOfflineReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { reports } = req.body;
    
    // Validate reports
    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No reports provided for sync',
      });
      return;
    }

    // Limit batch size to prevent abuse
    const maxBatchSize = 100;
    if (reports.length > maxBatchSize) {
      res.status(400).json({
        success: false,
        error: `Batch size exceeds maximum of ${maxBatchSize} reports`,
      });
      return;
    }

    // Convert offline reports to create report format
    const createReports = reports.map((report: any) => ({
      description: report.description,
      media_urls: report.media_urls || [],
      location: {
        latitude: report.location.latitude,
        longitude: report.location.longitude,
      },
    }));

    // Bulk create reports
    const result = await ReportService.bulkCreateReports(userId, createReports);
    
    logger.info('Offline sync completed:', { 
      userId, 
      requested: reports.length,
      synced: result.created,
      failed: result.failed.length,
    });
    
    res.status(201).json({
      success: true,
      data: {
        synced_count: result.created,
        failed_reports: result.failed,
        total_requested: reports.length,
      },
      message: 'Offline reports synced successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sync status
 */
export const getSyncStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    
    // Get user's recent reports count
    const recentReports = await ReportService.getReports({
      user_id: userId,
      limit: 1,
    });

    res.json({
      success: true,
      data: {
        user_id: userId,
        last_sync: new Date().toISOString(),
        total_reports: recentReports.total,
        sync_status: 'ready',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export validation middleware
export const validateOfflineSync = validateBody(OfflineSyncSchema);
