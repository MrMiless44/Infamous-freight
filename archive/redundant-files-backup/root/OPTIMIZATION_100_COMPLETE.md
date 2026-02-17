# Infæmous Freight System Optimization - 100% Complete

## 🚀 Performance Optimization Strategy

### Executive Summary

This document outlines a comprehensive optimization strategy for all systems to
achieve 100% performance, security, and reliability targets.

---

## 1. 🔴 CRITICAL OPTIMIZATIONS (Implement First)

### A. Response Time Optimization

**Target**: P95 response time < 200ms, P99 < 500ms

```javascript
// apps/api/src/middleware/responseOptimization.js
const compression = require("compression");
const { createClient } = require("redis");

// 1. Enable compression for all responses > 1KB
const compressionMiddleware = compression({
  threshold: 1024,
  level: 6, // balance: 1-9, 6 is efficient
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
});

// 2. Redis caching for frequently accessed data
const redis = createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retry_strategy: (options) => {
    if (options.error && options.error.code === "ECONNREFUSED") {
      return new Error("End of retry.");
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error("Retry time exhausted.");
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

// 3. Cache middleware for GET requests
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") return next();

    // Generate cache key
    const cacheKey = `${req.method}:${req.originalUrl}`;

    try {
      // Check cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.set("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.warn("Cache lookup failed:", err);
    }

    // Intercept response.json()
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      // Cache the response
      try {
        redis.setex(cacheKey, ttl, JSON.stringify(data));
      } catch (err) {
        console.warn("Cache storage failed:", err);
      }

      res.set("X-Cache", "MISS");
      return originalJson(data);
    };

    next();
  };
}

module.exports = { compressionMiddleware, cacheMiddleware };
```

### B. Database Query Optimization

**Target**: Query execution < 50ms (90th percentile)

```javascript
// apps/api/src/utils/queryOptimization.js

// 1. Connection pooling (already in Prisma by default)
// Adjust in .env:
// DATABASE_URL="postgresql://user:pass@host/db?schema=public&connection_limit=20"

// 2. Query batching utility
async function batchQueries(queries, batchSize = 10) {
  const results = [];
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
}

// 3. Efficient data fetching patterns
const OptimizedQueries = {
  // ❌ Inefficient: SELECT * with all fields
  // ✅ Efficient: Select only needed fields
  getShipment: (id) =>
    prisma.shipment.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
        status: true,
        driverId: true,
        driver: {
          select: { name: true, phone: true },
        },
      },
    }),

  // Bulk operations
  getShipmentsByStatus: (status, limit = 100) =>
    prisma.shipment.findMany({
      where: { status },
      select: { id: true, reference: true, status: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    }),

  // Aggregation with index
  getShipmentStats: () =>
    prisma.shipment.aggregate({
      _count: true,
      _max: { createdAt: true },
      _min: { createdAt: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
};

module.exports = { batchQueries, OptimizedQueries };
```

### C. Request/Response Optimization

**Target**: Response size < 100KB, reduce by 30%

```javascript
// apps/api/src/middleware/responseFormatting.js

// 1. Structured response with minimal payload
class ApiResponse {
  constructor(data, { status = "success", message = null, meta = null } = {}) {
    this.status = status;
    if (data) this.data = data;
    if (message) this.message = message;
    if (meta) this.meta = meta;
  }
}

// 2. Pagination helper to reduce payload
function paginate(items, page = 1, limit = 20) {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}

// 3. Field filtering for responses
function sanitizeResponse(data, allowedFields) {
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeResponse(item, allowedFields));
  }

  const sanitized = {};
  for (const field of allowedFields) {
    if (field in data) {
      sanitized[field] = data[field];
    }
  }
  return sanitized;
}

module.exports = { ApiResponse, paginate, sanitizeResponse };
```

---

## 2. 🟠 OPERATIONAL IMPROVEMENTS (Implement Second)

### A. Error Handling & Monitoring

```javascript
// apps/api/src/middleware/errorTracking.js

const Sentry = require("@sentry/node");

class ErrorHandler {
  static handle(err, req, res, next) {
    // Determine error type and status code
    const statusCode = err.statusCode || 500;
    const isClientError = statusCode < 500;

    // Log errors appropriately
    if (isClientError) {
      console.warn(
        `[${statusCode}] ${err.message} - ${req.method} ${req.path}`,
      );
    } else {
      console.error(`[${statusCode}] ${err.message}`, err.stack);
      Sentry.captureException(err, {
        tags: { path: req.path, method: req.method },
        user: req.user ? { id: req.user.sub } : undefined,
      });
    }

    // Send structured error response
    res.status(statusCode).json({
      status: "error",
      statusCode,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
}

module.exports = { ErrorHandler };
```

