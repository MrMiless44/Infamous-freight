/**
 * Monitoring and Health Check Routes
 * Provides liveness, readiness, and metrics endpoints for observability
 */

const express = require("express");
const { prisma } = require("../db/prisma");

const router = express.Router();

// Metrics collector
const metrics = {
  requests: 0,
  errors: 0,
  responseTimes: [],
  cacheHits: 0,
  cacheMisses: 0,
};

/**
 * Liveness Probe - indicates if service is running
 * Used by Kubernetes/container orchestrators
 */
router.get("/live", (req, res) => {
  res.set("Content-Type", "application/json");
  res.json({
    status: "alive",
    service: "infamous-freight-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Readiness Probe - indicates if service is ready to serve traffic
 * Used by load balancers and orchestrators
 */
router.get("/ready", async (req, res) => {
  let isReady = true;
  const checks = {
    database: "unknown",
    redis: "unknown",
  };

  // Check database connectivity
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 5000)),
    ]);
    checks.database = "healthy";
  } catch (err) {
    console.error("Database health check failed:", err.message);
    checks.database = "unhealthy";
    isReady = false;
  }

  // Response status code based on readiness
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? "ready" : "not_ready",
    service: "infamous-freight-api",
    timestamp: new Date().toISOString(),
    checks,
  });
});

/**
 * Detailed Health Metrics
 * Returns comprehensive system health information
 */
router.get("/health", async (req, res) => {
  const health = {
    status: "healthy",
    service: "infamous-freight-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    checks: {
      database: "checking",
      redis: "checking",
    },
  };

  // Database health check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = "healthy";
  } catch (err) {
    health.checks.database = "unhealthy";
    health.status = "degraded";
  }

  // Response
  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Performance Metrics
 * Returns API performance statistics
 */
router.get("/metrics", (req, res) => {
  const avgResponseTime =
    metrics.responseTimes.length > 0
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
      : 0;

  const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b);
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

  const cacheTotal = metrics.cacheHits + metrics.cacheMisses;
  const cacheHitRate = cacheTotal > 0 ? ((metrics.cacheHits / cacheTotal) * 100).toFixed(2) : 0;

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requests: {
      total: metrics.requests,
      errors: metrics.errors,
      errorRate:
        metrics.requests > 0 ? ((metrics.errors / metrics.requests) * 100).toFixed(2) + "%" : "0%",
    },
    performance: {
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      p95ResponseTime: `${p95.toFixed(2)}ms`,
      p99ResponseTime: `${p99.toFixed(2)}ms`,
    },
    cache: {
      hits: metrics.cacheHits,
      misses: metrics.cacheMisses,
      hitRate: `${cacheHitRate}%`,
    },
  });
});

/**
 * Record metrics for tracking
 */
function recordMetrics(statusCode, duration) {
  metrics.requests++;

  if (statusCode >= 400) {
    metrics.errors++;
  }

  metrics.responseTimes.push(duration);

  // Keep only last 1000 samples to avoid memory bloat
  if (metrics.responseTimes.length > 1000) {
    metrics.responseTimes.shift();
  }
}

/**
 * Export metrics recording function for use in other middleware
 */
router.recordMetrics = recordMetrics;

module.exports = router;
