/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Advanced Response Caching Strategy - 100% Optimized
 *
 * Multi-layer caching with Redis + in-memory for maximum performance
 */

const redis = require("./redisClient");
const { logger } = require("../middleware/logger");

// In-memory L1 cache (fastest, smallest)
class L1Cache {
  constructor(maxSize = 100, ttl = 5000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  set(key, value, ttl = this.ttl) {
    // LRU eviction if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
    this.stats.sets++;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + "%" : "0%",
    };
  }
}

// Initialize L1 cache
const l1Cache = new L1Cache(500, 5000); // 500 items, 5 second TTL

/**
 * Advanced cache middleware with multi-layer strategy
 *
 * @param {Object} options Configuration
 * @param {number} options.ttl TTL in seconds
 * @param {string} options.keyPrefix Redis key prefix
 * @param {boolean} options.useL1 Use L1 in-memory cache
 * @param {boolean} options.useL2 Use L2 Redis cache
 * @param {Function} options.shouldCache Determine if response should be cached
 */
function advancedCacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = "api:cache:",
    useL1 = true,
    useL2 = true,
    shouldCache = () => true,
    varyBy = ["url"], // Cache key variation: url, query, user, org
  } = options;

  return async (req, res, next) => {
    // Skip for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {
      // Generate cache key based on varyBy options
      const cacheKey = generateCacheKey(req, keyPrefix, varyBy);

      // Check L1 cache first (fastest)
      if (useL1) {
        const l1Value = l1Cache.get(cacheKey);
        if (l1Value) {
          res.set("X-Cache", "HIT-L1");
          res.set("X-Cache-Key", cacheKey);
          logger.debug("L1 cache hit", { key: cacheKey });
          return res.json(l1Value);
        }
      }

      // Check L2 Redis cache
      if (useL2 && redis.isReady()) {
        const l2Value = await redis.get(cacheKey);
        if (l2Value) {
          const parsed = JSON.parse(l2Value);

          // Populate L1 cache
          if (useL1) {
            l1Cache.set(cacheKey, parsed, ttl * 1000);
          }

          res.set("X-Cache", "HIT-L2");
          res.set("X-Cache-Key", cacheKey);
          logger.debug("L2 cache hit", { key: cacheKey });
          return res.json(parsed);
        }
      }

      // Cache miss - intercept response
      res.set("X-Cache", "MISS");
      res.set("X-Cache-Key", cacheKey);

      const originalJson = res.json.bind(res);
      res.json = function (body) {
        // Only cache successful responses
        if (res.statusCode === 200 && shouldCache(req, body)) {
          // Store in L1
          if (useL1) {
            l1Cache.set(cacheKey, body, ttl * 1000);
          }

          // Store in L2 (Redis)
          if (useL2 && redis.isReady()) {
            redis
              .setex(cacheKey, ttl, JSON.stringify(body))
              .catch((err) => logger.error("Redis cache set failed", { error: err.message }));
          }

          logger.debug("Response cached", { key: cacheKey, ttl });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error", { error: error.message });
      next(); // Continue without caching on error
    }
  };
}

/**
 * Generate cache key based on request properties
 */
function generateCacheKey(req, prefix, varyBy) {
  const parts = [prefix];

  if (varyBy.includes("url")) {
    parts.push(req.path);
  }

  if (varyBy.includes("query") && Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map((k) => `${k}=${req.query[k]}`)
      .join("&");
    parts.push(`?${sortedQuery}`);
  }

  if (varyBy.includes("user") && req.user) {
    parts.push(`user:${req.user.sub}`);
  }

  if (varyBy.includes("org") && req.auth?.organizationId) {
    parts.push(`org:${req.auth.organizationId}`);
  }

  return parts.join(":");
}

/**
 * Cache invalidation helper
 */
async function invalidateCache(pattern) {
  try {
    // Clear L1 cache
    l1Cache.clear();

    // Clear L2 (Redis) by pattern
    if (redis.isReady()) {
      if (pattern.includes("*")) {
        // Pattern-based deletion
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.info("Cache invalidated", { pattern, count: keys.length });
        }
      } else {
        // Exact key deletion
        await redis.del(pattern);
        logger.info("Cache invalidated", { key: pattern });
      }
    }
  } catch (error) {
    logger.error("Cache invalidation failed", { error: error.message, pattern });
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  const l1Stats = l1Cache.getStats();

  return {
    l1: l1Stats,
    l2: {
      connected: redis.isReady(),
      client: redis.status,
    },
  };
}

/**
 * Preset cache configurations
 */
const cachePresets = {
  // Static data - cache forever (or until manually invalidated)
  static: advancedCacheMiddleware({
    ttl: 86400, // 24 hours
    useL1: true,
    useL2: true,
  }),

  // User-specific data - short TTL, vary by user
  userSpecific: advancedCacheMiddleware({
    ttl: 60, // 1 minute
    varyBy: ["url", "user", "org"],
    useL1: true,
    useL2: true,
  }),

  // Public data - medium TTL
  public: advancedCacheMiddleware({
    ttl: 300, // 5 minutes
    varyBy: ["url", "query"],
    useL1: true,
    useL2: true,
  }),

  // Heavy queries - longer TTL
  expensive: advancedCacheMiddleware({
    ttl: 600, // 10 minutes
    varyBy: ["url", "query", "org"],
    useL1: true,
    useL2: true,
  }),

  // Real-time data - very short TTL
  realtime: advancedCacheMiddleware({
    ttl: 5, // 5 seconds
    useL1: true,
    useL2: false, // L1 only for real-time
  }),
};

module.exports = {
  advancedCacheMiddleware,
  cachePresets,
  invalidateCache,
  getCacheStats,
  L1Cache,
};
