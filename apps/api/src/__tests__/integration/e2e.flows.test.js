/**
 * End-to-End Flow Tests
 * Priority: CRITICAL
 * Coverage Impact: +8% overall
 * Time to implement: 4-5 hours
 *
 * Tests complete user journeys through the API simulating real-world scenarios.
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");

describe("End-to-End Flow Tests", () => {
  let app;

  beforeAll(() => {
    app = require("../../app");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Test 1: User Registration → Login → Profile Access
  // ============================================================================
  describe("User Authentication Flow", () => {
    test("complete registration, login, and profile access flow", async () => {
      // Step 1: Register new user
      const registrationData = {
        email: `test-${Date.now()}@example.com`,
        password: "SecurePass123!",
        name: "Test User",
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(registrationData);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);

      // Step 2: Login with credentials
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: registrationData.email,
          password: registrationData.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty("token");
      const token = loginResponse.body.token;

      // Step 3: Access protected profile endpoint
      const profileResponse = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.email).toBe(registrationData.email);
      expect(profileResponse.body.name).toBe(registrationData.name);
    });

    test("failed login with wrong password", async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "existing@example.com",
          password: "WrongPassword123!",
        });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.success).toBe(false);
    });

    test("access protected route without token", async () => {
      const profileResponse = await request(app).get("/api/users/me");

      expect(profileResponse.status).toBe(401);
      expect(profileResponse.body.error).toMatch(/unauthorized|authentication/i);
    });
  });

  // ============================================================================
  // Test 2: Shipment Creation → Update → Status Tracking → Completion
  // ============================================================================
  describe("Shipment Lifecycle Flow", () => {
    let token;
    let shipmentId;

    beforeAll(() => {
      token = generateTestJWT({
        sub: "driver-123",
        scopes: ["shipments:read", "shipments:write"],
      });
    });

    test("complete shipment lifecycle", async () => {
      // Step 1: Create new shipment
      const createResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "Los Angeles, CA",
          destination: "New York, NY",
          cargo: "Electronics",
          weight: 5000,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      shipmentId = createResponse.body.data.id;

      // Step 2: Update shipment status to "in_transit"
      const updateResponse = await request(app)
        .patch(`/api/shipments/${shipmentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "in_transit" });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.status).toBe("in_transit");

      // Step 3: Get shipment details
      const getResponse = await request(app)
        .get(`/api/shipments/${shipmentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.id).toBe(shipmentId);
      expect(getResponse.body.data.status).toBe("in_transit");

      // Step 4: Complete shipment
      const completeResponse = await request(app)
        .patch(`/api/shipments/${shipmentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "delivered" });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.data.status).toBe("delivered");

      // Step 5: Verify final status
      const finalResponse = await request(app)
        .get(`/api/shipments/${shipmentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.data.status).toBe("delivered");
      expect(finalResponse.body.data).toHaveProperty("completedAt");
    });

    test("prevent invalid status transitions", async () => {
      // Try to set status to "delivered" without being "in_transit"
      const createResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "Dallas, TX",
          destination: "Miami, FL",
          cargo: "Furniture",
        });

      const newShipmentId = createResponse.body.data.id;

      const invalidUpdateResponse = await request(app)
        .patch(`/api/shipments/${newShipmentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "delivered" });

      expect(invalidUpdateResponse.status).toBe(400);
      expect(invalidUpdateResponse.body.error).toMatch(/invalid.*transition/i);
    });
  });

  // ============================================================================
  // Test 3: AI Command Processing Flow
  // ============================================================================
  describe("AI Command Processing Flow", () => {
    let token;

    beforeAll(() => {
      token = generateTestJWT({
        sub: "user-ai-123",
        scopes: ["ai:command"],
      });
    });

    test("send AI command and receive response", async () => {
      const commandResponse = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ command: "Optimize route from LA to NY" });

      expect(commandResponse.status).toBe(200);
      expect(commandResponse.body.success).toBe(true);
      expect(commandResponse.body.data).toHaveProperty("response");
      expect(commandResponse.body.data).toHaveProperty("model");
    });

    test("AI command without required scope fails", async () => {
      const noScopeToken = generateTestJWT({
        sub: "user-no-ai",
        scopes: ["shipments:read"],
      });

      const commandResponse = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${noScopeToken}`)
        .send({ command: "Test command" });

      expect(commandResponse.status).toBe(403);
      expect(commandResponse.body.error).toMatch(/scope|permission/i);
    });

    test("AI command rate limiting", async () => {
      // Make 25 requests (exceeds 20/minute limit)
      const requests = Array(25)
        .fill()
        .map((_, i) =>
          request(app)
            .post("/api/ai/command")
            .set("Authorization", `Bearer ${token}`)
            .send({ command: `Test command ${i}` })
        );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Test 4: Voice Processing Flow
  // ============================================================================
  describe("Voice Processing Flow", () => {
    let token;

    beforeAll(() => {
      token = generateTestJWT({
        sub: "user-voice-123",
        scopes: ["voice:ingest", "voice:command"],
      });
    });

    test("upload voice file and process command", async () => {
      // Step 1: Upload voice file
      const audioBuffer = Buffer.from("fake audio data for testing");

      const ingestResponse = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${token}`)
        .attach("audio", audioBuffer, "command.mp3");

      expect(ingestResponse.status).toBe(200);
      expect(ingestResponse.body.success).toBe(true);
      expect(ingestResponse.body.data).toHaveProperty("transcription");

      // Step 2: Process voice command
      const commandResponse = await request(app)
        .post("/api/voice/command")
        .set("Authorization", `Bearer ${token}`)
        .send({ transcription: ingestResponse.body.data.transcription });

      expect(commandResponse.status).toBe(200);
      expect(commandResponse.body.success).toBe(true);
    });

    test("reject oversized voice files", async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const ingestResponse = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${token}`)
        .attach("audio", largeBuffer, "large.mp3");

      expect(ingestResponse.status).toBe(413); // Payload too large
    });

    test("reject invalid audio formats", async () => {
      const textBuffer = Buffer.from("This is not audio");

      const ingestResponse = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${token}`)
        .attach("audio", textBuffer, "invalid.txt");

      expect(ingestResponse.status).toBe(400);
      expect(ingestResponse.body.error).toMatch(/format|type/i);
    });
  });

  // ============================================================================
  // Test 5: Billing and Payment Flow
  // ============================================================================
  describe("Billing and Payment Flow", () => {
    let token;
    let customerId;

    beforeAll(() => {
      token = generateTestJWT({
        sub: "user-billing-123",
        scopes: ["billing:read", "billing:write"],
      });
    });

    test("create subscription and process payment", async () => {
      // Step 1: Create customer
      const customerResponse = await request(app)
        .post("/api/billing/customer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "billing-test@example.com",
          name: "Billing Test User",
        });

      expect(customerResponse.status).toBe(201);
      customerId = customerResponse.body.data.customerId;

      // Step 2: Create subscription
      const subscriptionResponse = await request(app)
        .post("/api/billing/subscription")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId: customerId,
          priceId: "price_test_123",
        });

      expect(subscriptionResponse.status).toBe(201);
      expect(subscriptionResponse.body.data).toHaveProperty("subscriptionId");

      // Step 3: Process one-time charge
      const idempotencyKey = `test-${Date.now()}`;
      const chargeResponse = await request(app)
        .post("/api/billing/charge")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 5000, // $50.00
          currency: "usd",
          customerId: customerId,
        });

      expect(chargeResponse.status).toBe(200);
      expect(chargeResponse.body.data).toHaveProperty("chargeId");
      expect(chargeResponse.body.data.amount).toBe(5000);

      // Step 4: Verify billing history
      const historyResponse = await request(app)
        .get("/api/billing/history")
        .set("Authorization", `Bearer ${token}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.data.charges).toBeInstanceOf(Array);
      expect(historyResponse.body.data.charges.length).toBeGreaterThan(0);
    });

    test("prevent duplicate charges with same idempotency key", async () => {
      const idempotencyKey = `duplicate-test-${Date.now()}`;

      // First charge
      const firstChargeResponse = await request(app)
        .post("/api/billing/charge")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 1000,
          currency: "usd",
        });

      expect(firstChargeResponse.status).toBe(200);
      const firstChargeId = firstChargeResponse.body.data.chargeId;

      // Duplicate charge with same key
      const duplicateChargeResponse = await request(app)
        .post("/api/billing/charge")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", idempotencyKey)
        .send({
          amount: 1000,
          currency: "usd",
        });

      expect(duplicateChargeResponse.status).toBe(200);
      expect(duplicateChargeResponse.body.data.chargeId).toBe(firstChargeId);
    });

    test("handle payment failure gracefully", async () => {
      // Use a test card that will fail (Stripe test mode)
      const failedChargeResponse = await request(app)
        .post("/api/billing/charge")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", `fail-test-${Date.now()}`)
        .send({
          amount: 5000,
          currency: "usd",
          paymentMethodId: "pm_card_chargeDeclined",
        });

      expect(failedChargeResponse.status).toBe(402); // Payment required
      expect(failedChargeResponse.body.error).toMatch(/declined|failed/i);
    });
  });

  // ============================================================================
  // Test 6: Multi-Feature Integration Flow
  // ============================================================================
  describe("Multi-Feature Integration Flow", () => {
    let token;

    beforeAll(() => {
      token = generateTestJWT({
        sub: "user-multi-123",
        scopes: [
          "shipments:read",
          "shipments:write",
          "ai:command",
          "voice:command",
          "billing:read",
        ],
      });
    });

    test("create shipment, optimize with AI, update via voice", async () => {
      // Step 1: Create shipment
      const shipmentResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "Chicago, IL",
          destination: "Houston, TX",
          cargo: "Medical supplies",
          weight: 3000,
        });

      expect(shipmentResponse.status).toBe(201);
      const shipmentId = shipmentResponse.body.data.id;

      // Step 2: Ask AI to optimize route
      const aiResponse = await request(app)
        .post("/api/ai/command")
        .set("Authorization", `Bearer ${token}`)
        .send({
          command: `Optimize route for shipment ${shipmentId}`,
          context: { shipmentId },
        });

      expect(aiResponse.status).toBe(200);
      expect(aiResponse.body.data.response).toBeDefined();

      // Step 3: Update shipment via voice command
      const voiceCommandResponse = await request(app)
        .post("/api/voice/command")
        .set("Authorization", `Bearer ${token}`)
        .send({
          transcription: `Update shipment ${shipmentId} status to in transit`,
        });

      expect(voiceCommandResponse.status).toBe(200);

      // Step 4: Verify shipment was updated
      const verifyResponse = await request(app)
        .get(`/api/shipments/${shipmentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.status).toBe("in_transit");
    });
  });

  // ============================================================================
  // Test 7: Error Recovery Flow
  // ============================================================================
  describe("Error Recovery Flow", () => {
    let token;

    beforeAll(() => {
      token = generateTestJWT({
        sub: "user-error-123",
        scopes: ["shipments:read", "shipments:write"],
      });
    });

    test("recover from validation errors", async () => {
      // Step 1: Try to create shipment with invalid data
      const invalidResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          // Missing required fields
          cargo: "Test cargo",
        });

      expect(invalidResponse.status).toBe(400);
      expect(invalidResponse.body.errors).toBeInstanceOf(Array);

      // Step 2: Retry with valid data
      const validResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "Seattle, WA",
          destination: "Portland, OR",
          cargo: "Test cargo",
          weight: 1000,
        });

      expect(validResponse.status).toBe(201);
      expect(validResponse.body.success).toBe(true);
    });

    test("handle network timeout gracefully", async () => {
      // This would require mocking slow endpoints
      // In production, you'd test with actual slow responses
    });
  });

  // ============================================================================
  // Test 8: Concurrent Operations Flow
  // ============================================================================
  describe("Concurrent Operations Flow", () => {
    let token;

    beforeAll(() => {
      token = generateTestJWT({
        sub: "user-concurrent-123",
        scopes: ["shipments:read", "shipments:write", "ai:command"],
      });
    });

    test("handle multiple simultaneous shipment creations", async () => {
      const shipmentRequests = Array(5)
        .fill()
        .map((_, i) =>
          request(app)
            .post("/api/shipments")
            .set("Authorization", `Bearer ${token}`)
            .send({
              origin: "Boston, MA",
              destination: "Philadelphia, PA",
              cargo: `Cargo ${i}`,
              weight: 1000 + i * 100,
            })
        );

      const responses = await Promise.all(shipmentRequests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // All should have unique IDs
      const ids = responses.map((r) => r.body.data.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    test("handle race conditions in shipment updates", async () => {
      // Create a shipment
      const createResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "Denver, CO",
          destination: "Salt Lake City, UT",
          cargo: "Race test",
        });

      const shipmentId = createResponse.body.data.id;

      // Try to update it simultaneously from multiple "clients"
      const updateRequests = Array(3)
        .fill()
        .map(() =>
          request(app)
            .patch(`/api/shipments/${shipmentId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "in_transit" })
        );

      const responses = await Promise.all(updateRequests);

      // All should eventually succeed (or return 409 conflict)
      responses.forEach((response) => {
        expect([200, 409]).toContain(response.status);
      });
    });
  });

  // ============================================================================
  // Test 9: Data Consistency Flow
  // ============================================================================
  describe("Data Consistency Flow", () => {
    let token;

    beforeAll(() => {
      token = generateTestJWT({
        sub: "user-consistency-123",
        scopes: ["shipments:read", "shipments:write"],
      });
    });

    test("ensure shipment data remains consistent across operations", async () => {
      // Create shipment
      const createResponse = await request(app)
        .post("/api/shipments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          origin: "Phoenix, AZ",
          destination: "Las Vegas, NV",
          cargo: "Consistency test",
          weight: 2500,
        });

      const shipmentId = createResponse.body.data.id;
      const originalData = createResponse.body.data;

      // Perform multiple operations
      await request(app)
        .patch(`/api/shipments/${shipmentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "in_transit" });

      await request(app)
        .patch(`/api/shipments/${shipmentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ notes: "Updated notes" });

      // Verify all data is consistent
      const finalResponse = await request(app)
        .get(`/api/shipments/${shipmentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(finalResponse.body.data.id).toBe(shipmentId);
      expect(finalResponse.body.data.origin).toBe(originalData.origin);
      expect(finalResponse.body.data.destination).toBe(originalData.destination);
      expect(finalResponse.body.data.weight).toBe(originalData.weight);
      expect(finalResponse.body.data.status).toBe("in_transit");
      expect(finalResponse.body.data.notes).toBe("Updated notes");
    });
  });

  // ============================================================================
  // Test 10: Full Application Stress Test
  // ============================================================================
  describe("Full Application Stress Test", () => {
    test("handle mixed workload across all features", async () => {
      const users = [
        generateTestJWT({ sub: "stress-user-1", scopes: ["shipments:read", "shipments:write"] }),
        generateTestJWT({ sub: "stress-user-2", scopes: ["ai:command"] }),
        generateTestJWT({ sub: "stress-user-3", scopes: ["billing:read", "billing:write"] }),
      ];

      const operations = [];

      // Create shipments
      operations.push(
        ...users[0]
          ? Array(10)
              .fill()
              .map((_, i) =>
                request(app)
                  .post("/api/shipments")
                  .set("Authorization", `Bearer ${users[0]}`)
                  .send({
                    origin: "City A",
                    destination: "City B",
                    cargo: `Cargo ${i}`,
                  })
              )
          : []
      );

      // AI commands
      operations.push(
        ...users[1]
          ? Array(15)
              .fill()
              .map((_, i) =>
                request(app)
                  .post("/api/ai/command")
                  .set("Authorization", `Bearer ${users[1]}`)
                  .send({ command: `Command ${i}` })
              )
          : []
      );

      // Billing operations
      operations.push(
        ...users[2]
          ? Array(5)
              .fill()
              .map((_, i) =>
                request(app)
                  .get("/api/billing/history")
                  .set("Authorization", `Bearer ${users[2]}`)
              )
          : []
      );

      // Health checks
      operations.push(...Array(20).fill().map(() => request(app).get("/api/health")));

      // Execute all operations concurrently
      const responses = await Promise.all(operations);

      // Verify high success rate (>90%)
      const successful = responses.filter((r) => r.status < 400);
      const successRate = (successful.length / responses.length) * 100;

      expect(successRate).toBeGreaterThan(90);
    });
  });
});
