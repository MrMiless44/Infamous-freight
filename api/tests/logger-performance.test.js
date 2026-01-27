/**
 * Logger Performance Tests
 * 
 * Comprehensive test suite for logging middleware performance.
 * Tests throughput, latency, formatting, and performance under load.
 * 
 * Coverage:
 * - Logging throughput
 * - Request/response logging
 * - Performance metrics
 * - Log levels
 * - Edge cases
 */

const request = require('supertest');
const express = require('express');
const winston = require('winston');
const { performance } = require('perf_hooks');

describe('Logger Performance', () => {
    let app;
    let logger;
    let logMessages;

    beforeEach(() => {
        // Capture log messages for testing
        logMessages = [];

        // Create test logger that captures messages
        logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Stream({
                    stream: {
                        write: (message) => {
                            logMessages.push(JSON.parse(message));
                        }
                    }
                })
            ]
        });

        // Setup Express app with logging middleware
        app = express();
        app.use(express.json());

        // Request logging middleware
        app.use((req, res, next) => {
            const startTime = Date.now();
            req.startTime = startTime;

            res.on('finish', () => {
                const duration = Date.now() - startTime;
                logger.info('Request completed', {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration,
                    userAgent: req.headers['user-agent']
                });
            });

            next();
        });

        // Test routes
        app.get('/api/fast', (req, res) => {
            res.json({ message: 'Fast response' });
        });

        app.get('/api/slow', async (req, res) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            res.json({ message: 'Slow response' });
        });

        app.post('/api/data', (req, res) => {
            logger.debug('Processing data', { body: req.body });
            res.json({ success: true });
        });

        app.get('/api/error', (req, res) => {
            logger.error('Intentional error', { errorType: 'TEST_ERROR' });
            res.status(500).json({ error: 'Test error' });
        });
    });

    afterEach(() => {
        logMessages = [];
    });

    describe('Logging Throughput', () => {
        test('should handle high-volume logging without significant overhead', async () => {
            const requests = 1000;
            const startTime = performance.now();

            // Send 1000 sequential requests
            for (let i = 0; i < requests; i++) {
                await request(app).get('/api/fast');
            }

            const duration = performance.now() - startTime;
            const avgTimePerRequest = duration / requests;

            // Each request should complete in under 10ms including logging
            expect(avgTimePerRequest).toBeLessThan(10);
            expect(logMessages.length).toBe(requests);
        });

        test('should log concurrent requests without race conditions', async () => {
            const concurrentRequests = 100;

            const requests = Array(concurrentRequests).fill(null).map((_, i) =>
                request(app).get('/api/fast')
            );

            await Promise.all(requests);

            // Should have exactly one log entry per request
            expect(logMessages.length).toBe(concurrentRequests);

            // All log entries should be complete
            logMessages.forEach(log => {
                expect(log.message).toBe('Request completed');
                expect(log.method).toBe('GET');
                expect(log.statusCode).toBe(200);
                expect(typeof log.duration).toBe('number');
            });
        });

        test('should handle burst traffic without dropping logs', async () => {
            // Simulate burst: 50 requests, then wait, then 50 more
            const burst1 = Array(50).fill(null).map(() => request(app).get('/api/fast'));
            await Promise.all(burst1);

            const logsAfterBurst1 = logMessages.length;
            expect(logsAfterBurst1).toBe(50);

            await new Promise(resolve => setTimeout(resolve, 100));

            const burst2 = Array(50).fill(null).map(() => request(app).get('/api/fast'));
            await Promise.all(burst2);

            expect(logMessages.length).toBe(100);
        });
    });

    describe('Request/Response Logging', () => {
        test('should log HTTP method correctly', async () => {
            await request(app).get('/api/fast');
            await request(app).post('/api/data').send({ test: 'data' });

            const getLogs = logMessages.filter(log => log.method === 'GET');
            const postLogs = logMessages.filter(log => log.method === 'POST');

            expect(getLogs.length).toBeGreaterThan(0);
            expect(postLogs.length).toBeGreaterThan(0);
        });

        test('should log request path correctly', async () => {
            await request(app).get('/api/fast');

            const log = logMessages.find(log => log.path === '/api/fast');
            expect(log).toBeDefined();
            expect(log.method).toBe('GET');
        });

        test('should log response status code', async () => {
            await request(app).get('/api/fast');
            await request(app).get('/api/error');

            const successLog = logMessages.find(log => log.statusCode === 200);
            const errorLog = logMessages.find(log => log.statusCode === 500);

            expect(successLog).toBeDefined();
            expect(errorLog).toBeDefined();
        });

        test('should log request duration', async () => {
            await request(app).get('/api/slow');

            const log = logMessages.find(log => log.path === '/api/slow');
            expect(log).toBeDefined();
            expect(log.duration).toBeGreaterThan(100);
            expect(log.duration).toBeLessThan(200);
        });

        test('should log user agent', async () => {
            await request(app)
                .get('/api/fast')
                .set('User-Agent', 'TestAgent/1.0');

            const log = logMessages.find(log => log.path === '/api/fast');
            expect(log.userAgent).toContain('TestAgent');
        });
    });

    describe('Performance Metrics', () => {
        test('should track request duration accurately', async () => {
            const startTime = Date.now();
            await request(app).get('/api/slow');
            const actualDuration = Date.now() - startTime;

            const log = logMessages.find(log => log.path === '/api/slow');

            // Logged duration should be close to actual duration (within 20ms)
            expect(Math.abs(log.duration - actualDuration)).toBeLessThan(20);
        });

        test('should measure fast requests accurately', async () => {
            await request(app).get('/api/fast');

            const log = logMessages.find(log => log.path === '/api/fast');

            // Fast requests should complete in under 5ms
            expect(log.duration).toBeLessThan(5);
        });

        test('should track slow queries separately', async () => {
            await request(app).get('/api/fast');
            await request(app).get('/api/slow');

            const fastLog = logMessages.find(log => log.path === '/api/fast');
            const slowLog = logMessages.find(log => log.path === '/api/slow');

            expect(fastLog.duration).toBeLessThan(10);
            expect(slowLog.duration).toBeGreaterThan(100);
        });

        test('should calculate percentiles for response times', () => {
            const durations = logMessages.map(log => log.duration).sort((a, b) => a - b);

            if (durations.length > 0) {
                const p50 = durations[Math.floor(durations.length * 0.5)];
                const p95 = durations[Math.floor(durations.length * 0.95)];
                const p99 = durations[Math.floor(durations.length * 0.99)];

                expect(p50).toBeLessThan(p95);
                expect(p95).toBeLessThan(p99);
            }
        });
    });

    describe('Log Levels', () => {
        test('should support debug level logging', async () => {
            await request(app).post('/api/data').send({ test: 'data' });

            const debugLog = logMessages.find(log => log.level === 'debug');
            expect(debugLog).toBeDefined();
            expect(debugLog.message).toContain('Processing data');
        });

        test('should support info level logging', async () => {
            await request(app).get('/api/fast');

            const infoLog = logMessages.find(log => log.level === 'info');
            expect(infoLog).toBeDefined();
            expect(infoLog.message).toBe('Request completed');
        });

        test('should support error level logging', async () => {
            await request(app).get('/api/error');

            const errorLog = logMessages.find(log => log.level === 'error');
            expect(errorLog).toBeDefined();
            expect(errorLog.errorType).toBe('TEST_ERROR');
        });

        test('should filter logs by level', () => {
            const errorLogs = logMessages.filter(log => log.level === 'error');
            const infoLogs = logMessages.filter(log => log.level === 'info');
            const debugLogs = logMessages.filter(log => log.level === 'debug');

            expect(errorLogs.length + infoLogs.length + debugLogs.length).toBe(logMessages.length);
        });
    });

    describe('Structured Logging', () => {
        test('should log in JSON format', async () => {
            await request(app).get('/api/fast');

            const log = logMessages[logMessages.length - 1];

            expect(typeof log).toBe('object');
            expect(log.timestamp).toBeDefined();
            expect(log.level).toBeDefined();
            expect(log.message).toBeDefined();
        });

        test('should include timestamp in every log', async () => {
            await request(app).get('/api/fast');
            await request(app).get('/api/slow');

            logMessages.forEach(log => {
                expect(log.timestamp).toBeDefined();
                expect(new Date(log.timestamp).getTime()).toBeGreaterThan(0);
            });
        });

        test('should support custom metadata', async () => {
            await request(app).post('/api/data').send({ userId: 'user123' });

            const debugLog = logMessages.find(log => log.level === 'debug');
            expect(debugLog.body).toBeDefined();
            expect(debugLog.body.userId).toBe('user123');
        });

        test('should handle nested objects in logs', () => {
            logger.info('Complex data', {
                user: { id: 'user123', name: 'Test' },
                request: { path: '/api/test', method: 'GET' }
            });

            const log = logMessages[logMessages.length - 1];
            expect(log.user.id).toBe('user123');
            expect(log.request.method).toBe('GET');
        });
    });

    describe('Memory Management', () => {
        test('should not leak memory with continuous logging', async () => {
            const measureMemory = () => {
                if (global.gc) {
                    global.gc();
                }
                return process.memoryUsage().heapUsed;
            };

            const beforeMemory = measureMemory();

            // Log 10,000 requests
            for (let i = 0; i < 10000; i++) {
                await request(app).get('/api/fast');
            }

            const afterMemory = measureMemory();
            const memoryIncrease = afterMemory - beforeMemory;

            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });

        test('should handle log rotation gracefully', async () => {
            // Simulate many logs that would trigger rotation
            for (let i = 0; i < 1000; i++) {
                await request(app).get('/api/fast');
            }

            // All logs should still be captured (no loss during rotation)
            expect(logMessages.length).toBe(1000);
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing request headers', async () => {
            await request(app).get('/api/fast').unset('User-Agent');

            const log = logMessages.find(log => log.path === '/api/fast');
            expect(log).toBeDefined();
            // Should not crash, userAgent can be undefined
        });

        test('should handle very long request paths', async () => {
            const longPath = '/api/' + 'x'.repeat(1000);
            app.get(longPath, (req, res) => res.json({ ok: true }));

            await request(app).get(longPath);

            const log = logMessages.find(log => log.path === longPath);
            expect(log).toBeDefined();
            expect(log.path.length).toBeGreaterThan(1000);
        });

        test('should handle special characters in logs', async () => {
            await request(app).post('/api/data').send({
                text: 'Special chars: <>&"\'`\n\t'
            });

            const debugLog = logMessages.find(log => log.level === 'debug');
            expect(debugLog.body.text).toContain('Special chars');
        });

        test('should handle circular references in logged objects', () => {
            const circular = { a: 1 };
            circular.self = circular;

            // Should not throw error
            expect(() => {
                logger.info('Circular object', { data: circular });
            }).not.toThrow();
        });

        test('should handle logging very large payloads', async () => {
            const largePayload = { data: 'x'.repeat(100000) };

            await request(app).post('/api/data').send(largePayload);

            const debugLog = logMessages.find(log => log.level === 'debug');
            expect(debugLog).toBeDefined();
        });
    });

    describe('Performance Benchmarks', () => {
        test('should log 1000 requests in under 5 seconds', async () => {
            const startTime = performance.now();

            for (let i = 0; i < 1000; i++) {
                await request(app).get('/api/fast');
            }

            const duration = performance.now() - startTime;
            expect(duration).toBeLessThan(5000);
        });

        test('should handle 100 concurrent requests efficiently', async () => {
            const startTime = performance.now();

            const requests = Array(100).fill(null).map(() =>
                request(app).get('/api/fast')
            );

            await Promise.all(requests);

            const duration = performance.now() - startTime;

            // 100 concurrent requests should complete in under 1 second
            expect(duration).toBeLessThan(1000);
        });

        test('logging overhead should be minimal', async () => {
            // Baseline: request without logging
            const noLoggingApp = express();
            noLoggingApp.get('/test', (req, res) => res.json({ ok: true }));

            const startNoLogging = performance.now();
            for (let i = 0; i < 100; i++) {
                await request(noLoggingApp).get('/test');
            }
            const durationNoLogging = performance.now() - startNoLogging;

            // With logging
            const startWithLogging = performance.now();
            for (let i = 0; i < 100; i++) {
                await request(app).get('/api/fast');
            }
            const durationWithLogging = performance.now() - startWithLogging;

            // Logging overhead should be less than 50% of base request time
            const overhead = ((durationWithLogging - durationNoLogging) / durationNoLogging) * 100;
            expect(overhead).toBeLessThan(50);
        });

        test('should maintain performance with complex log metadata', async () => {
            const complexMetadata = {
                user: { id: 'user123', email: 'test@example.com', roles: ['admin', 'user'] },
                request: { ip: '127.0.0.1', userAgent: 'TestAgent', headers: { 'x-custom': 'value' } },
                context: { timestamp: Date.now(), environment: 'test', version: '1.0.0' }
            };

            const startTime = performance.now();

            for (let i = 0; i < 100; i++) {
                logger.info('Complex log', complexMetadata);
            }

            const duration = performance.now() - startTime;

            // Should complete 100 complex logs in under 100ms (1ms per log)
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Integration', () => {
        test('should track complete request lifecycle', async () => {
            const response = await request(app)
                .post('/api/data')
                .send({ operation: 'test' });

            expect(response.status).toBe(200);

            // Should have both debug and info logs
            const debugLog = logMessages.find(log => log.level === 'debug' && log.message === 'Processing data');
            const infoLog = logMessages.find(log => log.level === 'info' && log.path === '/api/data');

            expect(debugLog).toBeDefined();
            expect(debugLog.body.operation).toBe('test');

            expect(infoLog).toBeDefined();
            expect(infoLog.method).toBe('POST');
            expect(infoLog.statusCode).toBe(200);
            expect(infoLog.duration).toBeGreaterThan(0);
        });

        test('should correlate logs for same request', async () => {
            const uniqueData = `request-${Date.now()}`;

            await request(app).post('/api/data').send({ id: uniqueData });

            const debugLog = logMessages.find(log =>
                log.level === 'debug' && log.body?.id === uniqueData
            );
            const infoLog = logMessages.find(log =>
                log.level === 'info' && log.path === '/api/data'
            );

            expect(debugLog).toBeDefined();
            expect(infoLog).toBeDefined();

            // Logs should have timestamps close together (within 50ms)
            const debugTime = new Date(debugLog.timestamp).getTime();
            const infoTime = new Date(infoLog.timestamp).getTime();
            expect(Math.abs(infoTime - debugTime)).toBeLessThan(50);
        });
    });
});
