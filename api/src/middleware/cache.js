/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Response Caching Middleware
 */

const redis = require('redis');

let redisClient = null;

// Initialize Redis client
async function initRedis() {
    if (redisClient) return redisClient;

    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500),
            },
        });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        redisClient.on('connect', () => console.info('✅ Redis connected'));

        await redisClient.connect();
        return redisClient;
    } catch (err) {
        console.warn('⚠️  Redis unavailable, caching disabled:', err.message);
        return null;
    }
}

// Cache middleware factory
function cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') return next();

        const client = await initRedis();
        if (!client) return next();

        const cacheKey = `cache:${req.originalUrl || req.path}:${req.user?.sub || 'anonymous'}`;

        try {
            // Try to get from cache
            const cached = await client.get(cacheKey);
            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.json(JSON.parse(cached));
            }
        } catch (err) {
            console.warn('Cache read error:', err.message);
            // Continue on cache miss/error
        }

        // Intercept res.json to cache response
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            if (res.statusCode === 200 && client) {
                client.setEx(cacheKey, ttl, JSON.stringify(data))
                    .catch((err) => console.warn('Cache write error:', err.message));
            }
            res.set('X-Cache', 'MISS');
            return originalJson(data);
        };

        next();
    };
}

// Cache invalidation helper
async function invalidateCache(pattern = '*') {
    const client = await initRedis();
    if (!client) return;

    try {
        const keys = await client.keys(`cache:${pattern}`);
        if (keys.length > 0) {
            await client.del(keys);
            console.info(`✅ Invalidated ${keys.length} cache keys`);
        }
    } catch (err) {
        console.error('Cache invalidation error:', err.message);
    }
}

module.exports = {
    initRedis,
    cacheMiddleware,
    invalidateCache,
};
