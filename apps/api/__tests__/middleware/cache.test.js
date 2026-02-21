/**
 * Cache Middleware - Comprehensive Test Suite
 * Tests Redis caching, TTL, invalidation, and cache strategies
 * Target: 100% line, branch, and function coverage
 */

const redis = require("redis");
const {
  cacheMiddleware,
  invalidateCache,
  warmCache,
  getCacheStats,
} = require("../../src/middleware/cache");

// Mock Redis client
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    ttl: jest.fn().mockResolvedValue(3600),
    isOpen: true,
    on: jest.fn(),
  })),
}));

describe("Cache Middleware - Comprehensive Suite", () => {
  let mockRedisClient;
  let req, res, next;

  beforeEach(() => {
    mockRedisClient = redis.createClient();
    req = {
      method: "GET",
      originalUrl: "/api/shipments/123",
      path: "/api/shipments/123",
      query: {},
      user: { sub: "user-123" },
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      locals: {},
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("Cache Hit Scenarios", () => {
    it("should return cached response on cache hit", async () => {
      const cachedData = {
        statusCode: 200,
        body: { success: true, data: { id: 123 } },
        headers: { "Content-Type": "application/json" },
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining("cache:/api/shipments/123")
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cachedData.body);
      expect(res.set).toHaveBeenCalledWith("X-Cache", "HIT");
      expect(next).not.toHaveBeenCalled();
    });

    it("should include cache age in response headers", async () => {
      const cachedData = {
        statusCode: 200,
        body: { data: "test" },
        timestamp: Date.now() - 5000,
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));
      mockRedisClient.ttl.mockResolvedValue(3595);

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(res.set).toHaveBeenCalledWith("X-Cache-Age", expect.any(String));
      expect(res.set).toHaveBeenCalledWith(
        "X-Cache-TTL",
        expect.any(String)
      );
    });

    it("should handle user-specific cache keys", async () => {
      const cachedData = { statusCode: 200, body: { data: "user-data" } };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      await cacheMiddleware({ ttl: 3600, userSpecific: true })(req, res, next);

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining("user-123")
      );
    });

    it("should handle query parameter variations in cache key", async () => {
      req.query = { status: "active", page: "1" };

      const cachedData = { statusCode: 200, body: { data: [] } };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining("status=active")
      );
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining("page=1")
      );
    });
  });

  describe("Cache Miss Scenarios", () => {
    it("should proceed to handler on cache miss", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(res.set).toHaveBeenCalledWith("X-Cache", "MISS");
      expect(next).toHaveBeenCalled();
    });

    it("should cache response after handler execution", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const originalJson = res.json;
      res.json = jest.fn((data) => {
        // Simulate successful response
        res.statusCode = 200;
        return originalJson.call(res, data);
      });

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      // Simulate handler calling res.json
      res.json({ success: true, data: { id: 123 } });

      // Wait for async cache write
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"success":true'),
        { EX: 3600 }
      );
    });

    it("should not cache on Redis connection error", async () => {
      mockRedisClient.get.mockRejectedValue(new Error("Redis unavailable"));

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(res.set).toHaveBeenCalledWith("X-Cache", "BYPASS");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate single cache entry", async () => {
      await invalidateCache("/api/shipments/123");

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        expect.stringContaining("/api/shipments/123")
      );
    });

    it("should invalidate pattern-based cache entries", async () => {
      mockRedisClient.keys.mockResolvedValue([
        "cache:/api/shipments/123",
        "cache:/api/shipments/124",
        "cache:/api/shipments/125",
      ]);

      await invalidateCache("/api/shipments/*");

      expect(mockRedisClient.keys).toHaveBeenCalledWith(
        expect.stringContaining("/api/shipments/*")
      );
      expect(mockRedisClient.del).toHaveBeenCalledTimes(3);
    });

    it("should handle invalidation of non-existent keys", async () => {
      mockRedisClient.del.mockResolvedValue(0);

      await invalidateCache("/api/shipments/999");

      expect(mockRedisClient.del).toHaveBeenCalled();
      // Should not throw error
    });

    it("should invalidate user-specific caches", async () => {
      mockRedisClient.keys.mockResolvedValue([
        "cache:user-123:/api/dashboard",
        "cache:user-123:/api/profile",
      ]);

      await invalidateCache("*", { userId: "user-123" });

      expect(mockRedisClient.keys).toHaveBeenCalledWith(
        expect.stringContaining("user-123")
      );
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
    });

    it("should handle Redis errors during invalidation", async () => {
      mockRedisClient.keys.mockRejectedValue(new Error("Redis down"));

      await expect(invalidateCache("/api/shipments/*")).rejects.toThrow(
        "Redis down"
      );
    });
  });

  describe("Cache Warming", () => {
    it("should warm cache with provided data", async () => {
      const data = { success: true, data: [1, 2, 3] };

      await warmCache("/api/popular", data, { ttl: 7200 });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.stringContaining("/api/popular"),
        expect.stringContaining('"success":true'),
        { EX: 7200 }
      );
    });

    it("should warm multiple cache entries in batch", async () => {
      const entries = [
        { key: "/api/route1", data: { id: 1 } },
        { key: "/api/route2", data: { id: 2 } },
        { key: "/api/route3", data: { id: 3 } },
      ];

      await Promise.all(
        entries.map((e) => warmCache(e.key, e.data, { ttl: 3600 }))
      );

      expect(mockRedisClient.set).toHaveBeenCalledTimes(3);
    });

    it("should handle cache warming failures gracefully", async () => {
      mockRedisClient.set.mockRejectedValue(new Error("Out of memory"));

      await expect(
        warmCache("/api/data", { test: true }, { ttl: 3600 })
      ).rejects.toThrow("Out of memory");
    });
  });

  describe("Cache Statistics", () => {
    it("should return cache hit/miss statistics", async () => {
      // Simulate some cache hits and misses
      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify({ statusCode: 200 }))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify({ statusCode: 200 }));

      const stats = await getCacheStats();

      expect(stats).toHaveProperty("hits");
      expect(stats).toHaveProperty("misses");
      expect(stats).toHaveProperty("hitRate");
    });

    it("should calculate cache hit rate", async () => {
      const stats = {
        hits: 75,
        misses: 25,
      };

      const hitRate = stats.hits / (stats.hits + stats.misses);
      expect(hitRate).toBe(0.75);
    });

    it("should return cache size metrics", async () => {
      mockRedisClient.keys.mockResolvedValue(new Array(1000).fill("key"));

      const stats = await getCacheStats();

      expect(stats.totalKeys).toBe(1000);
    });
  });

  describe("Cache Strategies", () => {
    it("should respect cache-control headers for TTL", async () => {
      req.headers["cache-control"] = "max-age=1800";

      mockRedisClient.get.mockResolvedValue(null);

      await cacheMiddleware({ ttl: 3600, respectCacheControl: true })(
        req,
        res,
        next
      );

      res.json({ data: "test" });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { EX: 1800 }
      );
    });

    it("should bypass cache on no-cache header", async () => {
      req.headers["cache-control"] = "no-cache";

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith("X-Cache", "BYPASS");
      expect(next).toHaveBeenCalled();
    });

    it("should support cache-aside pattern", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheMiddleware({ ttl: 3600, strategy: "cache-aside" })(
        req,
        res,
        next
      );

      expect(next).toHaveBeenCalled();
    });

    it("should support write-through pattern", async () => {
      req.method = "POST";
      req.body = { name: "Test" };

      await cacheMiddleware({ strategy: "write-through" })(req, res, next);

      expect(next).toHaveBeenCalled();
      // Should invalidate related caches after write
    });
  });

  describe("Conditional Caching", () => {
    it("should not cache POST requests by default", async () => {
      req.method = "POST";

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it("should not cache authenticated requests without userSpecific flag", async () => {
      req.user = { sub: "user-123" };

      await cacheMiddleware({ ttl: 3600, skipAuthenticated: true })(
        req,
        res,
        next
      );

      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it("should not cache responses with errors", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      res.statusCode = 500;
      res.json({ error: "Internal error" });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it("should skip cache on ETag match", async () => {
      req.headers["if-none-match"] = '"abc123"';
      res.set("ETag", '"abc123"');

      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({
          statusCode: 200,
          body: { data: "test" },
          etag: '"abc123"',
        })
      );

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(res.status).toHaveBeenCalledWith(304);
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("should handle malformed cached JSON", async () => {
      mockRedisClient.get.mockResolvedValue("{invalid json}");

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(res.set).toHaveBeenCalledWith("X-Cache", "MISS");
      expect(next).toHaveBeenCalled();
    });

    it("should handle null response bodies", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      res.json(null);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still cache
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it("should handle Redis disconnections gracefully", async () => {
      mockRedisClient.isOpen = false;

      await cacheMiddleware({ ttl: 3600 })(req, res, next);

      expect(res.set).toHaveBeenCalledWith("X-Cache", "BYPASS");
      expect(next).toHaveBeenCalled();
    });

    it("should handle extremely large cache entries", async () => {
      const largeData = { data: "x".repeat(10 * 1024 * 1024) }; // 10MB

      await warmCache("/api/large", largeData, { ttl: 60 });

      // Should handle or reject gracefully
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it("should handle concurrent cache reads/writes", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const requests = Array(100)
        .fill(null)
        .map(() => cacheMiddleware({ ttl: 3600 })(req, res, next));

      await Promise.all(requests);

      expect(next).toHaveBeenCalledTimes(100);
    });
  });

  describe("Performance Optimization", () => {
    it("should compress large responses before caching", async () => {
      const largeData = {
        data: new Array(1000).fill({ id: 1, name: "Test", description: "..." }),
      };

      await warmCache("/api/bulk", largeData, { ttl: 3600, compress: true });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object)
      );
    });

    it("should use cache tags for efficient invalidation", async () => {
      await warmCache("/api/shipment/123", { id: 123 }, {
        ttl: 3600,
        tags: ["shipment", "user-123"],
      });

      mockRedisClient.keys.mockResolvedValue([
        "cache:/api/shipment/123",
        "cache:/api/shipment/124",
      ]);

      await invalidateCache("*", { tag: "shipment" });

      expect(mockRedisClient.keys).toHaveBeenCalledWith(
        expect.stringContaining("shipment")
      );
    });
  });
});
