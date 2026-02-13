/**
 * Cache Service Tests
 * Tests for Redis caching service
 */

jest.mock('../lib/redis');
jest.mock('../lib/structuredLogging');

const RedisCacheService = require('../../services/cacheService');
const redis = require('../../lib/redis');

describe('Redis Cache Service', () => {
    let cacheService;
    let mockRedisClient;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRedisClient = {
            getAsync: jest.fn(),
            setAsync: jest.fn(),
            delAsync: jest.fn(),
            keysAsync: jest.fn(),
        };

        redis.getInstance = jest.fn().mockReturnValue(mockRedisClient);

        cacheService = new RedisCacheService();
    });

    describe('Initialization', () => {
        it('should initialize with default TTL values', () => {
            expect(cacheService.defaultTTL).toBe(300);
            expect(cacheService.jobListTTL).toBe(60);
            expect(cacheService.driverStatusTTL).toBe(30);
            expect(cacheService.pricingTTL).toBe(3600);
        });

        it('should initialize Redis client', async () => {
            await cacheService.initialize();

            expect(redis.getInstance).toHaveBeenCalled();
            expect(cacheService.isConnected).toBe(true);
        });

        it('should handle initialization errors', async () => {
            redis.getInstance.mockImplementation(() => {
                throw new Error('Connection failed');
            });

            await cacheService.initialize();

            expect(cacheService.isConnected).toBe(false);
        });
    });

    describe('Basic Operations', () => {
        beforeEach(async () => {
            await cacheService.initialize();
        });

        describe('get', () => {
            it('should retrieve and parse JSON', async () => {
                const data = { user: 'test', id: 123 };
                mockRedisClient.getAsync.mockResolvedValue(JSON.stringify(data));

                const result = await cacheService.get('test:key');

                expect(result).toEqual(data);
            });

            it('should return null for missing keys', async () => {
                mockRedisClient.getAsync.mockResolvedValue(null);

                const result = await cacheService.get('missing:key');

                expect(result).toBeNull();
            });

            it('should handle parse errors', async () => {
                mockRedisClient.getAsync.mockResolvedValue('invalid json');

                const result = await cacheService.get('bad:key');

                expect(result).toBeNull();
            });

            it('should handle Redis errors', async () => {
                mockRedisClient.getAsync.mockRejectedValue(new Error('Redis error'));

                const result = await cacheService.get('error:key');

                expect(result).toBeNull();
            });
        });

        describe('set', () => {
            it('should serialize and store data', async () => {
                const data = { test: 'data' };
                mockRedisClient.setAsync.mockResolvedValue('OK');

                await cacheService.set('test:key', data);

                expect(mockRedisClient.setAsync).toHaveBeenCalledWith(
                    'test:key',
                    JSON.stringify(data),
                    300
                );
            });

            it('should use custom expiration', async () => {
                const data = { test: 'data' };
                mockRedisClient.setAsync.mockResolvedValue('OK');

                await cacheService.set('test:key', data, 600);

                expect(mockRedisClient.setAsync).toHaveBeenCalledWith(
                    'test:key',
                    JSON.stringify(data),
                    600
                );
            });

            it('should handle Redis errors', async () => {
                mockRedisClient.setAsync.mockRejectedValue(new Error('Redis error'));

                await expect(
                    cacheService.set('error:key', { test: 'data' })
                ).resolves.not.toThrow();
            });
        });

        describe('delete', () => {
            it('should delete key', async () => {
                mockRedisClient.delAsync.mockResolvedValue(1);

                await cacheService.delete('test:key');

                expect(mockRedisClient.delAsync).toHaveBeenCalledWith('test:key');
            });

            it('should handle Redis errors', async () => {
                mockRedisClient.delAsync.mockRejectedValue(new Error('Redis error'));

                await expect(
                    cacheService.delete('error:key')
                ).resolves.not.toThrow();
            });
        });

        describe('invalidate', () => {
            it('should invalidate keys matching pattern', async () => {
                mockRedisClient.keysAsync.mockResolvedValue([
                    'test:key:1',
                    'test:key:2',
                    'test:key:3',
                ]);
                mockRedisClient.delAsync.mockResolvedValue(1);

                await cacheService.invalidate('test:key:*');

                expect(mockRedisClient.delAsync).toHaveBeenCalledTimes(3);
            });

            it('should handle no matching keys', async () => {
                mockRedisClient.keysAsync.mockResolvedValue([]);

                await cacheService.invalidate('missing:*');

                expect(mockRedisClient.delAsync).not.toHaveBeenCalled();
            });

            it('should handle Redis errors', async () => {
                mockRedisClient.keysAsync.mockRejectedValue(new Error('Redis error'));

                await expect(
                    cacheService.invalidate('error:*')
                ).resolves.not.toThrow();
            });
        });
    });

    describe('Job Caching', () => {
        beforeEach(async () => {
            await cacheService.initialize();
        });

        describe('getJobsByStatus', () => {
            it('should retrieve jobs by status', async () => {
                const jobs = [{ id: 1 }, { id: 2 }];
                mockRedisClient.getAsync.mockResolvedValue(JSON.stringify(jobs));

                const result = await cacheService.getJobsByStatus('OPEN');

                expect(result).toEqual(jobs);
                expect(mockRedisClient.getAsync).toHaveBeenCalledWith('jobs:status:OPEN');
            });
        });

        describe('setJobsByStatus', () => {
            it('should cache jobs by status', async () => {
                const jobs = [{ id: 1 }, { id: 2 }];
                mockRedisClient.setAsync.mockResolvedValue('OK');

                await cacheService.setJobsByStatus('OPEN', jobs);

                expect(mockRedisClient.setAsync).toHaveBeenCalledWith(
                    'jobs:status:OPEN',
                    JSON.stringify(jobs),
                    60
                );
            });
        });

        describe('getNearbyJobs', () => {
            it('should retrieve nearby jobs', async () => {
                const jobs = [{ id: 1 }];
                mockRedisClient.getAsync.mockResolvedValue(JSON.stringify(jobs));

                const result = await cacheService.getNearbyJobs(40.7128, -74.0060);

                expect(result).toEqual(jobs);
            });

            it('should round coordinates', async () => {
                mockRedisClient.getAsync.mockResolvedValue(null);

                await cacheService.getNearbyJobs(40.71283924, -74.00601234);

                expect(mockRedisClient.getAsync).toHaveBeenCalledWith(
                    'jobs:nearby:40.71:-74.01:10'
                );
            });

            it('should support custom radius', async () => {
                mockRedisClient.getAsync.mockResolvedValue(null);

                await cacheService.getNearbyJobs(40.7128, -74.0060, 25);

                expect(mockRedisClient.getAsync).toHaveBeenCalledWith(
                    'jobs:nearby:40.71:-74.01:25'
                );
            });
        });

        describe('setNearbyJobs', () => {
            it('should cache nearby jobs', async () => {
                const jobs = [{ id: 1 }];
                mockRedisClient.setAsync.mockResolvedValue('OK');

                await cacheService.setNearbyJobs(40.7128, -74.0060, jobs);

                expect(mockRedisClient.setAsync).toHaveBeenCalledWith(
                    'jobs:nearby:40.71:-74.01:10',
                    JSON.stringify(jobs),
                    60
                );
            });
        });

        describe('getJobDetails', () => {
            it('should retrieve job details', async () => {
                const job = { id: 'job_123', status: 'OPEN' };
                mockRedisClient.getAsync.mockResolvedValue(JSON.stringify(job));

                const result = await cacheService.getJobDetails('job_123');

                expect(result).toEqual(job);
            });
        });

        describe('setJobDetails', () => {
            it('should cache job details', async () => {
                const job = { id: 'job_123', status: 'OPEN' };
                mockRedisClient.setAsync.mockResolvedValue('OK');

                await cacheService.setJobDetails('job_123', job);

                expect(mockRedisClient.setAsync).toHaveBeenCalledWith(
                    'job:job_123',
                    JSON.stringify(job),
                    60
                );
            });
        });
    });

    describe('TTL Configuration', () => {
        beforeEach(async () => {
            await cacheService.initialize();
        });

        it('should use jobListTTL for jobs by status', async () => {
            mockRedisClient.setAsync.mockResolvedValue('OK');

            await cacheService.setJobsByStatus('OPEN', []);

            const callArgs = mockRedisClient.setAsync.mock.calls[0];
            expect(callArgs[2]).toBe(60);
        });

        it('should use jobListTTL for nearby jobs', async () => {
            mockRedisClient.setAsync.mockResolvedValue('OK');

            await cacheService.setNearbyJobs(40.7128, -74.0060, []);

            const callArgs = mockRedisClient.setAsync.mock.calls[0];
            expect(callArgs[2]).toBe(60);
        });

        it('should use jobListTTL for job details', async () => {
            mockRedisClient.setAsync.mockResolvedValue('OK');

            await cacheService.setJobDetails('job_123', {});

            const callArgs = mockRedisClient.setAsync.mock.calls[0];
            expect(callArgs[2]).toBe(60);
        });
    });

    describe('Error Resilience', () => {
        beforeEach(async () => {
            await cacheService.initialize();
        });

        it('should not throw on cache read errors', async () => {
            mockRedisClient.getAsync.mockRejectedValue(new Error('Connection lost'));

            await expect(cacheService.get('test:key')).resolves.toBeNull();
        });

        it('should not throw on cache write errors', async () => {
            mockRedisClient.setAsync.mockRejectedValue(new Error('Connection lost'));

            await expect(
                cacheService.set('test:key', { test: 'data' })
            ).resolves.not.toThrow();
        });

        it('should not throw on cache delete errors', async () => {
            mockRedisClient.delAsync.mockRejectedValue(new Error('Connection lost'));

            await expect(cacheService.delete('test:key')).resolves.not.toThrow();
        });

        it('should handle null Redis client gracefully', async () => {
            cacheService.client = null;

            await expect(cacheService.get('test:key')).rejects.toThrow();
        });
    });

    describe('Data Integrity', () => {
        beforeEach(async () => {
            await cacheService.initialize();
        });

        it('should preserve complex objects', async () => {
            const data = {
                nested: { value: 42 },
                array: [1, 2, 3],
                bool: true,
                nullValue: null,
            };

            let stored;
            mockRedisClient.setAsync.mockImplementation((key, value) => {
                stored = value;
                return Promise.resolve('OK');
            });
            mockRedisClient.getAsync.mockImplementation(() => Promise.resolve(stored));

            await cacheService.set('complex:key', data);
            const result = await cacheService.get('complex:key');

            expect(result).toEqual(data);
        });

        it('should handle arrays', async () => {
            const data = [1, 2, 3, 4, 5];

            let stored;
            mockRedisClient.setAsync.mockImplementation((key, value) => {
                stored = value;
                return Promise.resolve('OK');
            });
            mockRedisClient.getAsync.mockImplementation(() => Promise.resolve(stored));

            await cacheService.set('array:key', data);
            const result = await cacheService.get('array:key');

            expect(result).toEqual(data);
        });
    });
});
