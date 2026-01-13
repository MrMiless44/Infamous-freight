/**
 * Redis Cache Service
 * Implements caching layer for API responses
 */

const redis = require('redis');
const { promisify } = require('util');

class RedisCacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async initialize() {
        const redis = require('redis');

        this.client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                connectTimeout: 10000,
                reconnectStrategy: (retries) => Math.min(retries * 50, 500),
            },
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        await this.client.connect();
        console.log('✅ Redis cache connected');
    }

    async get(key: string): Promise<any | null> {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(
        key: string,
        value: any,
        expirationSeconds: number = 300
    ): Promise<void> {
        try {
            await this.client.setEx(
                key,
                expirationSeconds,
                JSON.stringify(value)
            );
        } catch (error) {
            console.error('Failed to set cache:', error);
        }
    }

    async get<T = any>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Failed to get from cache:', error);
            return null;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Failed to delete from cache:', error);
        }
    }

    async invalidate(pattern: string): Promise<void> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            console.error('Failed to invalidate cache:', error);
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
        }
    }
}

export const cacheService = new CacheService();
