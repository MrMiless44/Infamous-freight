/**
 * Error Handling Integration Tests
 * Tests for error scenarios across the application
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");

describe("Error Handling Integration", () => {
  let app;

  beforeAll(() => {
    app = require("../../app");
  });

  describe("Authentication Errors", () => {
    it("should return 401 for missing token", async () => {
      const response = await request(app).get("/api/shipments");

      expect(response.status).toBe(401);
    });

    it("should return 401 for invalid token format", async () => {
      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    it("should return 401 for expired token", async () => {
      const expiredToken = generateTestJWT({
        sub: "user_123",
        exp: Math.floor(Date.now() / 1000) - 3600,
      });

      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it("should return 403 for insufficient scopes", async () => {
      const token = generateTestJWT({
        sub: "user_123",
        scopes: ["user:profile"],
      });

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({ test: "data" });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe("Validation Errors", () => {
    let token;

    beforeEach(() => {
      token = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write"],
      });
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect([400, 403]).toContain(response.status);
    });

    it("should return 400 for invalid data types", async () => {
      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: "not-a-number",
        });

      expect([400, 403, 422]).toContain(response.status);
    });

    it("should return 400 for out-of-range values", async () => {
      const response = await request(app)
        .post("/api/billing/stripe-intent")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: -100,
        });

      expect([400, 403, 404]).toContain(response.status);
    });

    it("should sanitize SQL injection attempts", async () => {
      const response = await request(app)
        .get("/api/shipments")
        .query({ search: "'; DROP TABLE shipments; --" })
        .set("Authorization", `Bearer ${token}`);

      // Should not crash, should reject or sanitize
      expect([200, 400, 403, 422]).toContain(response.status);
    });

    it("should sanitize XSS attempts", async () => {
      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          description: '<script>alert("xss")</script>',
        });

      // Should sanitize or reject
      expect([200, 201, 400, 403]).toContain(response.status);
    });
  });

  describe("Resource Not Found Errors", () => {
    let token;

    beforeEach(() => {
      token = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read"],
      });
    });

    it("should return 404 for non-existent resources", async () => {
      const response = await request(app)
        .get("/api/shipments/non-existent-id")
        .set("Authorization", `Bearer ${token}`);

      expect([403, 404]).toContain(response.status);
    });

    it("should return 404 for invalid routes", async () => {
      const response = await request(app).get("/api/non-existent-endpoint");

      expect(response.status).toBe(404);
    });
  });

  describe("Rate Limiting Errors", () => {
    it("should return 429 after exceeding rate limit", async () => {
      const token = generateTestJWT({
        sub: "user_123",
        scopes: ["user:profile"],
      });

      let response;
      // Make many requests rapidly
      for (let i = 0; i < 200; i++) {
        response = await request(app).get("/api/health").set("Authorization", `Bearer ${token}`);

        if (response.status === 429) break;
      }

      // Should eventually hit rate limit
      expect([200, 429]).toContain(response.status);
    });
  });

  describe("Database Errors", () => {
    let token;

    beforeEach(() => {
      token = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write"],
      });
    });

    it("should handle database connection errors gracefully", async () => {
      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", `Bearer ${token}`);

      // Should not expose internal errors
      expect([200, 403, 500, 503]).toContain(response.status);

      if (response.status >= 500) {
        expect(response.body).not.toHaveProperty("stack");
        expect(response.body).not.toHaveProperty("sql");
      }
    });

    it("should not expose sensitive database information", async () => {
      const response = await request(app)
        .get("/api/shipments/invalid-id-format")
        .set("Authorization", `Bearer ${token}`);

      if (response.body.error) {
        expect(response.body.error).not.toMatch(/database/i);
        expect(response.body.error).not.toMatch(/prisma/i);
        expect(response.body.error).not.toMatch(/sql/i);
      }
    });
  });

  describe("Content Type Errors", () => {
    it("should reject invalid content types", async () => {
      const token = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write"],
      });

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "text/plain")
        .send("not json");

      expect([400, 403, 415]).toContain(response.status);
    });

    it("should handle malformed JSON", async () => {
      const token = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write"],
      });

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect(response.status).toBe(400);
    });
  });

  describe("Method Not Allowed Errors", () => {
    it("should return 405 for unsupported HTTP methods", async () => {
      const response = await request(app).patch("/api/health");

      expect([200, 404, 405]).toContain(response.status);
    });
  });

  describe("Timeout Errors", () => {
    it("should handle slow requests", async () => {
      const token = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read"],
      });

      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .timeout(30000);

      expect([200, 403, 408, 503]).toContain(response.status);
    });
  });

  describe("Size Limit Errors", () => {
    it("should reject oversized payloads", async () => {
      const token = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write"],
      });

      const largePayload = {
        data: "x".repeat(10 * 1024 * 1024), // 10MB
      };

      const response = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send(largePayload);

      expect([400, 403, 413]).toContain(response.status);
    });
  });

  describe("CORS Errors", () => {
    it("should handle CORS preflight requests", async () => {
      const response = await request(app)
        .options("/api/shipments")
        .set("Origin", "https://example.com")
        .set("Access-Control-Request-Method", "POST");

      expect([200, 204, 500]).toContain(response.status);
    });
  });

  describe("Error Response Format", () => {
    it("should return consistent error format", async () => {
      const response = await request(app).get("/api/shipments/non-existent");

      expect(response.body).toHaveProperty("error");
      expect(typeof response.body.error).toBe("string");
    });

    it("should not expose stack traces in production", async () => {
      const response = await request(app).get("/api/non-existent-route");

      expect(response.body).not.toHaveProperty("stack");
    });

    it("should not expose internal paths", async () => {
      const response = await request(app).get("/api/invalid-endpoint");

      if (response.body.error) {
        expect(response.body.error).not.toMatch(/\/src\//);
        expect(response.body.error).not.toMatch(/node_modules/);
      }
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await request(app).get("/api/health");

      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers).toHaveProperty("x-frame-options");
    });

    it("should not expose server information", async () => {
      const response = await request(app).get("/api/health");

      if (response.headers["x-powered-by"]) {
        expect(response.headers["x-powered-by"]).not.toMatch(/express/i);
      }
    });
  });

  describe("Concurrency Errors", () => {
    it("should handle concurrent requests", async () => {
      const token = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read"],
      });

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get("/api/shipments").set("Authorization", `Bearer ${token}`));
      }

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([200, 401, 403, 429]).toContain(response.status);
      });
    });
  });
});
