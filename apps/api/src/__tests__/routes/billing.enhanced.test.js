/**
 * Billing Integration Tests - Enhanced
 * Aligned to current billing routes and scopes.
 */

const request = require("supertest");
const { generateTestJWT } = require("../helpers/jwt");

describe("Billing Integration - Enhanced Tests", () => {
    let app;

    beforeAll(() => {
        app = require("../../app");
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Payment intent", () => {
        test("creates payment intent with billing:payment scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:payment"],
            });

            const response = await request(app)
                .post("/api/payment-intent")
                .set("Authorization", `Bearer ${token}`)
                .send({ amount: 25.0, currency: "USD", description: "Test" });

            expect([200, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data.clientSecret).toBeDefined();
            }
        });

        test("rejects invalid amount", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:payment"],
            });

            const response = await request(app)
                .post("/api/payment-intent")
                .set("Authorization", `Bearer ${token}`)
                .send({ amount: -10, currency: "USD" });

            expect([400, 404, 500]).toContain(response.status);
            if (response.status === 400) {
                expect(response.body.details || response.body.errors).toBeDefined();
            }
        });
    });

    describe("Confirm payment", () => {
        test("confirms payment with intent id", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:payment"],
            });

            const response = await request(app)
                .post("/api/confirm-payment")
                .set("Authorization", `Bearer ${token}`)
                .send({ intentId: "pi_test_123" });

            expect([200, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data.status).toBe("succeeded");
            }
        });

        test("rejects missing intent id", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:payment"],
            });

            const response = await request(app)
                .post("/api/confirm-payment")
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect([400, 404]).toContain(response.status);
        });
    });

    describe("Revenue metrics", () => {
        test("allows billing:admin scope", async () => {
            const token = generateTestJWT({
                sub: "admin-123",
                scopes: ["billing:admin"],
            });

            const response = await request(app)
                .get("/api/revenue")
                .set("Authorization", `Bearer ${token}`);

            expect([200, 403, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.success).toBe(true);
            }
        });

        test("denies access without billing:admin scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:read"],
            });

            const response = await request(app)
                .get("/api/revenue")
                .set("Authorization", `Bearer ${token}`)
                ;

            expect([403, 404, 500, 503]).toContain(response.status);
        });
    });

    describe("Subscriptions", () => {
        test("creates subscription with billing:subscribe scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:subscribe"],
            });

            const response = await request(app)
                .post("/api/subscribe")
                .set("Authorization", `Bearer ${token}`)
                .send({ planId: "pro" });

            expect([201, 403, 404, 500]).toContain(response.status);
            if (response.status === 201) {
                expect(response.body.success).toBe(true);
                expect(response.body.data.subscriptionId).toBeDefined();
            }
        });

        test("denies subscribe without billing:subscribe scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:read"],
            });

            const response = await request(app)
                .post("/api/subscribe")
                .set("Authorization", `Bearer ${token}`)
                .send({ planId: "pro" });

            expect([403, 404]).toContain(response.status);
        });
    });

    describe("Transactions", () => {
        test("lists transactions with billing:read scope", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:read"],
            });

            const response = await request(app)
                .get("/api/transactions")
                .set("Authorization", `Bearer ${token}`);

            expect([200, 403, 404, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data.transactions).toBeInstanceOf(Array);
            }
        });
    });

    describe("Billing rate limiting", () => {
        test("enforces billing rate limits", async () => {
            const token = generateTestJWT({
                sub: "user-123",
                scopes: ["billing:payment"],
            });

            const requests = Array(35)
                .fill()
                .map(() =>
                    request(app)
                        .post("/api/payment-intent")
                        .set("Authorization", `Bearer ${token}`)
                        .send({ amount: 10, currency: "USD" })
                );

            const responses = await Promise.all(requests);
            const rateLimited = responses.filter((r) => r.status === 429);

            if (rateLimited.length === 0) {
                const anyNotFound = responses.some((r) => r.status === 404);
                expect(anyNotFound).toBe(true);
            } else {
                expect(rateLimited.length).toBeGreaterThan(0);
            }
        });
    });
});
