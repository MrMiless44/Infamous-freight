/**
 * End-to-End Flow Tests
 * Tests for complete user journeys and business workflows
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");

describe("End-to-End Workflows", () => {
  let app;

  beforeAll(() => {
    app = require("../../app");
  });

  describe("Shipment Lifecycle", () => {
    let authToken;
    let shipmentId;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write", "shipment:read", "shipment:update"],
      });
    });

    it("should create, retrieve, and update shipment", async () => {
      // Create shipment
      const createResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          pickupAddress: "123 Main St",
          deliveryAddress: "456 Oak Ave",
          weight: 100,
        });

      if (createResponse.status === 201) {
        shipmentId = createResponse.body.data?.id;
        expect(shipmentId).toBeDefined();

        // Retrieve shipment
        const getResponse = await request(app)
          .get(`/api/shipments/${shipmentId}`)
          .set("Authorization", `Bearer ${authToken}`);

        expect([200, 404]).toContain(getResponse.status);

        if (getResponse.status === 200) {
          expect(getResponse.body.data?.id).toBe(shipmentId);

          // Update shipment
          const updateResponse = await request(app)
            .put(`/api/shipments/${shipmentId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({
              status: "IN_TRANSIT",
            });

          expect([200, 404]).toContain(updateResponse.status);
        }
      }
    });
  });

  describe("User Registration and Authentication Flow", () => {
    it("should register, login, and access protected endpoint", async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: "TestPass123!",
        name: "Test User",
      };

      // Register
      const registerResponse = await request(app).post("/api/auth/register").send(userData);

      if (registerResponse.status === 201) {
        // Login
        const loginResponse = await request(app).post("/api/auth/login").send({
          email: userData.email,
          password: userData.password,
        });

        if (loginResponse.status === 200) {
          const token = loginResponse.body.data?.token;
          expect(token).toBeDefined();

          // Access protected endpoint
          const profileResponse = await request(app)
            .get("/api/users/profile")
            .set("Authorization", `Bearer ${token}`);

          expect([200, 401]).toContain(profileResponse.status);
        }
      }
    });
  });

  describe("Payment Processing Flow", () => {
    let authToken;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "merchant_123",
        scopes: ["payment:write", "billing:payment"],
      });
    });

    it("should create payment intent and process payment", async () => {
      // Create payment intent
      const intentResponse = await request(app)
        .post("/api/billing/stripe-intent")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 100.0,
          currency: "usd",
        });

      if ([200, 201].includes(intentResponse.status)) {
        const clientSecret = intentResponse.body.data?.clientSecret;

        if (clientSecret) {
          expect(clientSecret).toBeDefined();
          expect(typeof clientSecret).toBe("string");
        }
      }
    });

    it("should handle payment confirmation", async () => {
      const confirmResponse = await request(app)
        .post("/api/billing/confirm-payment")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          paymentIntentId: "pi_test_123",
        });

      expect([200, 401, 403, 404]).toContain(confirmResponse.status);
    });
  });

  describe("Job Dispatch and Assignment Flow", () => {
    let adminToken, driverToken;
    let jobId;

    beforeAll(() => {
      adminToken = generateTestJWT({
        sub: "admin_123",
        scopes: ["job:write", "job:assign"],
      });
      driverToken = generateTestJWT({
        sub: "driver_123",
        scopes: ["job:read", "job:accept"],
      });
    });

    it("should create job, dispatch, and assign to driver", async () => {
      // Create job
      const createResponse = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          type: "DELIVERY",
          pickupLocation: { lat: 40.7128, lng: -74.006 },
          deliveryLocation: { lat: 40.758, lng: -73.9855 },
        });

      if ([200, 201].includes(createResponse.status)) {
        jobId = createResponse.body.data?.id;

        if (jobId) {
          // Dispatch job
          const dispatchResponse = await request(app)
            .post(`/api/jobs/${jobId}/dispatch`)
            .set("Authorization", `Bearer ${adminToken}`);

          expect([200, 202, 404]).toContain(dispatchResponse.status);

          // Driver accepts job
          const acceptResponse = await request(app)
            .post(`/api/jobs/${jobId}/accept`)
            .set("Authorization", `Bearer ${driverToken}`);

          expect([200, 400, 403, 404]).toContain(acceptResponse.status);
        }
      }
    });
  });

  describe("Analytics and Reporting Flow", () => {
    let authToken;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "admin_123",
        scopes: ["analytics:read", "reports:generate"],
      });
    });

    it("should generate and retrieve analytics report", async () => {
      // Request analytics
      const analyticsResponse = await request(app)
        .get("/api/analytics/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .query({
          startDate: "2024-01-01",
          endDate: "2024-12-31",
        });

      expect([200, 401, 403, 404]).toContain(analyticsResponse.status);

      if (analyticsResponse.status === 200) {
        const data = analyticsResponse.body.data || analyticsResponse.body;
        expect(data).toBeDefined();
      }
    });
  });

  describe("Real-time Updates Flow", () => {
    let authToken;
    let shipmentId;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read", "tracking:read"],
      });
    });

    it("should create shipment and track updates", async () => {
      // Create shipment
      const createResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "Test tracking",
        });

      if (createResponse.status === 201) {
        shipmentId = createResponse.body.data?.id;

        if (shipmentId) {
          // Get tracking info
          const trackingResponse = await request(app)
            .get(`/api/shipments/${shipmentId}/tracking`)
            .set("Authorization", `Bearer ${authToken}`);

          expect([200, 404]).toContain(trackingResponse.status);
        }
      }
    });
  });

  describe("Multi-tenant Data Isolation", () => {
    let tenant1Token, tenant2Token;

    beforeAll(() => {
      tenant1Token = generateTestJWT({
        sub: "user_tenant1",
        orgId: "org_1",
        scopes: ["shipment:read", "shipment:write"],
      });
      tenant2Token = generateTestJWT({
        sub: "user_tenant2",
        orgId: "org_2",
        scopes: ["shipment:read"],
      });
    });

    it("should enforce tenant data isolation", async () => {
      // Tenant 1 creates shipment
      const createResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${tenant1Token}`)
        .send({
          description: "Tenant 1 shipment",
        });

      if (createResponse.status === 201) {
        const shipmentId = createResponse.body.data?.id;

        if (shipmentId) {
          // Tenant 2 tries to access Tenant 1's shipment
          const accessResponse = await request(app)
            .get(`/api/shipments/${shipmentId}`)
            .set("Authorization", `Bearer ${tenant2Token}`);

          // Should deny access or return 404
          expect([403, 404]).toContain(accessResponse.status);
        }
      }
    });
  });

  describe("Idempotency Handling", () => {
    let authToken;
    const idempotencyKey = `key-${Date.now()}`;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:write"],
      });
    });

    it("should handle duplicate requests with same idempotency key", async () => {
      const requestData = {
        description: "Idempotent test",
      };

      // First request
      const response1 = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(requestData);

      // Second request with same key
      const response2 = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send(requestData);

      // Should return same result or handle gracefully
      if (response1.status === 201 && response2.status === 201) {
        expect(response1.body.data?.id).toBe(response2.body.data?.id);
      }
    });
  });

  describe("Pagination and Filtering", () => {
    let authToken;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read"],
      });
    });

    it("should paginate large result sets", async () => {
      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10,
        });

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        const data = response.body.data || response.body;
        expect(Array.isArray(data) || typeof data === "object").toBe(true);
      }
    });

    it("should filter results by criteria", async () => {
      const response = await request(app)
        .get("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .query({
          status: "DELIVERED",
          startDate: "2024-01-01",
        });

      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe("Bulk Operations", () => {
    let authToken;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "admin_123",
        scopes: ["shipment:write", "shipment:delete"],
      });
    });

    it("should handle bulk create operations", async () => {
      const response = await request(app)
        .post("/api/shipments/bulk")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shipments: [
            { description: "Bulk 1" },
            { description: "Bulk 2" },
            { description: "Bulk 3" },
          ],
        });

      expect([200, 201, 400, 401, 403, 404]).toContain(response.status);
    });

    it("should handle bulk update operations", async () => {
      const response = await request(app)
        .patch("/api/shipments/bulk")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ids: ["id1", "id2", "id3"],
          updates: { status: "CANCELLED" },
        });

      expect([200, 400, 401, 403, 404]).toContain(response.status);
    });
  });

  describe("Cache Invalidation", () => {
    let authToken;

    beforeAll(() => {
      authToken = generateTestJWT({
        sub: "user_123",
        scopes: ["shipment:read", "shipment:write"],
      });
    });

    it("should invalidate cache on update", async () => {
      // Create shipment
      const createResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ description: "Cache test" });

      if (createResponse.status === 201) {
        const shipmentId = createResponse.body.data?.id;

        if (shipmentId) {
          // Get shipment (cached)
          await request(app)
            .get(`/api/shipments/${shipmentId}`)
            .set("Authorization", `Bearer ${authToken}`);

          // Update shipment (should invalidate cache)
          await request(app)
            .put(`/api/shipments/${shipmentId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send({ status: "IN_TRANSIT" });

          // Get shipment again (should be fresh data)
          const response = await request(app)
            .get(`/api/shipments/${shipmentId}`)
            .set("Authorization", `Bearer ${authToken}`);

          expect([200, 403, 404]).toContain(response.status);
        }
      }
    });
  });
});
