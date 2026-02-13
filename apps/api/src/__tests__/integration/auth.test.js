const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../app");

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("Authentication & Authorization Integration Tests", () => {
    let validToken;
    let limitedToken;

    beforeAll(() => {
        validToken = jwt.sign(
            {
                sub: "user-123",
                email: "test@example.com",
                role: "shipper",
                scopes: ["ai:command"],
            },
            JWT_SECRET,
            { expiresIn: "1h" },
        );

        limitedToken = jwt.sign(
            {
                sub: "user-456",
                role: "driver",
                scopes: [],
            },
            JWT_SECRET,
            { expiresIn: "1h" },
        );
    });

    describe("Bearer Token Authentication", () => {
        it("accepts valid Bearer token", async () => {
            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${validToken}`)
                .send({ command: "ping" })
                .expect(200);

            expect(response.body.ok).toBe(true);
        });

        it("rejects missing Authorization header", async () => {
            const response = await request(app)
                .post("/api/ai/command")
                .send({ command: "ping" })
                .expect(401);

            expect(response.body.error).toMatch(/Missing bearer token|Invalid/i);
        });

        it("rejects malformed Bearer token", async () => {
            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", "Bearer invalid-token")
                .send({ command: "ping" })
                .expect(401);

            expect(response.body.error).toMatch(/Invalid|expired/i);
        });

        it("rejects expired tokens", async () => {
            const expiredToken = jwt.sign(
                { sub: "user-123", email: "test@example.com" },
                JWT_SECRET,
                { expiresIn: "-1h" },
            );

            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${expiredToken}`)
                .send({ command: "ping" })
                .expect(401);

            expect(response.body.error).toMatch(/expired/i);
        });

        it("accepts x-user-id header for /v1/auth/me", async () => {
            const response = await request(app)
                .get("/v1/auth/me")
                .set("x-user-id", "dev-user-123")
                .expect(200);

            expect(response.body.ok).toBe(true);
            expect(response.body.userId).toBe("dev-user-123");
        });
    });

    describe("Scope-Based Authorization", () => {
        it("allows scope access to AI command", async () => {
            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${validToken}`)
                .send({ command: "ping" })
                .expect(200);

            expect(response.body.ok).toBe(true);
        });

        it("rejects access without required scope", async () => {
            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${limitedToken}`)
                .send({ command: "ping" })
                .expect(403);

            expect(response.body.error).toMatch(/Insufficient scope/i);
        });
    });

    describe("Correlation ID Tracking", () => {
        it("generates correlation ID if not provided", async () => {
            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${validToken}`)
                .send({ command: "ping" })
                .expect(200);

            expect(response.headers["x-correlation-id"]).toBeDefined();
        });

        it("uses provided correlation ID", async () => {
            const correlationId = "test-correlation-123";
            const response = await request(app)
                .post("/api/ai/command")
                .set("Authorization", `Bearer ${validToken}`)
                .set("x-correlation-id", correlationId)
                .send({ command: "ping" })
                .expect(200);

            expect(response.headers["x-correlation-id"]).toBe(correlationId);
        });

        it("includes correlation ID in error responses", async () => {
            const correlationId = "test-error-correlation-456";
            const response = await request(app)
                .post("/api/ai/command")
                .set("x-correlation-id", correlationId)
                .send({ command: "ping" })
                .expect(401);

            expect(response.headers["x-correlation-id"]).toBe(correlationId);
        });
    });

    describe("Rate Limiting", () => {
        it("rate limits repeated AI command requests", async () => {
            const rateLimitToken = jwt.sign(
                { sub: "rate-limit-user", scopes: ["ai:command"] },
                JWT_SECRET,
                { expiresIn: "1h" },
            );

            const requests = [];
            for (let i = 0; i < 25; i += 1) {
                requests.push(
                    request(app)
                        .post("/api/ai/command")
                        .set("Authorization", `Bearer ${rateLimitToken}`)
                        .send({ command: "ping" }),
                );
            }

            const responses = await Promise.all(requests);
            const lastResponse = responses[responses.length - 1];

            expect(lastResponse.status).toBe(429);
            expect(lastResponse.body.error).toMatch(/rate limit|exceeded|Too many/i);
        });
    });
});
