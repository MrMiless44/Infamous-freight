const express = require("express");
const os = require("os");
const { version } = require("../../package.json");
const prisma = require("../lib/prisma");
const { getStats: getCacheStats } = require("../services/cache");
const { getConnectedClientsCount } = require("../services/websocket");
const { auditLog } = require("../middleware/security");
const { HTTP_STATUS } = require("../config/constants");

const router = express.Router();

function setNoCache(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
}

function isDbNotConfigured(error) {
  return error?.message === "Database not configured";
}

router.head("/health", (_req, res) => {
  setNoCache(res);
  res.status(HTTP_STATUS.OK).end();
});

// Basic health check
router.get("/health", auditLog, async (_req, res) => {
  const startedAt = Date.now();
  const dbCheck = {
    status: "connected",
    latencyMs: null,
    error: null,
  };

  let status = "ok";

  try {
    const t0 = Date.now();
    await prisma.$queryRaw("SELECT 1");
    dbCheck.latencyMs = Math.max(1, Date.now() - t0);
  } catch (error) {
    dbCheck.status = "disconnected";
    dbCheck.error = error?.message || "db_error";
    if (!isDbNotConfigured(error)) {
      status = "degraded";
    }
  }

  setNoCache(res);
  res.status(HTTP_STATUS.OK).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || version || "2.0.0",
    environment: process.env.NODE_ENV || "development",
    checks: { database: dbCheck },
    latencyMs: Date.now() - startedAt,
  });
});

// Detailed health check with service dependencies
router.get("/health/detailed", auditLog, async (_req, res) => {
  const dependencies = {};
  const unhealthy = [];

  let overallStatus = "healthy";

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw("SELECT 1");
    dependencies.database = {
      status: "healthy",
      responseTime: Math.max(1, Date.now() - dbStart),
    };
  } catch (error) {
    dependencies.database = {
      status: "unhealthy",
      responseTime: Math.max(1, Date.now() - dbStart),
      message: error?.message || "Database error",
    };
    unhealthy.push("database");
    if (!isDbNotConfigured(error)) {
      overallStatus = "degraded";
    }
  }

  try {
    const cacheStats = await getCacheStats();
    dependencies.redis = {
      status: "healthy",
      responseTime: 1,
      stats: cacheStats,
    };
  } catch (error) {
    dependencies.redis = {
      status: "degraded",
      responseTime: 1,
      message: error?.message || "Cache error",
    };
  }

  try {
    const connectedClients = getConnectedClientsCount();
    dependencies.websocket = {
      status: "healthy",
      responseTime: 1,
      connectedClients,
    };
  } catch (error) {
    dependencies.websocket = {
      status: "degraded",
      responseTime: 1,
      message: error?.message || "WebSocket error",
    };
  }

  if (unhealthy.length > 0 && overallStatus !== "degraded") {
    overallStatus = "degraded";
  }

  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const memoryPercentage = totalMemory > 0
    ? Math.min(99, Math.max(1, Math.round((memoryUsage.rss / totalMemory) * 100)))
    : null;

  res.status(HTTP_STATUS.OK).json({
    status: overallStatus === "healthy" ? "ok" : overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || version || "2.0.0",
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    dependencies,
    unhealthy,
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      percentage: memoryPercentage,
    },
    features: {
      ai: process.env.FEATURE_AI_ENABLED === "true",
      billing: process.env.FEATURE_BILLING_ENABLED === "true",
      voice: process.env.FEATURE_VOICE_ENABLED === "true",
    },
  });
});

// Readiness check (for Kubernetes/orchestration)
router.get("/health/readiness", auditLog, async (_req, res) => {
  let ready = true;
  let database = "connected";
  let statusCode = HTTP_STATUS.OK;

  try {
    await prisma.$queryRaw("SELECT 1");
  } catch (error) {
    database = "disconnected";
    if (!isDbNotConfigured(error)) {
      ready = false;
      statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    }
  }

  const payload = {
    ready,
    database,
  };

  if (process.env.REDIS_URL) {
    try {
      await getCacheStats();
      payload.redis = "connected";
    } catch (_error) {
      payload.redis = "disconnected";
    }
  }

  res.status(statusCode).json(payload);
});

// Liveness check (for Kubernetes/orchestration)
router.get("/health/liveness", auditLog, (_req, res) => {
  const memoryUsage = process.memoryUsage();

  res.status(HTTP_STATUS.OK).json({
    alive: true,
    pid: process.pid,
    timestamp: new Date().toISOString(),
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
    },
  });
});

router.get("/health/ready", auditLog, (_req, res) => {
  res.status(HTTP_STATUS.OK).json({ ready: true });
});

router.get("/health/live", auditLog, (_req, res) => {
  res.status(HTTP_STATUS.OK).json({ alive: true });
});

module.exports = router;
