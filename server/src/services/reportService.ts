import { supabase, supabaseAdmin } from '../config/database';
import { Report, CreateReportRequest, ReportFilters, UpdateReportRequest, HeatmapPoint, HeatmapFilters } from '../types';
import { NotFoundError, AppError } from '../types';
import { logger } from '../utils/logger';

export class ReportService {
  /**
   * Create a new report
   */
  static async createReport(userId: string, reportData: CreateReportRequest): Promise<Report> {
    try {
      // Convert location to PostGIS format
      const location = `POINT(${reportData.location.longitude} ${reportData.location.latitude})`;
      
      const { data: report, error } = await supabaseAdmin
        .from('reports')
        .insert({
          user_id: userId,
          description: reportData.description,
          media_urls: reportData.media_urls || [],
          location: location,
          status: 'new',
        })
        .select()
        .single();

      if (error || !report) {
        logger.error('Failed to create report:', error);
        throw new AppError('Failed to create report');
      }

      logger.info('Report created successfully:', { reportId: report.id, userId });
      return report as Report;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating report:', error);
      throw new AppError('Failed to create report');
    }
  }

  /**
   * Get report by ID
   */
  static async getReportById(reportId: string): Promise<Report> {
    try {
      const { data: report, error } = await supabaseAdmin
        .from('reports')
        .select(`
          *,
          users:user_id (
            id,
            name,
            email,
            role
          )
        `)
        .eq('id', reportId)
        .single();

      if (error || !report) {
        throw new NotFoundError('Report not found');
      }

      return report as Report;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error getting report by ID:', error);
      throw new AppError('Failed to get report');
    }
  }

