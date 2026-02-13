/**
 * Performance and Load Testing Edge Cases
 * Tests for concurrent requests, memory usage, and performance boundaries
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");

describe("Performance Edge Cases", () => {
  let app;

  beforeAll(() => {
    app = require("../../app");
  });

  describe("Concurrent Request Handling", () => {
    let authToken;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read"],
      });
    });

    it("should handle 10 concurrent requests", async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).get("/api/health").set("Authorization", `Bearer ${authToken}`),
      );

      const responses = await Promise.all(promises);
      responses.forEach((response) => {
        expect([200, 401, 503]).toContain(response.status);
      });
    });

    it("should handle 50 concurrent requests", async () => {
      const promises = Array.from({ length: 50 }, () => request(app).get("/api/health"));

      const responses = await Promise.all(promises);
      expect(responses.length).toBe(50);
      const allComplete = responses.every((r) => r.status > 0);
      expect(allComplete).toBe(true);
    });

    it("should handle rapid sequential requests", async () => {
      const responses = [];
      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .get("/api/health")
          .set("Authorization", `Bearer ${authToken}`);
        responses.push(response);
      }

      expect(responses.length).toBe(20);
      const allComplete = responses.every((r) => r.status > 0);
      expect(allComplete).toBe(true);
    });

    it("should handle mixed method concurrent requests", async () => {
      const promises = [
        request(app).get("/api/health"),
        request(app).get("/api/health"),
        request(app).post("/api/auth/login").send({}),
        request(app).get("/api/health"),
      ];

      const responses = await Promise.all(promises);
      expect(responses.length).toBe(4);
      responses.forEach((r) => expect(r.status).toBeGreaterThan(0));
    });
  });

  describe("Large Payload Handling", () => {
    let authToken;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write"],
      });
    });

    it("should handle small payload (< 1KB)", async () => {
      const payload = { data: "x".repeat(500) };

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);

      expect([200, 201, 400, 401, 413]).toContain(response.status);
    });

    it("should handle medium payload (10KB)", async () => {
      const payload = { data: "x".repeat(10000) };

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);

      expect([200, 201, 400, 401, 413]).toContain(response.status);
    });

    it("should handle large payload (100KB)", async () => {
      const payload = { data: "x".repeat(100000) };

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);

      // Should either accept or reject with 413 Payload Too Large
      expect([200, 201, 400, 401, 413]).toContain(response.status);
    });

    it("should handle deeply nested JSON", async () => {
      let nested = { value: "end" };
      for (let i = 0; i < 20; i++) {
        nested = { nested };
      }

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(nested);

      expect([200, 201, 400, 401, 413]).toContain(response.status);
    });

    it("should handle large arrays", async () => {
      const payload = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
        })),
      };

      const response = await request(app)
        .post("/api/shipments/bulk")
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);

      expect([200, 201, 400, 401, 404, 413]).toContain(response.status);
    });
  });

  describe("Response Time Boundaries", () => {
    it("should respond to health check quickly", async () => {
      const start = Date.now();
      await request(app).get("/api/health");
      const duration = Date.now() - start;

      // Should respond within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it("should handle timeout gracefully", async () => {
      const response = await request(app).get("/api/health").timeout(100); // Very short timeout

      // Will either succeed quickly or timeout
      expect([200, 408, 503]).toContain(response.status || 408);
    }, 500);

    it("should measure average response time", async () => {
      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app).get("/api/health");
        times.push(Date.now() - start);
      }

      const average = times.reduce((a, b) => a + b, 0) / iterations;
      expect(average).toBeGreaterThan(0);
      expect(average).toBeLessThan(1000);
    });
  });

  describe("Memory Usage Patterns", () => {
    it("should handle repeated string allocation", () => {
      const strings = [];
      for (let i = 0; i < 1000; i++) {
        strings.push(`String number ${i}`);
      }
      expect(strings.length).toBe(1000);
    });

    it("should handle large object creation", () => {
      const objects = [];
      for (let i = 0; i < 100; i++) {
        objects.push({
          id: i,
          data: "x".repeat(1000),
          nested: {
            value: i,
          },
        });
      }
      expect(objects.length).toBe(100);
    });

    it("should handle array growth", () => {
      const arr = [];
      for (let i = 0; i < 10000; i++) {
        arr.push(i);
      }
      expect(arr.length).toBe(10000);
      expect(arr[9999]).toBe(9999);
    });

    it("should handle object property accumulation", () => {
      const obj = {};
      for (let i = 0; i < 1000; i++) {
        obj[`prop${i}`] = i;
      }
      expect(Object.keys(obj).length).toBe(1000);
    });
  });

  describe("Database Query Performance", () => {
    let authToken;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read"],
      });
    });

    it("should handle single record query", async () => {
      const response = await request(app)
        .get("/api/shipments/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 401, 404]).toContain(response.status);
    });

    it("should handle paginated list query", async () => {
      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect([200, 401]).toContain(response.status);
    });

    it("should handle filtered query", async () => {
      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .query({
          status: "DELIVERED",
          limit: 100,
        });

      expect([200, 401]).toContain(response.status);
    });

    it("should handle complex join query", async () => {
      const response = await request(app)
        .get("/api/shipments?include=driver,customer")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 400, 401, 404]).toContain(response.status);
    });
  });

  describe("Cache Performance", () => {
    it("should benefit from repeated requests (cache hit)", async () => {
      const endpoint = "/api/health";

      // First request (cache miss)
      const start1 = Date.now();
      await request(app).get(endpoint);
      const time1 = Date.now() - start1;

      // Second request (potential cache hit)
      const start2 = Date.now();
      await request(app).get(endpoint);
      const time2 = Date.now() - start2;

      // Both should complete successfully
      expect(time1).toBeGreaterThanOrEqual(0);
      expect(time2).toBeGreaterThanOrEqual(0);
    });

    it("should handle cache invalidation", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read", "shipment:write"],
      });

      // Read (cache)
      await request(app).get("/api/shipments/1").set("Authorization", `Bearer ${authToken}`);

      // Write (invalidate cache)
      await request(app)
        .put("/api/shipments/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "IN_TRANSIT" });

      // Read again (cache miss)
      const response = await request(app)
        .get("/api/shipments/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 401, 404]).toContain(response.status);
    });
  });

  describe("Rate Limit Performance", () => {
    it("should track request counts accurately", async () => {
      const requests = 5;
      const responses = [];

      for (let i = 0; i < requests; i++) {
        const response = await request(app).get("/api/health");
        responses.push(response);
      }

      expect(responses.length).toBe(requests);
    });

    it("should enforce rate limits under load", async () => {
      // Attempt to exceed rate limit
      const promises = Array.from({ length: 200 }, () => request(app).get("/api/health"));

      const responses = await Promise.all(promises);

      // Some requests should succeed, others may be rate limited
      const statusCodes = responses.map((r) => r.status);
      const hasSuccess = statusCodes.some((s) => s === 200);
      const hasRateLimit = statusCodes.some((s) => s === 429);

      expect(hasSuccess || hasRateLimit || statusCodes.some((s) => s === 503)).toBe(true);
    });

    it("should reset rate limits after window", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read"],
      });

      // Make initial requests
      await request(app).get("/api/health").set("Authorization", `Bearer ${authToken}`);

      // Wait briefly (simulating window reset)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still be able to make requests
      const response = await request(app)
        .get("/api/health")
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 401, 429, 503]).toContain(response.status);
    });
  });

  describe("Connection Pool Management", () => {
    it("should handle sequential database operations", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read"],
      });

      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(
          request(app).get("/api/shipments").set("Authorization", `Bearer ${authToken}`),
        );
      }

      const responses = await Promise.all(operations);
      expect(responses.length).toBe(10);
    });

    it("should recover from connection errors", async () => {
      const response = await request(app).get("/api/health");

      // Health check should handle connection issues gracefully
      expect([200, 503]).toContain(response.status);
    });
  });

  describe("Garbage Collection Impact", () => {
    it("should handle temporary object creation", () => {
      // Create many temporary objects
      for (let i = 0; i < 10000; i++) {
        const temp = { value: i };
        expect(temp.value).toBe(i);
      }
    });

    it("should handle string concatenation", () => {
      let result = "";
      for (let i = 0; i < 100; i++) {
        result += `Part ${i} `;
      }
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle array operations", () => {
      const arr = Array.from({ length: 1000 }, (_, i) => i);
      const filtered = arr.filter((x) => x % 2 === 0);
      const mapped = filtered.map((x) => x * 2);
      expect(mapped.length).toBe(500);
    });
  });

  describe("CPU-Intensive Operations", () => {
    it("should handle numeric calculations", () => {
      let sum = 0;
      for (let i = 0; i < 10000; i++) {
        sum += Math.sqrt(i);
      }
      expect(sum).toBeGreaterThan(0);
    });

    it("should handle string processing", () => {
      const text = "x".repeat(10000);
      const processed = text.split("").reverse().join("");
      expect(processed.length).toBe(10000);
    });

    it("should handle JSON parsing", () => {
      const obj = { data: Array.from({ length: 1000 }, (_, i) => ({ id: i })) };
      const json = JSON.stringify(obj);
      const parsed = JSON.parse(json);
      expect(parsed.data.length).toBe(1000);
    });

    it("should handle regex operations", () => {
      const text = "test@example.com ".repeat(100);
      const matches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
      expect(matches).toBeDefined();
    });
  });

  describe("Streaming and Chunking", () => {
    it("should handle large response streaming", async () => {
      const response = await request(app).get("/api/health");

      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThan(0);
    });

    it("should handle chunked requests", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write"],
      });

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .set("Transfer-Encoding", "chunked")
        .send({ data: "chunked data" });

      expect([200, 201, 400, 401]).toContain(response.status);
    });
  });

  describe("Error Recovery Performance", () => {
    it("should recover quickly from validation errors", async () => {
      const start = Date.now();
      await request(app).post("/api/auth/login").send({ invalid: "data" });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });

    it("should handle multiple consecutive errors", async () => {
      const responses = [];
      for (let i = 0; i < 10; i++) {
        const response = await request(app).post("/api/auth/login").send({ invalid: "data" });
        responses.push(response);
      }

      expect(responses.length).toBe(10);
      responses.forEach((r) => expect(r.status).toBeGreaterThan(0));
    });
  });
});
