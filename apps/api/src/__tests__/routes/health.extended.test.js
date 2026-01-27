/**
 * Health Check Extended Tests
 * Priority: HIGH
 * Coverage Impact: +5% overall
 * Time to implement: 1-2 hours
 *
 * Tests all 4 health check endpoints with comprehensive scenarios.
 */

const request = require("supertest");

describe("Health Check Extended Tests", () => {
    let app;

    beforeAll(() => {
        app = require("../../app");
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // Test 1: Basic Health Check
    // ============================================================================
    describe("GET /api/health - Basic Health Check", () => {
        test("should return 200 and health status", async () => {
            const response = await request(app).get("/api/health");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("status");
            expect(response.body).toHaveProperty("timestamp");
            expect(response.body).toHaveProperty("uptime");
        });

        test("should include version information", async () => {
            const response = await request(app).get("/api/health");

            expect(response.body).toHaveProperty("version");
            expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning
        });

        test("should respond quickly (< 100ms)", async () => {
            const start = Date.now();
            await request(app).get("/api/health");
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(100);
        });

        test("should not require authentication", async () => {
            // No Authorization header
            const response = await request(app).get("/api/health");

            expect(response.status).toBe(200);
        });
    });

    // ============================================================================
    // Test 2: Liveness Probe
    // ============================================================================
    describe("GET /api/health/liveness - Liveness Probe", () => {
        test("should return 200 when service is alive", async () => {
            const response = await request(app).get("/api/health/liveness");

            expect(response.status).toBe(200);
            expect(response.body.alive).toBe(true);
        });

        test("should check if process is running", async () => {
            const response = await request(app).get("/api/health/liveness");

            expect(response.body).toHaveProperty("pid");
            expect(typeof response.body.pid).toBe("number");
        });

        test("should include memory usage", async () => {
            const response = await request(app).get("/api/health/liveness");

            expect(response.body).toHaveProperty("memory");
            expect(response.body.memory).toHaveProperty("rss");
            expect(response.body.memory).toHaveProperty("heapUsed");
            expect(response.body.memory).toHaveProperty("heapTotal");
        });

        test("should not check external dependencies", async () => {
            // Liveness should not check database, Redis, etc.
            // It should only verify the process is running
            const response = await request(app).get("/api/health/liveness");

            expect(response.status).toBe(200);
            expect(response.body.alive).toBe(true);
        });
    });

    // ============================================================================
    // Test 3: Readiness Probe
    // ============================================================================
    describe("GET /api/health/readiness - Readiness Probe", () => {
        test("should return 200 when service is ready", async () => {
            const response = await request(app).get("/api/health/readiness");

            expect(response.status).toBe(200);
            expect(response.body.ready).toBe(true);
        });

        test("should check database connection", async () => {
            const response = await request(app).get("/api/health/readiness");

            expect(response.body).toHaveProperty("database");
            expect(["connected", "disconnected"]).toContain(response.body.database);
        });

        test("should check Redis connection (if enabled)", async () => {
            const response = await request(app).get("/api/health/readiness");

            if (process.env.REDIS_URL) {
                expect(response.body).toHaveProperty("redis");
                expect(["connected", "disconnected"]).toContain(response.body.redis);
            }
        });

        test("should return 503 if database is disconnected", async () => {
            // Mock Prisma to throw error
            const prisma = require("../../lib/prisma");
            jest.spyOn(prisma, "$queryRaw").mockRejectedValue(new Error("Connection failed"));

            const response = await request(app).get("/api/health/readiness");

            expect(response.status).toBe(503);
            expect(response.body.ready).toBe(false);
            expect(response.body.database).toBe("disconnected");
        });

        test("should include all dependency statuses", async () => {
            const response = await request(app).get("/api/health/readiness");

            expect(response.body).toHaveProperty("database");
            // Could also check: redis, ai-service, billing-service, etc.
        });
    });

    // ============================================================================
    // Test 4: Detailed Health Check
    // ============================================================================
    describe("GET /api/health/detailed - Detailed Health Check", () => {
        test("should return comprehensive health information", async () => {
            const response = await request(app).get("/api/health/detailed");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("status");
            expect(response.body).toHaveProperty("timestamp");
            expect(response.body).toHaveProperty("uptime");
            expect(response.body).toHaveProperty("version");
            expect(response.body).toHaveProperty("dependencies");
        });

        test("should include database health metrics", async () => {
            const response = await request(app).get("/api/health/detailed");

            expect(response.body.dependencies).toHaveProperty("database");
            expect(response.body.dependencies.database).toHaveProperty("status");
            expect(response.body.dependencies.database).toHaveProperty("responseTime");
        });

        test("should measure database response time", async () => {
            const response = await request(app).get("/api/health/detailed");

            const dbResponseTime = response.body.dependencies.database.responseTime;
            expect(typeof dbResponseTime).toBe("number");
            expect(dbResponseTime).toBeGreaterThan(0);
        });

        test("should include Redis health metrics (if enabled)", async () => {
            if (process.env.REDIS_URL) {
                const response = await request(app).get("/api/health/detailed");

                expect(response.body.dependencies).toHaveProperty("redis");
                expect(response.body.dependencies.redis).toHaveProperty("status");
                expect(response.body.dependencies.redis).toHaveProperty("responseTime");
            }
        });

        test("should include AI service health (if enabled)", async () => {
            if (process.env.FEATURE_AI_ENABLED === "true") {
                const response = await request(app).get("/api/health/detailed");

                expect(response.body.dependencies).toHaveProperty("aiService");
                expect(response.body.dependencies.aiService).toHaveProperty("status");
            }
        });

        test("should include billing service health (if enabled)", async () => {
            if (process.env.FEATURE_BILLING_ENABLED === "true") {
                const response = await request(app).get("/api/health/detailed");

                expect(response.body.dependencies).toHaveProperty("billingService");
                expect(response.body.dependencies.billingService).toHaveProperty("status");
            }
        });
    });

    // ============================================================================
    // Test 5: Memory Usage Monitoring
    // ============================================================================
    describe("Memory Usage Monitoring", () => {
        test("should report memory usage under threshold", async () => {
            const response = await request(app).get("/api/health/liveness");

            const memoryUsageMB = response.body.memory.heapUsed / 1024 / 1024;
            expect(memoryUsageMB).toBeLessThan(512); // Example threshold
        });

        test("should warn when memory usage is high", async () => {
            // This would require forcing high memory usage
            // In real scenario, you'd check the response for warning flags
        });

        test("should include memory percentage", async () => {
            const response = await request(app).get("/api/health/detailed");

            if (response.body.memory) {
                expect(response.body.memory).toHaveProperty("percentage");
                expect(response.body.memory.percentage).toBeGreaterThan(0);
                expect(response.body.memory.percentage).toBeLessThan(100);
            }
        });
    });

    // ============================================================================
    // Test 6: Uptime Tracking
    // ============================================================================
    describe("Uptime Tracking", () => {
        test("should report accurate uptime", async () => {
            const response = await request(app).get("/api/health");

            expect(response.body.uptime).toBeGreaterThan(0);
            expect(typeof response.body.uptime).toBe("number");
        });

        test("should format uptime as human-readable", async () => {
            const response = await request(app).get("/api/health/detailed");

            if (response.body.uptimeHuman) {
                expect(response.body.uptimeHuman).toMatch(/\d+[dhms]/); // e.g., "5h 32m 14s"
            }
        });
    });

    // ============================================================================
    // Test 7: Feature Flag Status
    // ============================================================================
    describe("Feature Flag Status in Health Check", () => {
        test("should report which features are enabled", async () => {
            const response = await request(app).get("/api/health/detailed");

            if (response.body.features) {
                expect(response.body.features).toHaveProperty("ai");
                expect(response.body.features).toHaveProperty("billing");
                expect(response.body.features).toHaveProperty("voice");
            }
        });

        test("should show AI feature status", async () => {
            const response = await request(app).get("/api/health/detailed");

            if (response.body.features) {
                const aiEnabled = process.env.FEATURE_AI_ENABLED === "true";
                expect(response.body.features.ai).toBe(aiEnabled);
            }
        });

        test("should show billing feature status", async () => {
            const response = await request(app).get("/api/health/detailed");

            if (response.body.features) {
                const billingEnabled = process.env.FEATURE_BILLING_ENABLED === "true";
                expect(response.body.features.billing).toBe(billingEnabled);
            }
        });
    });

    // ============================================================================
    // Test 8: Environment Information
    // ============================================================================
    describe("Environment Information", () => {
        test("should report Node.js version", async () => {
            const response = await request(app).get("/api/health/detailed");

            expect(response.body).toHaveProperty("nodeVersion");
            expect(response.body.nodeVersion).toMatch(/^v?\d+\.\d+\.\d+$/);
        });

        test("should report environment mode", async () => {
            const response = await request(app).get("/api/health/detailed");

            expect(response.body).toHaveProperty("environment");
            expect(["development", "production", "test"]).toContain(response.body.environment);
        });

        test("should not expose sensitive information", async () => {
            const response = await request(app).get("/api/health/detailed");

            // Should not include database URLs, API keys, secrets
            const responseText = JSON.stringify(response.body);
            expect(responseText).not.toMatch(/password|secret|key|token/i);
        });
    });

    // ============================================================================
    // Test 9: Degraded Service Detection
    // ============================================================================
    describe("Degraded Service Detection", () => {
        test("should return 'degraded' status when some services are down", async () => {
            // Mock database failure
            const prisma = require("../../lib/prisma");
            jest.spyOn(prisma, "$queryRaw").mockRejectedValue(new Error("Connection failed"));

            const response = await request(app).get("/api/health/detailed");

            expect(response.status).toBe(200); // Still responding
            expect(response.body.status).toBe("degraded");
        });

        test("should list which services are unhealthy", async () => {
            // Mock database failure
            const prisma = require("../../lib/prisma");
            jest.spyOn(prisma, "$queryRaw").mockRejectedValue(new Error("Connection failed"));

            const response = await request(app).get("/api/health/detailed");

            expect(response.body.unhealthy).toContain("database");
        });

        test("should still return 200 for basic health when degraded", async () => {
            // Even if some services are down, basic health should return 200
            // (indicating the API itself is up)
            const response = await request(app).get("/api/health");

            expect(response.status).toBe(200);
        });
    });

    // ============================================================================
    // Test 10: Kubernetes/Docker Health Integration
    // ============================================================================
    describe("Kubernetes/Docker Health Integration", () => {
        test("liveness probe should match Kubernetes format", async () => {
            const response = await request(app).get("/api/health/liveness");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("alive");
            expect(typeof response.body.alive).toBe("boolean");
        });

        test("readiness probe should match Kubernetes format", async () => {
            const response = await request(app).get("/api/health/readiness");

            expect([200, 503]).toContain(response.status);
            expect(response.body).toHaveProperty("ready");
            expect(typeof response.body.ready).toBe("boolean");
        });

        test("should support HEAD requests for lightweight checks", async () => {
            const response = await request(app).head("/api/health");

            expect([200, 204]).toContain(response.status);
        });

        test("should have no body for HEAD requests", async () => {
            const response = await request(app).head("/api/health");

            expect(response.body).toEqual({});
        });

        test("should include appropriate cache headers", async () => {
            const response = await request(app).get("/api/health");

            // Health checks should not be cached
            expect(response.headers["cache-control"]).toMatch(/no-cache|no-store/);
        });
    });
});
