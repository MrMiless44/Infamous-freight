const request = require('supertest');
const express = require('express');
const healthRoutes = require('../../src/routes/health');
const prisma = require('../../src/lib/prisma');

describe('Health Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api', healthRoutes);
        jest.clearAllMocks();
    });

    describe('GET /health', () => {
        it('should return basic health status', async () => {
            const response = await request(app).get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body.status).toBeDefined();
            expect(response.body.environment).toBeDefined();
            expect(response.body.uptime).toBeGreaterThan(0);
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('GET /health/detailed', () => {
        it('should return detailed health payload', async () => {
            const response = await request(app).get('/api/health/detailed');

            expect(response.status).toBe(200);
            expect(response.body.dependencies).toBeDefined();
            expect(response.body.status).toBeDefined();
        });
    });

    describe('GET /health/ready', () => {
        it('should return ready when database is connected', async () => {
            const response = await request(app).get('/api/health/ready');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({ ready: true });
        });

        it('should return ready when database is not configured', async () => {
            if (prisma?.$queryRaw) {
                jest.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('Database not configured'));
            }

            const response = await request(app).get('/api/health/ready');

            expect(response.status).toBe(200);
            expect(response.body.ready).toBe(true);
        });
    });

    describe('GET /health/live', () => {
        it('should return alive status', async () => {
            const response = await request(app).get('/api/health/live');

            expect(response.status).toBe(200);
            expect(response.body.alive).toBe(true);
        });
    });
});
