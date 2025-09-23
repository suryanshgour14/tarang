import request from 'supertest';
import { app } from '../app';
import '../tests/setup';

describe('Reports', () => {
  const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'citizen',
  };

  const mockReport = {
    description: 'High waves observed near the beach',
    media_urls: ['https://example.com/image.jpg'],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  };

  // Mock authentication middleware
  beforeEach(() => {
    jest.doMock('../middleware/auth', () => ({
      authenticate: (req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
      },
      requireCitizen: (req: any, res: any, next: any) => next(),
      requireOfficial: (req: any, res: any, next: any) => next(),
      canAccessReport: (req: any, res: any, next: any) => next(),
    }));
  });

  describe('POST /reports', () => {
    it('should create a new report successfully', async () => {
      const response = await request(app)
        .post('/reports')
        .send(mockReport)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.description).toBe(mockReport.description);
      expect(response.body.data.user_id).toBe(mockUser.id);
    });

    it('should return 400 for missing description', async () => {
      const invalidReport = {
        ...mockReport,
        description: '',
      };

      const response = await request(app)
        .post('/reports')
        .send(invalidReport)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid location', async () => {
      const invalidReport = {
        ...mockReport,
        location: {
          latitude: 200, // Invalid latitude
          longitude: -122.4194,
        },
      };

      const response = await request(app)
        .post('/reports')
        .send(invalidReport)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /reports', () => {
    it('should get reports successfully', async () => {
      const response = await request(app)
        .get('/reports')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter reports by status', async () => {
      const response = await request(app)
        .get('/reports?status=new')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter reports by date range', async () => {
      const response = await request(app)
        .get('/reports?start_date=2023-01-01&end_date=2023-12-31')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /reports/heatmap', () => {
    it('should get heatmap data successfully', async () => {
      const response = await request(app)
        .get('/reports/heatmap')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('type', 'FeatureCollection');
      expect(Array.isArray(response.body.data.features)).toBe(true);
    });
  });

  describe('PATCH /reports/:id/verify', () => {
    it('should update report status successfully', async () => {
      const updateData = {
        status: 'verified',
      };

      const response = await request(app)
        .patch('/reports/test-report-id/verify')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('verified');
    });

    it('should return 400 for invalid status', async () => {
      const updateData = {
        status: 'invalid-status',
      };

      const response = await request(app)
        .patch('/reports/test-report-id/verify')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /reports/sync', () => {
    it('should sync offline reports successfully', async () => {
      const syncData = {
        reports: [
          {
            id: 'offline-report-1',
            description: 'Offline report 1',
            media_urls: [],
            location: {
              latitude: 37.7749,
              longitude: -122.4194,
            },
            created_at: '2023-01-01T00:00:00Z',
            device_id: 'device-1',
          },
        ],
      };

      const response = await request(app)
        .post('/reports/sync')
        .send(syncData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.synced_count).toBe(1);
    });

    it('should return 400 for empty reports array', async () => {
      const syncData = {
        reports: [],
      };

      const response = await request(app)
        .post('/reports/sync')
        .send(syncData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
