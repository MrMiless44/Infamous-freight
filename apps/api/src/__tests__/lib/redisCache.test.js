/**
 * Redis Cache Tests
 * Tests for Redis JSON cache helper functions
 */

jest.mock("../../queue/redis");

describe("Redis Cache", () => {
  let mockRedis;
  let cacheGetJson, cacheSetJson, redisConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.resetModules();

    // Re-require modules after reset
    ({ redisConnection } = require("../../queue/redis"));
    ({ cacheGetJson, cacheSetJson } = require("../../lib/redisCache"));

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      setex: jest.fn().mockResolvedValue("OK"),
    };

    redisConnection.mockReturnValue(mockRedis);
  });

  describe("cacheGetJson", () => {
    it("should retrieve and parse JSON from Redis", async () => {
      const data = { user: "test", id: 123 };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cacheGetJson("user:123");

      expect(result).toEqual(data);
      expect(mockRedis.get).toHaveBeenCalledWith("user:123");
    });

    it("should return null for missing keys", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheGetJson("missing:key");

      expect(result).toBeNull();
    });

    it("should handle empty strings", async () => {
      mockRedis.get.mockResolvedValue("");

      const result = await cacheGetJson("empty:key");

      expect(result).toBeNull();
    });

    it("should handle invalid JSON gracefully", async () => {
      mockRedis.get.mockResolvedValue("invalid json {{{");

      const result = await cacheGetJson("bad:data");

      expect(result).toBeNull();
    });

    it("should handle Redis errors", async () => {
      mockRedis.get.mockRejectedValue(new Error("Redis down"));

      const result = await cacheGetJson("error:key");

      expect(result).toBeNull();
    });

    it("should handle null client", async () => {
      redisConnection.mockReturnValue(null);

      const result = await cacheGetJson("test:key");

      expect(result).toBeNull();
    });

    it("should parse complex objects", async () => {
      const data = {
        nested: { value: 42 },
        array: [1, 2, 3],
        bool: true,
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cacheGetJson("complex:key");

      expect(result).toEqual(data);
    });

    it("should handle arrays", async () => {
      const data = [1, 2, 3, 4, 5];
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cacheGetJson("array:key");

      expect(result).toEqual(data);
    });
  });

  describe("cacheSetJson", () => {
    it("should serialize and store JSON in Redis", async () => {
      const data = { user: "test", id: 123 };
      mockRedis.set.mockResolvedValue("OK");

      const result = await cacheSetJson("user:123", data);

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith("user:123", JSON.stringify(data));
    });

    it("should set key with TTL", async () => {
      const data = { temp: "data" };
      mockRedis.setex.mockResolvedValue("OK");

      const result = await cacheSetJson("temp:key", data, 300);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith("temp:key", 300, JSON.stringify(data));
    });

    it("should use set without TTL when not provided", async () => {
      const data = { permanent: "data" };
      mockRedis.set.mockResolvedValue("OK");

      await cacheSetJson("perm:key", data);

      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it("should handle null TTL", async () => {
      const data = { test: "data" };
      mockRedis.set.mockResolvedValue("OK");

      await cacheSetJson("test:key", data, null);

      expect(mockRedis.set).toHaveBeenCalled();
    });

    it("should handle undefined TTL", async () => {
      const data = { test: "data" };
      mockRedis.set.mockResolvedValue("OK");

      await cacheSetJson("test:key", data, undefined);

      expect(mockRedis.set).toHaveBeenCalled();
    });

    it("should handle Redis errors", async () => {
      const data = { test: "data" };
      mockRedis.set.mockRejectedValue(new Error("Redis down"));

      const result = await cacheSetJson("error:key", data);

      expect(result).toBe(false);
    });

    it("should handle null client", async () => {
      redisConnection.mockReturnValue(null);

      const result = await cacheSetJson("test:key", { data: "test" });

      expect(result).toBe(false);
    });

    it("should serialize complex objects", async () => {
      const data = {
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
        bool: true,
        nullValue: null,
      };
      mockRedis.set.mockResolvedValue("OK");

      await cacheSetJson("complex:key", data);

      expect(mockRedis.set).toHaveBeenCalledWith("complex:key", JSON.stringify(data));
    });

    it("should handle arrays", async () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      mockRedis.set.mockResolvedValue("OK");

      await cacheSetJson("array:key", data);

      expect(mockRedis.set).toHaveBeenCalledWith("array:key", JSON.stringify(data));
    });

    it("should validate TTL is finite number", async () => {
      const data = { test: "data" };
      mockRedis.set.mockResolvedValue("OK");

      await cacheSetJson("test:key", data, "invalid");

      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it("should use setex for valid finite TTL", async () => {
      const data = { test: "data" };
      mockRedis.setex.mockResolvedValue("OK");

      await cacheSetJson("test:key", data, 60);

      expect(mockRedis.setex).toHaveBeenCalledWith("test:key", 60, JSON.stringify(data));
    });
  });

  describe("Integration Scenarios", () => {
    it("should set and retrieve same data", async () => {
      const data = { round: "trip" };
      let storedData;

      mockRedis.set.mockImplementation((key, value) => {
        storedData = value;
        return Promise.resolve("OK");
      });

      mockRedis.get.mockImplementation(() => {
        return Promise.resolve(storedData);
      });

      await cacheSetJson("test:key", data);
      const result = await cacheGetJson("test:key");

      expect(result).toEqual(data);
    });

    it("should handle cache miss then set", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue("OK");

      const result1 = await cacheGetJson("new:key");
      expect(result1).toBeNull();

      await cacheSetJson("new:key", { created: true });

      mockRedis.get.mockResolvedValue(JSON.stringify({ created: true }));
      const result2 = await cacheGetJson("new:key");
      expect(result2).toEqual({ created: true });
    });
  });

  describe("Error Resilience", () => {
    it("should not throw on Redis connection errors", async () => {
      redisConnection.mockImplementation(() => {
        throw new Error("Connection failed");
      });

      await expect(cacheGetJson("test:key")).resolves.toBeNull();
      await expect(cacheSetJson("test:key", {})).resolves.toBe(false);
    });

    it("should handle serialization errors gracefully", async () => {
      const circular = {};
      circular.self = circular;

      const result = await cacheSetJson("circular:key", circular);

      expect(result).toBe(false);
    });
  });
});
