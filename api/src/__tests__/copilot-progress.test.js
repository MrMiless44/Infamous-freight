const request = require('supertest');
const express = require('express');
const copilotProgressRoutes = require('../routes/copilot-progress');

// Mock dependencies
jest.mock('../db/prisma', () => ({
  prisma: {
    copilotProgress: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../middleware/security', () => ({
  limiters: {
    general: jest.fn((req, res, next) => next()),
    ai: jest.fn((req, res, next) => next()),
  },
  authenticate: jest.fn((req, res, next) => {
    req.user = { sub: 'test-user-id', email: 'test@example.com' };
    next();
  }),
  requireScope: jest.fn(() => (req, res, next) => next()),
  auditLog: jest.fn((req, res, next) => next()),
}));

const { prisma } = require('../db/prisma');

describe('Copilot Progress API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', copilotProgressRoutes);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/copilot/progress/:driverId', () => {
    it('should return progress for a driver', async () => {
      const mockProgress = {
        id: 'progress-1',
        driverId: 'driver-1',
        overallProgressScore: 85.5,
        goalsCompleted: 5,
        goalsTotal: 10,
        improvementRate: 15.2,
        consistencyScore: 90.0,
        activeRecommendations: 3,
        completedRecommendations: 7,
        progressDetails: JSON.stringify({ category1: 'data1' }),
        milestones: JSON.stringify([{ milestone: 'First goal completed' }]),
        engagementScore: 88.0,
        lastInteraction: new Date('2024-01-15'),
        confidenceLevel: 92.0,
        effectivenessScore: 87.5,
        coachingNotes: 'Great progress this week',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        driver: {
          id: 'driver-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'DRIVER',
        },
      };

      prisma.copilotProgress.findFirst.mockResolvedValue(mockProgress);

      const response = await request(app).get('/api/copilot/progress/driver-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.driverId).toBe('driver-1');
      expect(response.body.data.overallProgressScore).toBe(85.5);
      expect(response.body.data.progressDetails).toEqual({ category1: 'data1' });
      expect(response.body.data.milestones).toEqual([{ milestone: 'First goal completed' }]);
    });

    it('should return 404 if driver has no progress', async () => {
      prisma.copilotProgress.findFirst.mockResolvedValue(null);

      const response = await request(app).get('/api/copilot/progress/driver-1');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No progress tracking found for this driver');
    });
  });

  describe('GET /api/copilot/progress/:driverId/history', () => {
    it('should return progress history for a driver', async () => {
      const mockHistory = [
        {
          id: 'progress-1',
          driverId: 'driver-1',
          overallProgressScore: 85.5,
          goalsCompleted: 5,
          goalsTotal: 10,
          progressDetails: JSON.stringify({ category1: 'data1' }),
          milestones: JSON.stringify([{ milestone: 'Test' }]),
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'progress-2',
          driverId: 'driver-1',
          overallProgressScore: 80.0,
          goalsCompleted: 4,
          goalsTotal: 10,
          progressDetails: null,
          milestones: null,
          createdAt: new Date('2024-01-02'),
        },
      ];

      prisma.copilotProgress.findMany.mockResolvedValue(mockHistory);

      const response = await request(app).get('/api/copilot/progress/driver-1/history?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });
  });

  describe('POST /api/copilot/progress', () => {
    it('should create new progress record', async () => {
      const mockDriver = {
        id: 'driver-1',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockProgress = {
        id: 'progress-1',
        driverId: 'driver-1',
        overallProgressScore: 85.5,
        goalsCompleted: 5,
        goalsTotal: 10,
        improvementRate: 15.2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      prisma.user.findUnique.mockResolvedValue(mockDriver);
      prisma.copilotProgress.create.mockResolvedValue(mockProgress);

      const progressData = {
        driverId: 'driver-1',
        overallProgressScore: 85.5,
        goalsCompleted: 5,
        goalsTotal: 10,
        improvementRate: 15.2,
      };

      const response = await request(app)
        .post('/api/copilot/progress')
        .send(progressData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.driverId).toBe('driver-1');
    });

    it('should return 404 if driver does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const progressData = {
        driverId: 'nonexistent-driver',
        overallProgressScore: 85.5,
      };

      const response = await request(app)
        .post('/api/copilot/progress')
        .send(progressData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Driver not found');
    });
  });

  describe('PATCH /api/copilot/progress/:progressId', () => {
    it('should update progress record', async () => {
      const mockUpdatedProgress = {
        id: 'progress-1',
        driverId: 'driver-1',
        overallProgressScore: 90.0,
        goalsCompleted: 6,
        updatedAt: new Date('2024-01-15'),
      };

      prisma.copilotProgress.update.mockResolvedValue(mockUpdatedProgress);

      const updateData = {
        overallProgressScore: 90.0,
        goalsCompleted: 6,
      };

      const response = await request(app)
        .patch('/api/copilot/progress/progress-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overallProgressScore).toBe(90.0);
    });

    it('should return 404 if progress record does not exist', async () => {
      prisma.copilotProgress.update.mockRejectedValue({ code: 'P2025' });

      const updateData = {
        overallProgressScore: 90.0,
      };

      const response = await request(app)
        .patch('/api/copilot/progress/nonexistent-id')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Progress record not found');
    });
  });

  describe('GET /api/copilot/stats', () => {
    it('should return aggregated copilot statistics', async () => {
      const mockGroupBy = [
        { driverId: 'driver-1', _count: 1 },
        { driverId: 'driver-2', _count: 1 },
      ];

      const mockAggregate = {
        _avg: {
          overallProgressScore: 85.0,
          improvementRate: 12.5,
          consistencyScore: 88.0,
          engagementScore: 90.0,
          effectivenessScore: 85.5,
        },
        _sum: {
          goalsCompleted: 15,
          goalsTotal: 30,
          activeRecommendations: 8,
          completedRecommendations: 20,
        },
      };

      prisma.copilotProgress.groupBy.mockResolvedValue(mockGroupBy);
      prisma.copilotProgress.aggregate.mockResolvedValue(mockAggregate);

      const response = await request(app).get('/api/copilot/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalDriversTracked).toBe(2);
      expect(response.body.data.averageProgressScore).toBe(85.0);
      expect(response.body.data.totalGoalsCompleted).toBe(15);
    });
  });
});
