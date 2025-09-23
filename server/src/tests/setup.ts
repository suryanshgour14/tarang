import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

// Mock external services for testing
jest.mock('../services/nlpService', () => ({
  NLPService: {
    initialize: jest.fn(),
    analyzeText: jest.fn().mockResolvedValue({
      tags: ['tsunami', 'danger'],
      sentiment_score: -0.8,
      confidence: 0.9,
      hazard_classification: 'tsunami',
    }),
    batchAnalyze: jest.fn().mockResolvedValue([]),
    getRegionalHazardKeywords: jest.fn().mockReturnValue(['tsunami', 'earthquake']),
    validateText: jest.fn().mockReturnValue({ isValid: true }),
  },
}));

jest.mock('../services/mediaService', () => ({
  MediaService: {
    generateUploadUrl: jest.fn().mockResolvedValue({
      upload_url: 'https://example.com/upload',
      public_url: 'https://example.com/public',
      file_path: 'media/test.jpg',
    }),
    deleteMedia: jest.fn().mockResolvedValue(undefined),
    getMediaInfo: jest.fn().mockResolvedValue({
      file_path: 'media/test.jpg',
      public_url: 'https://example.com/public',
      size: 1024,
      created_at: '2023-01-01T00:00:00Z',
    }),
    listUserMedia: jest.fn().mockResolvedValue([]),
    ensureMediaBucket: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../config/database', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              role: 'citizen',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            },
            error: null,
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-report-id',
              user_id: 'test-user-id',
              description: 'Test report',
              media_urls: [],
              location: 'POINT(0 0)',
              status: 'new',
              sentiment: null,
              tags: [],
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            },
            error: null,
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'test-report-id',
                status: 'verified',
              },
              error: null,
            }),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }),
    }),
    rpc: jest.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  },
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
        deleteUser: jest.fn().mockResolvedValue({
          error: null,
        }),
        updateUserById: jest.fn().mockResolvedValue({
          error: null,
        }),
      },
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              role: 'citizen',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            },
            error: null,
          }),
        }),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              role: 'citizen',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            },
            error: null,
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'test-user-id',
                name: 'Updated User',
                email: 'test@example.com',
                role: 'citizen',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }),
    }),
    rpc: jest.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        createSignedUploadUrl: jest.fn().mockResolvedValue({
          data: {
            signedUrl: 'https://example.com/upload',
          },
          error: null,
        }),
        remove: jest.fn().mockResolvedValue({
          error: null,
        }),
        list: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
      createBucket: jest.fn().mockResolvedValue({
        error: null,
      }),
      getBucket: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'not found' },
      }),
    }),
  },
  testConnection: jest.fn().mockResolvedValue(true),
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    http: jest.fn(),
  },
}));
