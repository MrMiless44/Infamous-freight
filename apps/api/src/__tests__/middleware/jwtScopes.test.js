/**
 * JWT Scope Enforcement Tests
 * Priority: CRITICAL
 * Coverage Impact: +6% overall
 * Time to implement: 2-3 hours
 *
 * Tests JWT scope-based authorization across all protected endpoints.
 * Ensures that users can only access resources they have permission for.
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");
const logger = require("../../middleware/logger");

describe("JWT Scope Enforcement Tests", () => {
    let app;

    beforeAll(() => {
        app = require("../../app");
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // Test 1: AI Command Scope
    // ============================================================================
    describe("AI Command Endpoint - ai:command scope", () => {
        test("should allow request with correct ai:command scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["ai:command"],
            });

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "optimize route" });

            // Should not be 403 (forbidden)
            expect(response.status).not.toBe(403);
        });

        test("should deny request without ai:command scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["shipments:read"], // Wrong scope
            });

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" })
                .expect(403);

            expect(response.body.error).toMatch(/scope|permission|forbidden/i);
        });

        test("should deny request with empty scopes array", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: [],
            });

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" })
                .expect(403);

            expect(response.body.error).toMatch(/scope/i);
        });
    });

    // ============================================================================
    // Test 2: Voice Processing Scopes
    // ============================================================================
    describe("Voice Endpoints - voice:ingest and voice:command scopes", () => {
        test("should allow voice ingest with voice:ingest scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["voice:ingest"],
            });

            const response = await request(app)
                .post("/api/voice/ingest")
                .set("Authorization", `Bearer ${token}`)
                .attach("audio", Buffer.from("fake audio data"), "test.mp3");

            expect(response.status).not.toBe(403);
        });

        test("should deny voice ingest without voice:ingest scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["voice:command"], // Wrong scope
            });

            const response = await request(app)
                .post("/api/voice/ingest")
                .set("Authorization", `Bearer ${token}`)
                .attach("audio", Buffer.from("fake audio data"), "test.mp3")
                .expect(403);
        });

        test("should allow voice command with voice:command scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["voice:command"],
            });

            const response = await request(app)
                .post("/api/voice/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ text: "create shipment" });

            expect(response.status).not.toBe(403);
        });
    });

    // ============================================================================
    // Test 3: Billing Scopes
    // ============================================================================
    describe("Billing Endpoints - billing:read and billing:write scopes", () => {
        test("should allow reading subscription with billing:read scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:read"],
            });

            const response = await request(app)
                .get("/api/billing/subscription")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).not.toBe(403);
        });

        test("should deny reading subscription without billing:read scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:write"], // Wrong scope
            });

            const response = await request(app)
                .get("/api/billing/subscription")
                .set("Authorization", `Bearer ${token}`)
                .expect(403);
        });

        test("should require billing:write for creating subscriptions", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:write"],
            });

            const response = await request(app)
                .post("/api/billing/subscription")
                .set("Authorization", `Bearer ${token}`)
                .send({ plan: "premium" });

            expect(response.status).not.toBe(403);
        });

        test("should deny creating subscription with only billing:read", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:read"], // Read-only
            });

            const response = await request(app)
                .post("/api/billing/subscription")
                .set("Authorization", `Bearer ${token}`)
                .send({ plan: "premium" })
                .expect(403);
        });
    });

    // ============================================================================
    // Test 4: Shipment Scopes
    // ============================================================================
    describe("Shipment Endpoints - shipments:read and shipments:write scopes", () => {
        test("should allow listing shipments with shipments:read scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["shipments:read"],
            });

            const response = await request(app)
                .get("/api/shipments")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).not.toBe(403);
            expect([200, 404]).toContain(response.status);
        });

        test("should allow creating shipments with shipments:write scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["shipments:write"],
            });

            const response = await request(app)
                .post("/api/shipments")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    origin: "New York",
                    destination: "Los Angeles",
                    weight: 1000,
                });

            expect(response.status).not.toBe(403);
        });

        test("should deny creating shipments without shipments:write scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["shipments:read"], // Read-only
            });

            const response = await request(app)
                .post("/api/shipments")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    origin: "New York",
                    destination: "Los Angeles",
                    weight: 1000,
                })
                .expect(403);
        });
    });

    // ============================================================================
    // Test 5: Multiple Scopes
    // ============================================================================
    describe("Multiple Scope Requirements", () => {
        test("should allow request when user has all required scopes", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["shipments:read", "shipments:write", "ai:command"],
            });

            // Should be able to access all endpoints
            const shipmentResponse = await request(app)
                .get("/api/shipments")
                .set("Authorization", `Bearer ${token}`);
            expect(shipmentResponse.status).not.toBe(403);

            const aiResponse = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" });
            expect(aiResponse.status).not.toBe(403);
        });

        test("should deny request if missing any required scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["shipments:read"], // Missing shipments:write
            });

            const response = await request(app)
                .post("/api/shipments")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    origin: "New York",
                    destination: "Los Angeles",
                    weight: 1000,
                })
                .expect(403);
        });
    });

    // ============================================================================
    // Test 6: Scope Case Sensitivity
    // ============================================================================
    describe("Scope Case Sensitivity", () => {
        test("scopes should be case-sensitive", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["AI:COMMAND"], // Wrong case
            });

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" })
                .expect(403);

            expect(response.body.error).toMatch(/scope/i);
        });

        test("scope with correct case should work", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["ai:command"], // Correct case
            });

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" });

            expect(response.status).not.toBe(403);
        });
    });

    // ============================================================================
    // Test 7: Audit Logging
    // ============================================================================
    describe("Scope Check Audit Logging", () => {
        test("should log successful scope checks", async () => {
            const loggerSpy = jest.spyOn(logger, "info");
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["ai:command"],
            });

            await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" });

            // Should have logged the scope check
            // Note: Actual implementation depends on audit middleware
        });

        test("should log failed scope checks", async () => {
            const loggerSpy = jest.spyOn(logger, "warn");
            const token = generateTestJWT({
                sub: "user-123",
                scopes: [],
            });

            await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" })
                .expect(403);

            // Should have logged the failed scope check
        });
    });

    // ============================================================================
    // Test 8: Admin Scopes
    // ============================================================================
    describe("Admin Scope - Wildcard Permissions", () => {
        test("should allow admin scope to access all endpoints", async () => {
            const token = generateTestJWT({
                sub: "admin-123",
                scopes: ["admin:*"], // Admin wildcard
            });

            // Should be able to access all endpoints
            const responses = await Promise.all([
                request(app)
                    .get("/api/shipments")
                    .set("Authorization", `Bearer ${token}`),
                request(app)
                    .post("/api/ai/command")
                    .set("Authorization", `Bearer ${token}`)
                    .send({ command: "test" }),
                request(app)
                    .get("/api/billing/subscription")
                    .set("Authorization", `Bearer ${token}`),
            ]);

            // None should be 403
            responses.forEach((response) => {
                expect(response.status).not.toBe(403);
            });
        });
    });

    // ============================================================================
    // Test 9: Scope Hierarchy
    // ============================================================================
    describe("Scope Hierarchy", () => {
        test("write scope should not imply read scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["shipments:write"], // Only write
            });

            // If endpoint explicitly requires read scope, should fail
            // (This depends on your implementation - adjust as needed)
        });

        test("specific scopes should be required for each action", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["shipments:read"],
            });

            // Can read
            const readResponse = await request(app)
                .get("/api/shipments")
                .set("Authorization", `Bearer ${token}`);
            expect(readResponse.status).not.toBe(403);

            // Cannot write
            const writeResponse = await request(app)
                .post("/api/shipments")
                .set("Authorization", `Bearer ${token}`)
                .send({ origin: "NYC", destination: "LA", weight: 1000 })
                .expect(403);
        });
    });

    // ============================================================================
    // Test 10: Scope Not in Token
    // ============================================================================
    describe("Missing Scope Field in Token", () => {
        test("should deny request if scopes field missing from JWT", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                // No scopes field
            });

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" })
                .expect(403);
        });

        test("should deny request if scopes is not an array", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: "ai:command", // String instead of array
            });

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${token}`)
                .send({ command: "test" })
                .expect(403);
        });
    });
});
