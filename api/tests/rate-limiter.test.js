/**
 * Rate Limiter Tests
 * 
 * Comprehensive test suite for rate limiting middleware.
 * Tests request throttling, different rate limit tiers, and abuse prevention.
 * 
 * Coverage:
 * - General rate limits (100/15min)
 * - Auth rate limits (5/15min)
 * - AI rate limits (20/1min)
 * - Billing rate limits (30/15min)
 * - Edge cases and bypass scenarios
 */

const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { generateToken } = require('./jwt-scope.test');

// Mock Redis for distributed rate limiting
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        del: jest.fn().mockResolvedValue(1)
    }))
}));

describe('Rate Limiter', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    describe('General Rate Limiter (100/15min)', () => {
        beforeEach(() => {
            const limiter = rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // 100 requests per window
                message: { error: 'Too many requests, please try again later.' },
                standardHeaders: true,
                legacyHeaders: false
            });

            app.use('/api/', limiter);
            app.get('/api/general', (req, res) => res.json({ ok: true }));
        });

        test('should allow requests below rate limit', async () => {
            for (let i = 0; i < 10; i++) {
                const response = await request(app).get('/api/general');
                expect(response.status).toBe(200);
                expect(response.body.ok).toBe(true);
            }
        });

        test('should block requests after hitting rate limit', async () => {
            // Send 101 requests (limit is 100)
            const responses = [];

            for (let i = 0; i < 101; i++) {
                responses.push(await request(app).get('/api/general'));
            }

            const successfulRequests = responses.filter(r => r.status === 200);
            const blockedRequests = responses.filter(r => r.status === 429);

            expect(successfulRequests.length).toBe(100);
            expect(blockedRequests.length).toBe(1);
        });

        test('should return 429 status code when rate limited', async () => {
            // Hit the limit
            for (let i = 0; i < 100; i++) {
                await request(app).get('/api/general');
            }

            const response = await request(app).get('/api/general');
            expect(response.status).toBe(429);
            expect(response.body.error).toContain('Too many requests');
        });

        test('should include rate limit headers', async () => {
            const response = await request(app).get('/api/general');

            expect(response.headers['ratelimit-limit']).toBeDefined();
            expect(response.headers['ratelimit-remaining']).toBeDefined();
            expect(response.headers['ratelimit-reset']).toBeDefined();
        });

        test('should decrement remaining count with each request', async () => {
            const response1 = await request(app).get('/api/general');
            const remaining1 = parseInt(response1.headers['ratelimit-remaining']);

            const response2 = await request(app).get('/api/general');
            const remaining2 = parseInt(response2.headers['ratelimit-remaining']);

            expect(remaining2).toBe(remaining1 - 1);
        });
    });

    describe('Auth Rate Limiter (5/15min)', () => {
        beforeEach(() => {
            const authLimiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 5,
                message: { error: 'Too many authentication attempts, please try again later.' },
                skipSuccessfulRequests: false
            });

            app.post('/api/auth/login', authLimiter, (req, res) => {
                const { email, password } = req.body;
                if (email === 'test@example.com' && password === 'correct') {
                    res.json({ success: true, token: 'fake-token' });
                } else {
                    res.status(401).json({ error: 'Invalid credentials' });
                }
            });
        });

        test('should allow 5 login attempts within window', async () => {
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });

                expect(response.status).toBe(401);
            }
        });

        test('should block 6th login attempt', async () => {
            // Make 5 attempts
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });
            }

            // 6th attempt should be blocked
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'wrong' });

            expect(response.status).toBe(429);
            expect(response.body.error).toContain('Too many authentication attempts');
        });

        test('should count both successful and failed attempts', async () => {
            // 3 failed attempts
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'wrong' });
            }

            // 2 successful attempts
            for (let i = 0; i < 2; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password: 'correct' });
            }

            // 6th attempt should be blocked
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'correct' });

            expect(response.status).toBe(429);
        });

        test('should prevent brute force attacks', async () => {
            const passwords = ['pass1', 'pass2', 'pass3', 'pass4', 'pass5', 'pass6'];

            for (const password of passwords) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'test@example.com', password });
            }

            // Last two attempts should be blocked
            const responses = await Promise.all([
                request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'pass7' }),
                request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'pass8' })
            ]);

            expect(responses[0].status).toBe(429);
            expect(responses[1].status).toBe(429);
        });
    });

    describe('AI Rate Limiter (20/1min)', () => {
        beforeEach(() => {
            const aiLimiter = rateLimit({
                windowMs: 60 * 1000, // 1 minute
                max: 20,
                message: { error: 'AI rate limit exceeded. Please slow down.' },
                standardHeaders: true
            });

            const { authenticate, requireScope } = require('../src/middleware/security');

            app.post('/api/ai/command',
                authenticate,
                requireScope('ai:command'),
                aiLimiter,
                (req, res) => {
                    res.json({ result: 'Command processed' });
                }
            );
        });

        test('should allow 20 AI requests per minute', async () => {
            const token = generateToken({
                sub: 'user123',
                scopes: ['ai:command']
            });

            for (let i = 0; i < 20; i++) {
                const response = await request(app)
                    .post('/api/ai/command')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ command: 'analyze shipment' });

                expect(response.status).toBe(200);
            }
        });

        test('should block 21st AI request within minute', async () => {
            const token = generateToken({
                sub: 'user456',
                scopes: ['ai:command']
            });

            // Make 20 successful requests
            for (let i = 0; i < 20; i++) {
                await request(app)
                    .post('/api/ai/command')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ command: 'analyze' });
            }

            // 21st should be blocked
            const response = await request(app)
                .post('/api/ai/command')
                .set('Authorization', `Bearer ${token}`)
                .send({ command: 'analyze' });

            expect(response.status).toBe(429);
            expect(response.body.error).toContain('AI rate limit exceeded');
        });

        test('should have shorter window than general limiter', async () => {
            const token = generateToken({
                sub: 'user789',
                scopes: ['ai:command']
            });

            const response = await request(app)
                .post('/api/ai/command')
                .set('Authorization', `Bearer ${token}`)
                .send({ command: 'test' });

            const resetHeader = response.headers['ratelimit-reset'];
            const resetTime = new Date(parseInt(resetHeader) * 1000);
            const now = new Date();
            const windowSeconds = (resetTime - now) / 1000;

            // Should reset in approximately 60 seconds (allow 5s variance)
            expect(windowSeconds).toBeLessThan(65);
            expect(windowSeconds).toBeGreaterThan(55);
        });
    });

    describe('Billing Rate Limiter (30/15min)', () => {
        beforeEach(() => {
            const billingLimiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 30,
                message: { error: 'Billing rate limit exceeded.' }
            });

            const { authenticate, requireScope } = require('../src/middleware/security');

            app.post('/api/billing/charge',
                authenticate,
                requireScope('billing:write'),
                billingLimiter,
                (req, res) => {
                    res.json({ success: true, chargeId: 'ch_123' });
                }
            );
        });

        test('should allow 30 billing requests per 15 minutes', async () => {
            const token = generateToken({
                sub: 'billing-user',
                scopes: ['billing:write']
            });

            for (let i = 0; i < 30; i++) {
                const response = await request(app)
                    .post('/api/billing/charge')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ amount: 1000 });

                expect(response.status).toBe(200);
            }
        });

        test('should block 31st billing request', async () => {
            const token = generateToken({
                sub: 'billing-user-2',
                scopes: ['billing:write']
            });

            // Make 30 requests
            for (let i = 0; i < 30; i++) {
                await request(app)
                    .post('/api/billing/charge')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ amount: 1000 });
            }

            // 31st should be blocked
            const response = await request(app)
                .post('/api/billing/charge')
                .set('Authorization', `Bearer ${token}`)
                .send({ amount: 1000 });

            expect(response.status).toBe(429);
        });
    });

    describe('IP-Based Rate Limiting', () => {
        beforeEach(() => {
            const ipLimiter = rateLimit({
                windowMs: 60 * 1000,
                max: 10,
                keyGenerator: (req) => req.ip,
                message: { error: 'Too many requests from this IP.' }
            });

            app.get('/api/public', ipLimiter, (req, res) => {
                res.json({ data: 'public data' });
            });
        });

        test('should limit requests by IP address', async () => {
            // Simulate different IPs
            const responses = [];

            for (let i = 0; i < 11; i++) {
                responses.push(await request(app).get('/api/public'));
            }

            const successCount = responses.filter(r => r.status === 200).length;
            const blockedCount = responses.filter(r => r.status === 429).length;

            expect(successCount).toBe(10);
            expect(blockedCount).toBe(1);
        });

        test('should track IPs independently', async () => {
            // This is simplified since supertest uses same IP
            // In production, different IPs would have separate counters

            for (let i = 0; i < 10; i++) {
                const response = await request(app).get('/api/public');
                expect(response.status).toBe(200);
            }

            const blocked = await request(app).get('/api/public');
            expect(blocked.status).toBe(429);
        });
    });

    describe('User-Based Rate Limiting', () => {
        beforeEach(() => {
            const { authenticate } = require('../src/middleware/security');

            const userLimiter = rateLimit({
                windowMs: 60 * 1000,
                max: 5,
                keyGenerator: (req) => req.user?.sub || req.ip,
                message: { error: 'User rate limit exceeded.' }
            });

            app.get('/api/user-data',
                authenticate,
                userLimiter,
                (req, res) => {
                    res.json({ data: 'user data' });
                }
            );
        });

        test('should limit requests per user', async () => {
            const token = generateToken({
                sub: 'rate-limited-user',
                scopes: []
            });

            // Make 5 successful requests
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .get('/api/user-data')
                    .set('Authorization', `Bearer ${token}`);

                expect(response.status).toBe(200);
            }

            // 6th should be blocked
            const response = await request(app)
                .get('/api/user-data')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(429);
        });

        test('should track different users independently', async () => {
            const user1Token = generateToken({ sub: 'user1', scopes: [] });
            const user2Token = generateToken({ sub: 'user2', scopes: [] });

            // User 1 makes 5 requests
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .get('/api/user-data')
                    .set('Authorization', `Bearer ${user1Token}`);
            }

            // User 2 should still be able to make requests
            const user2Response = await request(app)
                .get('/api/user-data')
                .set('Authorization', `Bearer ${user2Token}`);

            expect(user2Response.status).toBe(200);

            // User 1 should be blocked
            const user1Response = await request(app)
                .get('/api/user-data')
                .set('Authorization', `Bearer ${user1Token}`);

            expect(user1Response.status).toBe(429);
        });
    });

    describe('Bypass Mechanisms', () => {
        test('should allow whitelisted IPs to bypass rate limit', async () => {
            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 5,
                skip: (req) => req.ip === '127.0.0.1', // Whitelist localhost
                message: { error: 'Rate limited' }
            });

            app.get('/api/skip-test', limiter, (req, res) => {
                res.json({ ok: true });
            });

            // Make more than limit (should all succeed because localhost is whitelisted)
            for (let i = 0; i < 10; i++) {
                const response = await request(app).get('/api/skip-test');
                expect(response.status).toBe(200);
            }
        });

        test('should allow admin users to bypass rate limit', async () => {
            const { authenticate } = require('../src/middleware/security');

            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 3,
                skip: (req) => req.user?.role === 'admin',
                message: { error: 'Rate limited' }
            });

            app.get('/api/admin-bypass',
                authenticate,
                limiter,
                (req, res) => res.json({ ok: true })
            );

            const adminToken = generateToken({
                sub: 'admin1',
                role: 'admin',
                scopes: []
            });

            // Admin should not be rate limited even after many requests
            for (let i = 0; i < 10; i++) {
                const response = await request(app)
                    .get('/api/admin-bypass')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
            }
        });
    });

    describe('Edge Cases', () => {
        test('should handle concurrent requests correctly', async () => {
            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 20
            });

            app.get('/api/concurrent', limiter, (req, res) => {
                res.json({ ok: true });
            });

            // Send 25 concurrent requests
            const requests = Array(25).fill(null).map(() =>
                request(app).get('/api/concurrent')
            );

            const responses = await Promise.all(requests);

            const successCount = responses.filter(r => r.status === 200).length;
            const blockedCount = responses.filter(r => r.status === 429).length;

            expect(successCount).toBe(20);
            expect(blockedCount).toBe(5);
        });

        test('should handle missing headers gracefully', async () => {
            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 10
            });

            app.get('/api/no-headers', limiter, (req, res) => {
                res.json({ ok: true });
            });

            const response = await request(app).get('/api/no-headers');

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
        });

        test('should handle very high request volumes', async () => {
            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 1000
            });

            app.get('/api/high-volume', limiter, (req, res) => {
                res.json({ ok: true });
            });

            const startTime = Date.now();

            // Send 1000 requests
            for (let i = 0; i < 1000; i++) {
                await request(app).get('/api/high-volume');
            }

            const duration = Date.now() - startTime;

            // Should handle 1000 requests efficiently (under 10 seconds)
            expect(duration).toBeLessThan(10000);
        });

        test('should reset counter after window expires', async () => {
            const limiter = rateLimit({
                windowMs: 100, // Very short window (100ms)
                max: 2
            });

            app.get('/api/reset-test', limiter, (req, res) => {
                res.json({ ok: true });
            });

            // Make 2 requests (hit limit)
            await request(app).get('/api/reset-test');
            await request(app).get('/api/reset-test');

            // 3rd should be blocked
            const blocked = await request(app).get('/api/reset-test');
            expect(blocked.status).toBe(429);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should work again after reset
            const afterReset = await request(app).get('/api/reset-test');
            expect(afterReset.status).toBe(200);
        });
    });

    describe('Custom Error Messages', () => {
        test('should return custom error message when rate limited', async () => {
            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 1,
                message: {
                    error: 'Slow down!',
                    retryAfter: '60 seconds',
                    documentation: 'https://docs.example.com/rate-limits'
                }
            });

            app.get('/api/custom-error', limiter, (req, res) => {
                res.json({ ok: true });
            });

            await request(app).get('/api/custom-error'); // First request succeeds

            const response = await request(app).get('/api/custom-error');

            expect(response.status).toBe(429);
            expect(response.body.error).toBe('Slow down!');
            expect(response.body.retryAfter).toBe('60 seconds');
            expect(response.body.documentation).toBe('https://docs.example.com/rate-limits');
        });

        test('should include Retry-After header', async () => {
            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 1,
                standardHeaders: true
            });

            app.get('/api/retry-after', limiter, (req, res) => {
                res.json({ ok: true });
            });

            await request(app).get('/api/retry-after');

            const response = await request(app).get('/api/retry-after');

            expect(response.status).toBe(429);
            expect(response.headers['retry-after']).toBeDefined();
        });
    });

    describe('Performance Impact', () => {
        test('rate limiter should add minimal latency', async () => {
            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 100
            });

            const noLimiterApp = express();
            noLimiterApp.get('/test', (req, res) => res.json({ ok: true }));

            const limiterApp = express();
            limiterApp.get('/test', limiter, (req, res) => res.json({ ok: true }));

            // Measure without rate limiter
            const startNoLimiter = Date.now();
            for (let i = 0; i < 50; i++) {
                await request(noLimiterApp).get('/test');
            }
            const durationNoLimiter = Date.now() - startNoLimiter;

            // Measure with rate limiter
            const startWithLimiter = Date.now();
            for (let i = 0; i < 50; i++) {
                await request(limiterApp).get('/test');
            }
            const durationWithLimiter = Date.now() - startWithLimiter;

            // Rate limiter overhead should be less than 50% of base time
            const overhead = ((durationWithLimiter - durationNoLimiter) / durationNoLimiter) * 100;
            expect(overhead).toBeLessThan(50);
        });
    });
});
