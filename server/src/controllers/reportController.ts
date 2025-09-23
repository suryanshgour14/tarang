import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService';
import { CreateReportSchema, UpdateReportSchema, ReportFiltersSchema } from '../types';
import { validateBody, validateQuery } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../utils/logger';

const HeatmapFiltersSchema = z.object({
  grid_size: z.string().transform(Number).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

/**
 * Create a new report
 */
export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const reportData = req.body;
    
    const report = await ReportService.createReport(userId, reportData);
    
    logger.info('Report created successfully:', { reportId: report.id, userId });
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Report created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get report by ID
 */
export const getReportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const report = await ReportService.getReportById(reportId);
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reports with filters
 */
export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;
    const result = await ReportService.getReports(filters as any);
    
    res.json({
      success: true,
      data: result.reports,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update report status (officials only)
 */
export const updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const updateData = req.body;
    
    const report = await ReportService.updateReportStatus(reportId, updateData);
    
    logger.info('Report status updated:', { reportId, status: updateData.status });
    
    res.json({
      success: true,
      data: report,
      message: 'Report status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete report
 */
export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    await ReportService.deleteReport(reportId);
    
    logger.info('Report deleted successfully:', { reportId });
    
    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get heatmap data
 */
export const getHeatmapData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;
    const heatmapData = await ReportService.getHeatmapData(filters as any);
    
    // Convert to GeoJSON format
    const geojson = {
      type: 'FeatureCollection',
      features: heatmapData.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lon, point.lat],
        },
        properties: {
          grid_id: point.grid_id,
          count: point.count,
          avg_sentiment: point.avg_sentiment,
        },
      })),
    };
    
    res.json({
      success: true,
      data: geojson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reports by geohash
 */
export const getReportsByGeohash = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { precision } = req.query;
    const precisionNum = precision ? parseInt(precision as string) : 6;
    
    const geohashData = await ReportService.getReportsByGeohash(precisionNum);
    
    res.json({
      success: true,
      data: geohashData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get report statistics
 */
export const getReportStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await ReportService.getReportStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create reports (offline sync)
 */
export const bulkCreateReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { reports } = req.body;
    
    const result = await ReportService.bulkCreateReports(userId, reports);
    
    logger.info('Bulk reports created:', { userId, created: result.created, failed: result.failed.length });
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Reports synced successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Export validation middleware
export const validateCreateReport = validateBody(CreateReportSchema);
export const validateUpdateReport = validateBody(UpdateReportSchema);
export const validateReportFilters = validateQuery(ReportFiltersSchema);
export const validateHeatmapFilters = validateQuery(HeatmapFiltersSchema);
