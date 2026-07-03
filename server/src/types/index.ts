import { z } from 'zod';

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'official' | 'analyst';
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'citizen' | 'official' | 'analyst';
}

// Report types
export interface Report {
  id: string;
  user_id: string;
  description: string;
  media_urls: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: 'new' | 'verified' | 'rejected';
  sentiment: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateReportRequest {
  description: string;
  media_urls?: string[];
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateReportRequest {
  status: 'verified' | 'rejected';
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  status?: 'new' | 'verified' | 'rejected';
  min_lat?: number;
  min_lon?: number;
  max_lat?: number;
  max_lon?: number;
  user_id?: string;
  page?: number;
  limit?: number;
}

// Heatmap types
export interface HeatmapPoint {
  grid_id: string;
  lat: number;
  lon: number;
  count: number;
  avg_sentiment: number | null;
  geojson: any;
}

export interface HeatmapFilters {
  grid_size?: number;
  start_date?: string;
  end_date?: string;
}

// Media upload types
export interface MediaUploadRequest {
  file_type: string;
  file_size: number;
}

export interface MediaUploadResponse {
  upload_url: string;
  public_url: string;
  file_path: string;
}

// NLP types
export interface NLPAnalysisRequest {
  text: string;
  source?: 'report' | 'social_media';
}

export interface NLPAnalysisResponse {
  tags: string[];
  sentiment_score: number;
  confidence: number;
  hazard_classification: string;
}

// Social media types
export interface SocialMediaPost {
  id: string;
  platform: string;
  content: string;
  author: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  url: string;
}

export interface SocialMediaIngestRequest {
  posts: SocialMediaPost[];
}

// Offline sync types
export interface OfflineReport {
  id: string;
  description: string;
  media_urls: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  device_id: string;
}

export interface OfflineSyncRequest {
  reports: OfflineReport[];
}

export interface OfflineSyncResponse {
  synced_count: number;
  failed_reports: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Validation schemas
export const CreateUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.enum(['citizen', 'official', 'analyst']).default('citizen'),
});

export const CreateReportSchema = z.object({
  description: z.string().min(1).max(5000),
  media_urls: z.array(z.string().url()).optional().default([]),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

export const UpdateReportSchema = z.object({
  status: z.enum(['verified', 'rejected']),
});

export const ReportFiltersSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  status: z.enum(['new', 'verified', 'rejected']).optional(),
  min_lat: z.coerce.number().min(-90).max(90).optional(),
  min_lon: z.coerce.number().min(-180).max(180).optional(),
  max_lat: z.coerce.number().min(-90).max(90).optional(),
  max_lon: z.coerce.number().min(-180).max(180).optional(),
  user_id: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const MediaUploadSchema = z.object({
  file_type: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/),
  file_size: z.number().min(1).max(10485760), // 10MB max
});

export const NLPAnalysisSchema = z.object({
  text: z.string().min(1).max(10000),
  source: z.enum(['report', 'social_media']).optional().default('report'),
});

export const SocialMediaIngestSchema = z.object({
  posts: z.array(z.object({
    id: z.string(),
    platform: z.string(),
    content: z.string(),
    author: z.string(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    created_at: z.string().datetime(),
    url: z.string().url(),
  })),
});

export const OfflineSyncSchema = z.object({
  reports: z.array(z.object({
    id: z.string(),
    description: z.string(),
    media_urls: z.array(z.string()),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    created_at: z.string().datetime(),
    device_id: z.string(),
  })),
});

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}
