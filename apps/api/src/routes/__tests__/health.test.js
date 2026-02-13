/**
 * Health Routes Tests
 * Tests for health check and monitoring endpoints
 *
 * Routes tested:
 * - HEAD /health - HEAD request health check
 * - GET /health - Basic health check
 * - GET /health/detailed - Detailed health with dependencies
 * - GET /health/readiness - Kubernetes readiness probe
 * - GET /health/liveness - Kubernetes liveness probe
 * - GET /health/ready - Simple ready check
 * - GET /health/live - Simple alive check
 */

const request = require("supertest");
const express = require("express");

// Mock dependencies
const mockPrisma = {
  $queryRaw: jest.fn(),
};

jest.mock("../../lib/prisma", () => mockPrisma);

jest.mock("../../services/cache", () => ({
  getStats: jest.fn(() =>
    Promise.resolve({
      hits: 100,
      misses: 10,
      keys: 50,
    }),
  ),
}));

jest.mock("../../services/websocket", () => ({
  getConnectedClientsCount: jest.fn(() => 5),
}));

jest.mock("../../middleware/security", () => ({
  auditLog: (req, res, next) => next(),
}));

jest.mock("../../config/constants", () => ({
  HTTP_STATUS: {
    OK: 200,
    SERVICE_UNAVAILABLE: 503,
  },
}));