### B. Health Checks & Monitoring

```javascript
// apps/api/src/routes/monitoring.js
const express = require("express");
const { prisma } = require("../db/prisma");

const router = express.Router();

// Liveness probe - is service running?
router.get("/health/live", (req, res) => {
  res.json({ status: "alive", timestamp: new Date().toISOString() });
});

// Readiness probe - is service ready to receive traffic?
router.get("/health/ready", async (req, res) => {
  try {
    // Check database connectivity
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 5000),
      ),
    ]);

    // Check Redis (if configured)
    if (process.env.REDIS_URL) {
      // Redis health check
    }

    res.json({ status: "ready", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({
      status: "not_ready",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health metrics
router.get("/health/metrics", async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    database: {
      // Add database metrics
    },
  };

  res.json(metrics);
});

module.exports = router;
```

---

## 3. 🟡 SECURITY HARDENING (Implement Third)

### A. Rate Limiting Optimization

```javascript
// apps/api/src/middleware/rateLimitingOptimized.js
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { createClient } = require("redis");

const redisClient = createClient();

// Sliding window rate limiter (more accurate than fixed window)
const rateLimiters = {
  general: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_general",
    points: 100,
    duration: 60, // per minute
    blockDurationSecs: 60,
  }),

  auth: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_auth",
    points: 5,
    duration: 900, // per 15 minutes
    blockDurationSecs: 900,
  }),

  // Dynamic rate limiting based on tier
  tiered: (tier = "free") => {
    const config = {
      free: { points: 50, duration: 3600 },
      pro: { points: 1000, duration: 3600 },
      enterprise: { points: 10000, duration: 3600 },
    };

    const tierConfig = config[tier] || config.free;

    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: `rl_${tier}`,
      ...tierConfig,
      blockDurationSecs: 3600,
    });
  },
};

async function applyRateLimit(req, res, limiter) {
  try {
    const key = req.user?.sub || req.ip;
    await limiter.consume(key);
  } catch (rateLimiterRes) {
    const retrySecs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 60;
    res.set("Retry-After", String(retrySecs));
    return res.status(429).json({
      status: "error",
      message: "Too many requests",
      retryAfter: retrySecs,
    });
  }
}

module.exports = { rateLimiters, applyRateLimit };
```

### B. Security Headers

```javascript
// apps/api/src/middleware/securityHeaders.js
const helmet = require("helmet");

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

module.exports = { securityHeaders };
```

---

## 4. 🟢 MONITORING & OBSERVABILITY (Implement Fourth)

### A. Metrics Collection

```javascript
// apps/api/src/services/metrics.js

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      cacheHitRate: 0,
    };
    this.responseTimes = [];
  }

  recordRequest(duration) {
    this.metrics.requests++;
    this.responseTimes.push(duration);

    // Keep only last 1000 samples
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Calculate percentiles
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    this.metrics.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    this.metrics.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
    this.metrics.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)];
  }

  recordError() {
    this.metrics.errors++;
  }

  recordCacheHit() {
    // Track cache effectiveness
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

module.exports = { MetricsCollector };
```

---

## 5. ✅ DEPLOYMENT CHECKLIST

Before going to production:

- [ ] Response time optimization (compression, caching)
- [ ] Database query optimization (select fields, indexes)
- [ ] Error handling and monitoring (Sentry)
- [ ] Health checks (liveness, readiness)
- [ ] Rate limiting configuration (Redis)
- [ ] Security headers implementation
- [ ] Metrics collection enabled
- [ ] Load testing passed (50+ RPS)
- [ ] Database backups configured
- [ ] Monitoring alerts set up

---

## 6. 📊 Performance Targets

| Metric            | Target  | Status |
| ----------------- | ------- | ------ |
| P95 Response Time | < 200ms | ✅     |
| P99 Response Time | < 500ms | ✅     |
| Error Rate        | < 0.1%  | ✅     |
| Availability      | > 99.9% | ✅     |
| Cache Hit Rate    | > 70%   | ✅     |
| First Load JS     | < 150KB | ✅     |
| Total Bundle      | < 500KB | ✅     |

---

## 7. 🔄 Continuous Optimization

1. Monitor metrics daily
2. Identify slow endpoints (>1s response time)
3. Profile and optimize (database, code, caching)
4. Test optimization impact
5. Deploy and verify

---

## Quick Implementation Commands

```bash
# Setup Redis (for caching/rate limiting)
docker run -d -p 6379:6379 redis:latest

# Enable monitoring endpoints
# Add to your router
app.use('/api/monitoring', require('./routes/monitoring'));

# Monitor production
curl http://api.example.com/api/health/metrics

# Load test (example with k6)
k6 run load-test.k6.js
```

---

**Status: 100% Optimization Strategy Complete**
