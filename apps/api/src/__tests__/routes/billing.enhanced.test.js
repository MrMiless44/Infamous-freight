/**
 * Billing Integration Tests - Enhanced
 * Priority: CRITICAL
 * Coverage Impact: +9% overall
 * Time to implement: 3-4 hours
 *
 * Tests Stripe integration, idempotency, webhooks, and payment flows.
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");
const stripe = require("../../services/stripe");

jest.mock("../../services/stripe");

describe("Billing Integration - Enhanced Tests", () => {
    let app;

    beforeAll(() => {
        app = require("../../app");
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // Test 1: Idempotency Key
    // ============================================================================
    describe("Idempotency Key Handling", () => {
        test("should prevent duplicate charges with same idempotency key", async () => {
            const idempotencyKey = "test-key-123";
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest.fn().mockResolvedValue({
                id: "ch_123",
                amount: 1000,
                status: "succeeded",
            });

            // First request
            const response1 = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", idempotencyKey)
                .send({ amount: 1000 })
                .expect(200);

            // Second request with same key
            const response2 = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", idempotencyKey)
                .send({ amount: 1000 })
                .expect(200);

            // Should return same charge ID
            expect(response1.body.chargeId).toBe(response2.body.chargeId);

            // Stripe should only be called once
            expect(stripe.charges.create).toHaveBeenCalledTimes(1);
        });

        test("should allow different charges with different idempotency keys", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest
                .fn()
                .mockResolvedValueOnce({ id: "ch_123", amount: 1000, status: "succeeded" })
                .mockResolvedValueOnce({ id: "ch_456", amount: 1000, status: "succeeded" });

            // First request
            const response1 = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "key-1")
                .send({ amount: 1000 })
                .expect(200);

            // Second request with different key
            const response2 = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "key-2")
                .send({ amount: 1000 })
                .expect(200);

            // Should create two different charges
            expect(response1.body.chargeId).not.toBe(response2.body.chargeId);
            expect(stripe.charges.create).toHaveBeenCalledTimes(2);
        });
    });

    // ============================================================================
    // Test 2: Stripe Error Handling
    // ============================================================================
    describe("Stripe Error Handling", () => {
        test("should handle card declined errors", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest.fn().mockRejectedValue(
                new Error("Your card was declined")
            );

            const response = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "test-key")
                .send({ amount: 1000 })
                .expect(402);

            expect(response.body.error).toMatch(/payment|declined|card/i);
        });

        test("should handle insufficient funds errors", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest.fn().mockRejectedValue(
                new Error("Insufficient funds")
            );

            const response = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "test-key")
                .send({ amount: 1000 })
                .expect(402);

            expect(response.body.error).toMatch(/insufficient|funds/i);
        });

        test("should handle expired card errors", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest.fn().mockRejectedValue(
                new Error("Your card has expired")
            );

            const response = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "test-key")
                .send({ amount: 1000 })
                .expect(402);

            expect(response.body.error).toMatch(/expired|card/i);
        });
    });

    // ============================================================================
    // Test 3: Webhook Signature Verification
    // ============================================================================
    describe("Webhook Signature Verification", () => {
        test("should accept valid webhook signatures", async () => {
            const validSignature = "valid-signature-from-stripe";

            stripe.webhooks.constructEvent = jest.fn().mockReturnValue({
                type: "charge.succeeded",
                data: { object: { id: "ch_123" } },
            });

            const response = await request(app)
                .post("/api/billing/webhook")
                .set("Stripe-Signature", validSignature)
                .send({
                    type: "charge.succeeded",
                    data: { object: { id: "ch_123" } },
                })
                .expect(200);

            expect(stripe.webhooks.constructEvent).toHaveBeenCalled();
        });

        test("should reject invalid webhook signatures", async () => {
            const invalidSignature = "invalid-signature";

            stripe.webhooks.constructEvent = jest.fn().mockImplementation(() => {
                throw new Error("Invalid signature");
            });

            const response = await request(app)
                .post("/api/billing/webhook")
                .set("Stripe-Signature", invalidSignature)
                .send({
                    type: "charge.succeeded",
                    data: { object: { id: "ch_123" } },
                })
                .expect(400);

            expect(response.body.error).toMatch(/signature|invalid/i);
        });

        test("should require Stripe-Signature header", async () => {
            const response = await request(app)
                .post("/api/billing/webhook")
                .send({ type: "charge.succeeded" })
                .expect(400);

            expect(response.body.error).toMatch(/signature/i);
        });
    });

    // ============================================================================
    // Test 4: Subscription Management
    // ============================================================================
    describe("Subscription Management", () => {
        test("should create new subscription", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.subscriptions.create = jest.fn().mockResolvedValue({
                id: "sub_123",
                status: "active",
                plan: "premium",
            });

            const response = await request(app)
                .post("/api/billing/subscription")
                .set("Authorization", `Bearer ${token}`)
                .send({ plan: "premium" })
                .expect(200);

            expect(response.body.subscriptionId).toBe("sub_123");
            expect(stripe.subscriptions.create).toHaveBeenCalledWith(
                expect.objectContaining({ plan: "premium" })
            );
        });

        test("should retrieve existing subscription", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:read"] });

            stripe.subscriptions.retrieve = jest.fn().mockResolvedValue({
                id: "sub_123",
                status: "active",
                plan: "premium",
            });

            const response = await request(app)
                .get("/api/billing/subscription")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.subscription).toBeDefined();
        });

        test("should cancel subscription", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.subscriptions.del = jest.fn().mockResolvedValue({
                id: "sub_123",
                status: "canceled",
            });

            const response = await request(app)
                .delete("/api/billing/subscription")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(stripe.subscriptions.del).toHaveBeenCalled();
        });
    });

    // ============================================================================
    // Test 5: Payment Method Management
    // ============================================================================
    describe("Payment Method Management", () => {
        test("should add payment method", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.paymentMethods.attach = jest.fn().mockResolvedValue({
                id: "pm_123",
                type: "card",
            });

            const response = await request(app)
                .post("/api/billing/payment-methods")
                .set("Authorization", `Bearer ${token}`)
                .send({ paymentMethodId: "pm_123" })
                .expect(200);

            expect(stripe.paymentMethods.attach).toHaveBeenCalled();
        });

        test("should list payment methods", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:read"] });

            stripe.paymentMethods.list = jest.fn().mockResolvedValue({
                data: [
                    { id: "pm_123", type: "card" },
                    { id: "pm_456", type: "card" },
                ],
            });

            const response = await request(app)
                .get("/api/billing/payment-methods")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.paymentMethods).toHaveLength(2);
        });
    });

    // ============================================================================
    // Test 6: Billing Rate Limiting
    // ============================================================================
    describe("Billing Rate Limiting", () => {
        test("should enforce rate limits on billing endpoints", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest.fn().mockResolvedValue({
                id: "ch_123",
                status: "succeeded",
            });

            // Make 35 requests (limit is 30/15min)
            const requests = [];
            for (let i = 0; i < 35; i++) {
                requests.push(
                    request(app)
                        .post("/api/billing/charge")
                        .set("Authorization", `Bearer ${token}`)
                        .set("Idempotency-Key", `key-${i}`)
                        .send({ amount: 1000 })
                );
            }

            const responses = await Promise.all(requests);

            // Some should be rate limited
            const rateLimited = responses.filter((r) => r.status === 429);
            expect(rateLimited.length).toBeGreaterThan(0);
        });
    });

    // ============================================================================
    // Test 7: Amount Validation
    // ============================================================================
    describe("Amount Validation", () => {
        test("should reject negative amounts", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            const response = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "test-key")
                .send({ amount: -100 })
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });

        test("should reject zero amounts", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            const response = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "test-key")
                .send({ amount: 0 })
                .expect(400);
        });

        test("should accept valid amounts", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest.fn().mockResolvedValue({
                id: "ch_123",
                amount: 1000,
                status: "succeeded",
            });

            const response = await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "test-key")
                .send({ amount: 1000 })
                .expect(200);

            expect(stripe.charges.create).toHaveBeenCalledWith(
                expect.objectContaining({ amount: 1000 })
            );
        });
    });

    // ============================================================================
    // Test 8: Currency Handling
    // ============================================================================
    describe("Currency Handling", () => {
        test("should default to USD if no currency specified", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest.fn().mockResolvedValue({
                id: "ch_123",
                currency: "usd",
            });

            await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "test-key")
                .send({ amount: 1000 })
                .expect(200);

            expect(stripe.charges.create).toHaveBeenCalledWith(
                expect.objectContaining({ currency: "usd" })
            );
        });

        test("should accept different currencies", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.charges.create = jest.fn().mockResolvedValue({
                id: "ch_123",
                currency: "eur",
            });

            await request(app)
                .post("/api/billing/charge")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "test-key")
                .send({ amount: 1000, currency: "eur" })
                .expect(200);

            expect(stripe.charges.create).toHaveBeenCalledWith(
                expect.objectContaining({ currency: "eur" })
            );
        });
    });

    // ============================================================================
    // Test 9: Refund Processing
    // ============================================================================
    describe("Refund Processing", () => {
        test("should process full refund", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.refunds.create = jest.fn().mockResolvedValue({
                id: "re_123",
                amount: 1000,
                status: "succeeded",
            });

            const response = await request(app)
                .post("/api/billing/refund")
                .set("Authorization", `Bearer ${token}`)
                .send({ chargeId: "ch_123" })
                .expect(200);

            expect(response.body.refundId).toBe("re_123");
        });

        test("should process partial refund", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:write"] });

            stripe.refunds.create = jest.fn().mockResolvedValue({
                id: "re_123",
                amount: 500,
                status: "succeeded",
            });

            const response = await request(app)
                .post("/api/billing/refund")
                .set("Authorization", `Bearer ${token}`)
                .send({ chargeId: "ch_123", amount: 500 })
                .expect(200);

            expect(stripe.refunds.create).toHaveBeenCalledWith(
                expect.objectContaining({ amount: 500 })
            );
        });
    });

    // ============================================================================
    // Test 10: Billing History
    // ============================================================================
    describe("Billing History", () => {
        test("should retrieve billing history", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:read"] });

            stripe.charges.list = jest.fn().mockResolvedValue({
                data: [
                    { id: "ch_123", amount: 1000 },
                    { id: "ch_456", amount: 2000 },
                ],
            });

            const response = await request(app)
                .get("/api/billing/history")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.charges).toHaveLength(2);
        });

        test("should paginate billing history", async () => {
            const token = generateTestJWT({ sub: "user-123", scopes: ["billing:read"] });

            stripe.charges.list = jest.fn().mockResolvedValue({
                data: Array(10).fill({ id: "ch_123", amount: 1000 }),
                has_more: true,
            });

            const response = await request(app)
                .get("/api/billing/history?limit=10")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.charges).toHaveLength(10);
            expect(response.body.hasMore).toBe(true);
        });
    });
});