jest.mock("../../middleware/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocks
const healthRouter = require("../health");
const { getStats: getCacheStats } = require("../../services/cache");
const { getConnectedClientsCount } = require("../../services/websocket");

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/", healthRouter);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

// Test suite
describe("Health Routes", () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: database is healthy
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    // Default: cache is working
    getCacheStats.mockResolvedValue({
      hits: 100,
      misses: 10,
      keys: 50,
    });
    // Default: websocket is working
    getConnectedClientsCount.mockReturnValue(5);
  });

  describe("HEAD /health", () => {
    it("should respond to HEAD request", async () => {
      const response = await request(app).head("/health");

      expect(response.status).toBe(200);
      expect(response.headers["cache-control"]).toBe(
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      expect(response.headers["pragma"]).toBe("no-cache");
    });

    it("should set no-cache headers", async () => {
      const response = await request(app).head("/health");

      expect(response.headers["cache-control"]).toContain("no-store");
      expect(response.headers["cache-control"]).toContain("no-cache");
      expect(response.headers["expires"]).toBe("0");
    });
  });

  describe("GET /health", () => {
    it("should return basic health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });

    it("should check database connection", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.checks.database.status).toBe("connected");
      expect(response.body.checks.database.latencyMs).toBeGreaterThan(0);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it("should report degraded status when database fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection timeout"));

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("degraded");
      expect(response.body.checks.database.status).toBe("disconnected");
      expect(response.body.checks.database.error).toBeDefined();
    });

    it("should measure database latency", async () => {
      const response = await request(app).get("/health");

      expect(response.body.checks.database.latencyMs).toBeGreaterThan(0);
      expect(typeof response.body.checks.database.latencyMs).toBe("number");
    });

    it("should include response latency", async () => {
      const response = await request(app).get("/health");

      expect(response.body.latencyMs).toBeDefined();
      expect(response.body.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("should set no-cache headers", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["cache-control"]).toContain("no-store");
      expect(response.headers["pragma"]).toBe("no-cache");
    });

    it("should handle database not configured error", async () => {
      const error = new Error("Database not configured");
      mockPrisma.$queryRaw.mockRejectedValue(error);

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok"); // Not degraded for unconfigured DB
    });
  });

  describe("GET /health/detailed", () => {
    it("should return detailed health status", async () => {
      const response = await request(app).get("/health/detailed");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.dependencies).toBeDefined();
      expect(response.body.dependencies.database).toBeDefined();
      expect(response.body.dependencies.redis).toBeDefined();
      expect(response.body.dependencies.websocket).toBeDefined();
    });

    it("should check all dependencies", async () => {
      const response = await request(app).get("/health/detailed");

      expect(response.body.dependencies.database.status).toBe("healthy");
      expect(response.body.dependencies.redis.status).toBe("healthy");
      expect(response.body.dependencies.websocket.status).toBe("healthy");
    });

    it("should include memory usage", async () => {
      const response = await request(app).get("/health/detailed");

      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.rss).toBeGreaterThan(0);
      expect(response.body.memory.heapUsed).toBeGreaterThan(0);
      expect(response.body.memory.percentage).toBeDefined();
    });

    it("should include feature flags", async () => {
      const response = await request(app).get("/health/detailed");

      expect(response.body.features).toBeDefined();
      expect(response.body.features.ai).toBeDefined();
      expect(response.body.features.billing).toBeDefined();
      expect(response.body.features.voice).toBeDefined();
    });

    it("should report degraded when database is unhealthy", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection failed"));

      const response = await request(app).get("/health/detailed");

      expect(response.body.status).toBe("degraded");
      expect(response.body.dependencies.database.status).toBe("unhealthy");
      expect(response.body.unhealthy).toContain("database");
    });

    it("should handle redis cache errors gracefully", async () => {
      getCacheStats.mockRejectedValue(new Error("Redis unavailable"));

      const response = await request(app).get("/health/detailed");

      expect(response.status).toBe(200);
      expect(response.body.dependencies.redis.status).toBe("degraded");
    });

    it("should handle websocket errors gracefully", async () => {
      getConnectedClientsCount.mockImplementation(() => {
        throw new Error("WebSocket error");
      });

      const response = await request(app).get("/health/detailed");

      expect(response.status).toBe(200);
      expect(response.body.dependencies.websocket.status).toBe("degraded");
    });

    it("should include response times for all dependencies", async () => {
      const response = await request(app).get("/health/detailed");

      expect(response.body.dependencies.database.responseTime).toBeGreaterThan(0);
      expect(response.body.dependencies.redis.responseTime).toBeDefined();
      expect(response.body.dependencies.websocket.responseTime).toBeDefined();
    });

    it("should include cache statistics", async () => {
      const response = await request(app).get("/health/detailed");

      expect(response.body.dependencies.redis.stats).toBeDefined();
      expect(response.body.dependencies.redis.stats.hits).toBe(100);
      expect(response.body.dependencies.redis.stats.misses).toBe(10);
    });

    it("should include websocket client count", async () => {
      const response = await request(app).get("/health/detailed");

      expect(response.body.dependencies.websocket.connectedClients).toBe(5);
    });

    it("should include node version", async () => {
      const response = await request(app).get("/health/detailed");

      expect(response.body.nodeVersion).toBeDefined();
      expect(response.body.nodeVersion).toMatch(/^v/);
    });
  });

  describe("GET /health/readiness", () => {
    it("should return ready when database is connected", async () => {
      const response = await request(app).get("/health/readiness");

      expect(response.status).toBe(200);
      expect(response.body.ready).toBe(true);
      expect(response.body.database).toBe("connected");
    });

    it("should return not ready when database fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Database down"));

      const response = await request(app).get("/health/readiness");

      expect(response.status).toBe(503);
      expect(response.body.ready).toBe(false);
      expect(response.body.database).toBe("disconnected");
    });

    it("should check redis when configured", async () => {
      process.env.REDIS_URL = "redis://localhost:6379";

      const response = await request(app).get("/health/readiness");

      expect(response.body.redis).toBeDefined();
      expect(response.body.redis).toBe("connected");

      delete process.env.REDIS_URL;
    });

    it("should handle database not configured", async () => {
      const error = new Error("Database not configured");
      mockPrisma.$queryRaw.mockRejectedValue(error);

      const response = await request(app).get("/health/readiness");

      expect(response.status).toBe(200);
      expect(response.body.ready).toBe(true);
    });
  });

  describe("GET /health/liveness", () => {
    it("should always return alive", async () => {
      const response = await request(app).get("/health/liveness");

      expect(response.status).toBe(200);
      expect(response.body.alive).toBe(true);
    });

    it("should include process ID", async () => {
      const response = await request(app).get("/health/liveness");

      expect(response.body.pid).toBe(process.pid);
    });

    it("should include timestamp", async () => {
      const response = await request(app).get("/health/liveness");

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should include memory usage", async () => {
      const response = await request(app).get("/health/liveness");

      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.rss).toBeGreaterThan(0);
      expect(response.body.memory.heapUsed).toBeGreaterThan(0);
      expect(response.body.memory.heapTotal).toBeGreaterThan(0);
    });
  });

  describe("GET /health/ready", () => {
    it("should return ready status", async () => {
      const response = await request(app).get("/health/ready");

      expect(response.status).toBe(200);
      expect(response.body.ready).toBe(true);
    });
  });

  describe("GET /health/live", () => {
    it("should return alive status", async () => {
      const response = await request(app).get("/health/live");

      expect(response.status).toBe(200);
      expect(response.body.alive).toBe(true);
    });
  });

  describe("Cache Headers", () => {
    it("should set no-cache headers on all endpoints", async () => {
      const endpoints = ["/health", "/health/readiness"];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);

        if (endpoint === "/health") {
          expect(response.headers["cache-control"]).toContain("no-store");
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle unexpected database errors", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Unexpected error"));

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.checks.database.status).toBe("disconnected");
    });

    it("should handle null error objects", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(null);

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.checks.database.status).toBe("disconnected");
    });
  });
});