  /**
   * Get reports with filters and pagination
   */
  static async getReports(filters: ReportFilters): Promise<{
    reports: Report[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;

      // Bounding-box queries go through the get_reports_in_bbox RPC (PostGIS index),
      // which doesn't support joining/ordering/pagination server-side, so those are
      // applied in-memory on the (already geo-limited) result set.
      if (filters.min_lat && filters.min_lon && filters.max_lat && filters.max_lon) {
        const { data: bboxReports, error } = await supabaseAdmin.rpc('get_reports_in_bbox', {
          min_lat: filters.min_lat,
          min_lon: filters.min_lon,
          max_lat: filters.max_lat,
          max_lon: filters.max_lon,
        });

        if (error) {
          logger.error('Error getting reports in bbox:', error);
          throw new AppError('Failed to get reports');
        }

        let filtered = (bboxReports || []) as unknown as Report[];
        if (filters.user_id) {
          filtered = filtered.filter(r => r.user_id === filters.user_id);
        }
        if (filters.status) {
          filtered = filtered.filter(r => r.status === filters.status);
        }
        if (filters.start_date) {
          filtered = filtered.filter(r => r.created_at >= filters.start_date!);
        }
        if (filters.end_date) {
          filtered = filtered.filter(r => r.created_at <= filters.end_date!);
        }

        filtered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        const total = filtered.length;
        const paged = filtered.slice((page - 1) * limit, page * limit);

        return { reports: paged, total, page, limit };
      }

      let query = supabaseAdmin
        .from('reports')
        .select(`
          *,
          users:user_id (
            id,
            name,
            email,
            role
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const { data: reports, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error getting reports:', error);
        throw new AppError('Failed to get reports');
      }

      return {
        reports: reports as Report[],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting reports:', error);
      throw new AppError('Failed to get reports');
    }
  }

  /**
   * Update report status
   */
  static async updateReportStatus(reportId: string, updateData: UpdateReportRequest): Promise<Report> {
    try {
      const { data: report, error } = await supabaseAdmin
        .from('reports')
        .update({
          status: updateData.status,
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error || !report) {
        throw new NotFoundError('Report not found or update failed');
      }

      logger.info('Report status updated:', { reportId, status: updateData.status });
      return report as Report;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating report status:', error);
      throw new AppError('Failed to update report status');
    }
  }

  /**
   * Update report with NLP analysis results
   */
  static async updateReportAnalysis(reportId: string, analysis: {
    sentiment: number;
    tags: string[];
  }): Promise<Report> {
    try {
      const { data: report, error } = await supabaseAdmin
        .from('reports')
        .update({
          sentiment: analysis.sentiment,
          tags: analysis.tags,
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error || !report) {
        throw new NotFoundError('Report not found or update failed');
      }

      logger.info('Report analysis updated:', { reportId, sentiment: analysis.sentiment, tags: analysis.tags });
      return report as Report;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating report analysis:', error);
      throw new AppError('Failed to update report analysis');
    }
  }

  /**
   * Delete report
   */
  static async deleteReport(reportId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        logger.error('Failed to delete report:', error);
        throw new AppError('Failed to delete report');
      }

      logger.info('Report deleted successfully:', { reportId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deleting report:', error);
      throw new AppError('Failed to delete report');
    }
  }

  /**
   * Get heatmap data
   */
  static async getHeatmapData(filters: HeatmapFilters): Promise<HeatmapPoint[]> {
    try {
      const { data: heatmapData, error } = await supabaseAdmin
        .rpc('get_heatmap_data', {
          grid_size: filters.grid_size || 0.01,
          ...(filters.start_date ? { start_date: filters.start_date } : {}),
          ...(filters.end_date ? { end_date: filters.end_date } : {}),
        });

      if (error) {
        logger.error('Error getting heatmap data:', error);
        throw new AppError('Failed to get heatmap data');
      }

      return heatmapData as HeatmapPoint[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting heatmap data:', error);
      throw new AppError('Failed to get heatmap data');
    }
  }

  /**
   * Get reports by geohash
   */
  static async getReportsByGeohash(precision: number = 6): Promise<any[]> {
    try {
      const { data: geohashData, error } = await supabaseAdmin
        .rpc('get_reports_by_geohash', {
          geohash_precision: precision,
        });

      if (error) {
        logger.error('Error getting reports by geohash:', error);
        throw new AppError('Failed to get reports by geohash');
      }

      return geohashData;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting reports by geohash:', error);
      throw new AppError('Failed to get reports by geohash');
    }
  }

  /**
   * Bulk create reports (for offline sync)
   */
  static async bulkCreateReports(userId: string, reports: CreateReportRequest[]): Promise<{
    created: number;
    failed: string[];
  }> {
    try {
      const reportsToInsert = reports.map(report => ({
        user_id: userId,
        description: report.description,
        media_urls: report.media_urls || [],
        location: `POINT(${report.location.longitude} ${report.location.latitude})`,
        status: 'new' as const,
      }));

      const { data, error } = await supabaseAdmin
        .from('reports')
        .insert(reportsToInsert)
        .select();

      if (error) {
        logger.error('Error bulk creating reports:', error);
        throw new AppError('Failed to bulk create reports');
      }

      logger.info('Bulk reports created successfully:', { count: data?.length || 0, userId });
      
      return {
        created: data?.length || 0,
        failed: [],
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error bulk creating reports:', error);
      throw new AppError('Failed to bulk create reports');
    }
  }

  /**
   * Get report statistics
   */
  static async getReportStats(): Promise<{
    total: number;
    new: number;
    verified: number;
    rejected: number;
    avg_sentiment: number;
  }> {
    try {
      const { data: stats, error } = await supabaseAdmin
        .from('reports')
        .select('status, sentiment');

      if (error) {
        logger.error('Error getting report stats:', error);
        throw new AppError('Failed to get report statistics');
      }

      const total = stats?.length || 0;
      const newCount = stats?.filter(r => r.status === 'new').length || 0;
      const verifiedCount = stats?.filter(r => r.status === 'verified').length || 0;
      const rejectedCount = stats?.filter(r => r.status === 'rejected').length || 0;
      const avgSentiment = stats?.reduce((sum, r) => sum + (r.sentiment || 0), 0) / total || 0;

      return {
        total,
        new: newCount,
        verified: verifiedCount,
        rejected: rejectedCount,
        avg_sentiment: avgSentiment,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting report stats:', error);
      throw new AppError('Failed to get report statistics');
    }
  }
}
