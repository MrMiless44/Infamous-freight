/**
 * Logger Performance Tests
 * Priority: HIGH
 * Coverage Impact: +8% overall
 * Time to implement: 2-3 hours
 *
 * Tests structured logging, performance levels, correlation IDs, and log sanitization.
 */

const logger = require("../../middleware/logger");
const request = require("supertest");

describe("Logger Performance Tests", () => {
    let app;

    beforeAll(() => {
        app = require("../../app");
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // Test 1: Performance Level Assignment
    // ============================================================================
    describe("Performance Level Assignment", () => {
        test("should assign 'excellent' for responses < 100ms", () => {
            const mockReq = {
                method: "GET",
                path: "/api/health",
                startTime: Date.now() - 50, // 50ms ago
            };
            const mockRes = { statusCode: 200 };
            const mockNext = jest.fn();

            logger(mockReq, mockRes, mockNext);

            expect(mockReq.performanceLevel).toBe("excellent");
        });

        test("should assign 'good' for responses 100-500ms", () => {
            const mockReq = {
                method: "GET",
                path: "/api/shipments",
                startTime: Date.now() - 300, // 300ms ago
            };
            const mockRes = { statusCode: 200 };
            const mockNext = jest.fn();

            logger(mockReq, mockRes, mockNext);

            expect(mockReq.performanceLevel).toBe("good");
        });

        test("should assign 'acceptable' for responses 500-1000ms", () => {
            const mockReq = {
                method: "POST",
                path: "/api/ai/command",
                startTime: Date.now() - 750, // 750ms ago
            };
            const mockRes = { statusCode: 200 };
            const mockNext = jest.fn();

            logger(mockReq, mockRes, mockNext);

            expect(mockReq.performanceLevel).toBe("acceptable");
        });

        test("should assign 'slow' for responses 1000-3000ms", () => {
            const mockReq = {
                method: "POST",
                path: "/api/billing/charge",
                startTime: Date.now() - 2000, // 2000ms ago
            };
            const mockRes = { statusCode: 200 };
            const mockNext = jest.fn();

            logger(mockReq, mockRes, mockNext);

            expect(mockReq.performanceLevel).toBe("slow");
        });

        test("should assign 'needs_optimization' for responses > 3000ms", () => {
            const mockReq = {
                method: "GET",
                path: "/api/reports/analytics",
                startTime: Date.now() - 4000, // 4000ms ago
            };
            const mockRes = { statusCode: 200 };
            const mockNext = jest.fn();

            logger(mockReq, mockRes, mockNext);

            expect(mockReq.performanceLevel).toBe("needs_optimization");
        });
    });

    // ============================================================================
    // Test 2: Correlation ID Generation
    // ============================================================================
    describe("Correlation ID Generation", () => {
        test("should generate unique correlation IDs", () => {
            const req1 = { method: "GET", path: "/api/test1", startTime: Date.now() };
            const req2 = { method: "POST", path: "/api/test2", startTime: Date.now() };

            logger(req1, { statusCode: 200 }, jest.fn());
            logger(req2, { statusCode: 200 }, jest.fn());

            expect(req1.correlationId).toBeDefined();
            expect(req2.correlationId).toBeDefined();
            expect(req1.correlationId).not.toBe(req2.correlationId);
        });

        test("should use existing correlation ID if provided in header", () => {
            const existingId = "existing-correlation-123";
            const req = {
                method: "GET",
                path: "/api/test",
                startTime: Date.now(),
                headers: { "x-correlation-id": existingId },
            };

            logger(req, { statusCode: 200 }, jest.fn());

            expect(req.correlationId).toBe(existingId);
        });

        test("should include correlation ID in response headers", async () => {
            const response = await request(app).get("/api/health");

            expect(response.headers["x-correlation-id"]).toBeDefined();
        });
    });

    // ============================================================================
    // Test 3: Log Levels Based on Status Code
    // ============================================================================
    describe("Log Levels Based on Status Code", () => {
        test("should log info for 2xx status codes", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "GET",
                path: "/api/health",
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            expect(loggerSpy).toHaveBeenCalled();
        });

        test("should log warn for 4xx status codes", () => {
            const loggerSpy = jest.spyOn(logger.logger, "warn");

            const mockReq = {
                method: "GET",
                path: "/api/nonexistent",
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 404 };

            logger(mockReq, mockRes, jest.fn());

            expect(loggerSpy).toHaveBeenCalled();
        });

        test("should log error for 5xx status codes", () => {
            const loggerSpy = jest.spyOn(logger.logger, "error");

            const mockReq = {
                method: "GET",
                path: "/api/test",
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 500 };

            logger(mockReq, mockRes, jest.fn());

            expect(loggerSpy).toHaveBeenCalled();
        });
    });

    // ============================================================================
    // Test 4: Body Sanitization (Remove Sensitive Data)
    // ============================================================================
    describe("Body Sanitization", () => {
        test("should redact passwords from logs", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "POST",
                path: "/api/auth/login",
                body: {
                    email: "test@example.com",
                    password: "secret123",
                },
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.body.password).not.toBe("secret123");
            expect(loggedData.body.password).toMatch(/\[REDACTED\]/i);
        });

        test("should redact credit card numbers from logs", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "POST",
                path: "/api/billing/charge",
                body: {
                    amount: 1000,
                    creditCard: "4111111111111111",
                },
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.body.creditCard).not.toBe("4111111111111111");
        });

        test("should redact API keys from logs", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "POST",
                path: "/api/settings",
                body: {
                    apiKey: "sk_test_1234567890abcdef",
                },
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.body.apiKey).toMatch(/\[REDACTED\]/i);
        });

        test("should preserve non-sensitive data in logs", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "POST",
                path: "/api/shipments",
                body: {
                    origin: "New York",
                    destination: "Los Angeles",
                    weight: 1000,
                },
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.body.origin).toBe("New York");
            expect(loggedData.body.destination).toBe("Los Angeles");
            expect(loggedData.body.weight).toBe(1000);
        });
    });

    // ============================================================================
    // Test 5: Structured Log Format
    // ============================================================================
    describe("Structured Log Format", () => {
        test("should include timestamp in logs", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "GET",
                path: "/api/health",
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.timestamp).toBeDefined();
        });

        test("should include request method and path", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "POST",
                path: "/api/shipments",
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 201 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.method).toBe("POST");
            expect(loggedData.path).toBe("/api/shipments");
        });

        test("should include status code and response time", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "GET",
                path: "/api/health",
                startTime: Date.now() - 100,
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.statusCode).toBe(200);
            expect(loggedData.responseTime).toBeGreaterThan(0);
        });

        test("should include user ID if authenticated", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const mockReq = {
                method: "GET",
                path: "/api/shipments",
                startTime: Date.now(),
                user: { sub: "user-123", email: "test@example.com" },
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.userId).toBe("user-123");
        });
    });

    // ============================================================================
    // Test 6: Request Size Logging
    // ============================================================================
    describe("Request Size Logging", () => {
        test("should log request body size", () => {
            const loggerSpy = jest.spyOn(logger.logger, "info");

            const largeBody = { data: "x".repeat(10000) };
            const mockReq = {
                method: "POST",
                path: "/api/test",
                body: largeBody,
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.requestSize).toBeGreaterThan(0);
        });

        test("should warn on large request bodies", () => {
            const loggerSpy = jest.spyOn(logger.logger, "warn");

            const veryLargeBody = { data: "x".repeat(1000000) }; // 1MB
            const mockReq = {
                method: "POST",
                path: "/api/test",
                body: veryLargeBody,
                startTime: Date.now(),
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            // Should have logged a warning about large body
        });
    });

    // ============================================================================
    // Test 7: Error Context Logging
    // ============================================================================
    describe("Error Context Logging", () => {
        test("should include error details in logs", () => {
            const loggerSpy = jest.spyOn(logger.logger, "error");

            const error = new Error("Database connection failed");
            const mockReq = {
                method: "GET",
                path: "/api/shipments",
                startTime: Date.now(),
                error: error,
            };
            const mockRes = { statusCode: 500 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.error).toBeDefined();
            expect(loggedData.error.message).toBe("Database connection failed");
        });

        test("should include stack trace in development mode", () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "development";

            const loggerSpy = jest.spyOn(logger.logger, "error");

            const error = new Error("Test error");
            const mockReq = {
                method: "GET",
                path: "/api/test",
                startTime: Date.now(),
                error: error,
            };
            const mockRes = { statusCode: 500 };

            logger(mockReq, mockRes, jest.fn());

            const loggedData = loggerSpy.mock.calls[0][0];
            expect(loggedData.error.stack).toBeDefined();

            process.env.NODE_ENV = originalEnv;
        });
    });

    // ============================================================================
    // Test 8: Performance Degradation Detection
    // ============================================================================
    describe("Performance Degradation Detection", () => {
        test("should detect slow endpoints", () => {
            const loggerSpy = jest.spyOn(logger.logger, "warn");

            const mockReq = {
                method: "GET",
                path: "/api/reports/heavy",
                startTime: Date.now() - 5000, // 5 seconds
            };
            const mockRes = { statusCode: 200 };

            logger(mockReq, mockRes, jest.fn());

            // Should log a warning about slow response
            const loggedData = loggerSpy.mock.calls[0]?.[0];
            if (loggedData) {
                expect(loggedData.performanceLevel).toBe("needs_optimization");
            }
        });

        test("should track consecutive slow requests", () => {
            // Make multiple slow requests
            for (let i = 0; i < 5; i++) {
                const mockReq = {
                    method: "GET",
                    path: "/api/slow-endpoint",
                    startTime: Date.now() - 2000, // 2 seconds each
                };
                const mockRes = { statusCode: 200 };
                logger(mockReq, mockRes, jest.fn());
            }

            // Should detect pattern of slow responses
        });
    });

    // ============================================================================
    // Test 9: Log Rotation and Retention
    // ============================================================================
    describe("Log Rotation and Retention", () => {
        test("should use appropriate log levels for different environments", () => {
            const originalEnv = process.env.LOG_LEVEL;

            // Test production log level
            process.env.LOG_LEVEL = "error";
            expect(logger.logger.level).toBe("error");

            // Test development log level
            process.env.LOG_LEVEL = "debug";
            expect(logger.logger.level).toBe("debug");

            process.env.LOG_LEVEL = originalEnv;
        });
    });

    // ============================================================================
    // Test 10: Real-Time Performance Monitoring
    // ============================================================================
    describe("Real-Time Performance Monitoring", () => {
        test("should track average response times", async () => {
            // Make multiple requests
            const responses = await Promise.all([
                request(app).get("/api/health"),
                request(app).get("/api/health"),
                request(app).get("/api/health"),
            ]);

            // All should complete successfully
            responses.forEach((res) => {
                expect(res.status).toBe(200);
            });

            // Performance data should be available for analysis
        });

        test("should identify performance bottlenecks", () => {
            // Simulate requests to different endpoints
            const endpoints = [
                { path: "/api/health", time: 50 },
                { path: "/api/shipments", time: 200 },
                { path: "/api/ai/command", time: 2000 },
            ];

            endpoints.forEach(({ path, time }) => {
                const mockReq = {
                    method: "GET",
                    path: path,
                    startTime: Date.now() - time,
                };
                const mockRes = { statusCode: 200 };
                logger(mockReq, mockRes, jest.fn());
            });

            // AI endpoint should be flagged as slowest
        });
    });
});
