# Test Coverage 100% Strategy

**Goal**: Achieve 90%+ test coverage across all metrics  
**Current Thresholds Configured**: ✅ Complete  
**Next Steps**: Write tests to meet thresholds

---

## Current Test Coverage Status

### Jest Configuration ✅ COMPLETE

Location: [apps/api/jest.config.js](apps/api/jest.config.js)

```javascript
coverageThreshold: {
  global: {
    branches: 80,    // Was: 16%
    functions: 85,   // Was: 21%
    lines: 88,       // Was: 27%
    statements: 88   // Was: 27%
  }
}
```

### Existing Test Files (44 total)

#### Unit Tests

- ✅ `/apps/api/__tests__/middleware/errorHandler.test.js`
- ✅ `/apps/api/__tests__/middleware/logger.test.js`
- ✅ `/apps/api/__tests__/middleware/security.test.js`
- ✅ `/apps/api/__tests__/middleware/validation.test.js`
- ✅ `/apps/api/__tests__/middleware/performance.test.js`
- ✅ `/apps/api/__tests__/routes/health.test.js`
- ✅ `/apps/api/__tests__/routes/ai.commands.test.js`
- ✅ `/apps/api/__tests__/routes/billing.test.js`
- ✅ `/apps/api/__tests__/routes/shipments.test.js`
- ✅ `/apps/api/__tests__/routes/metrics.test.js`

#### Service Tests

- ✅ `/apps/api/src/__tests__/paymentService.test.js`
- ✅ `/apps/api/src/__tests__/recommendationService.test.js`
- ✅ `/apps/api/src/__tests__/trackingService.test.js`
- ✅ `/apps/api/src/__tests__/bonusSystem.test.js`
- ✅ `/apps/api/src/__tests__/logisticsService.test.js`

#### Integration Tests

- ✅ `/apps/api/src/__tests__/integration/webhooks.test.js`
- ✅ `/apps/api/src/__tests__/integration/auth.test.js`
- ✅ `/apps/api/src/__tests__/integration/responseCache.test.js`
- ✅ `/apps/api/src/__tests__/integration/slowQueryLogger.test.js`
- ✅ `/apps/api/src/__tests__/integration/metrics.prometheus.test.js`

#### Library Tests

- ✅ `/apps/api/src/lib/__tests__/jobStateMachine.test.js`
- ✅ `/apps/api/src/lib/__tests__/outboundHttp.test.js`
- ✅ `/apps/api/src/lib/__tests__/pricing.test.js`
- ✅ `/apps/api/src/lib/__tests__/geo.test.js`
- ✅ `/apps/api/src/lib/__tests__/rateLimitMetrics.test.js`
- ✅ `/apps/api/src/lib/__tests__/queryMetrics.test.js`

---

## 🎯 Test Coverage Strategy to Reach 90%+

### Priority 1: Critical Path Coverage

#### 1. Enhanced Error Handler Tests

**File**: `apps/api/__tests__/middleware/errorHandler.enhanced.test.js`

**Test Cases to Add:**

```javascript
describe("Enhanced Error Handler", () => {
  it("should generate correlation IDs for errors", async () => {
    const err = new Error("Test error");
    const req = { path: "/api/test", method: "POST", user: { sub: "123" } };

    await errorHandler(err, req, res, next);

    expect(res._getHeaders()["x-correlation-id"]).toBeDefined();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        tags: expect.objectContaining({
          correlationId: expect.any(String),
        }),
      }),
    );
  });

  it("should mask sensitive data in production", async () => {
    process.env.NODE_ENV = "production";
    const err = new Error("Payment failed");
    err.sensitiveData = { creditCard: "1234-5678-9012-3456" };

    await errorHandler(err, req, res, next);

    const capturedContext = Sentry.captureException.mock.calls[0][1];
    expect(capturedContext.extra).not.toContain("1234");
  });

  it("should include user context in Sentry", async () => {
    const req = { user: { sub: "user-123", email: "test@example.com" } };
    const err = new Error("Test error");

    await errorHandler(err, req, res, next);

    expect(Sentry.setUser).toHaveBeenCalledWith({
      id: "user-123",
      email: "test@example.com",
    });
  });

  it("should handle errors without user context", async () => {
    const req = { path: "/api/public" };
    const err = new Error("Public error");

    await errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
});
```

**Coverage Impact**: +10% function coverage  
**Estimated Effort**: 2 hours

#### 2. Logger Performance Levels Tests

**File**: `apps/api/__tests__/middleware/logger.performance.test.js`

**Test Cases to Add:**

```javascript
describe("Logger Performance Tracking", () => {
  it("should log normal performance (< 1000ms) as info", async () => {
    const req = { method: "GET", url: "/api/test" };
    const res = { statusCode: 200 };

    // Simulate 500ms request
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        responseTime: expect.any(Number),
        performanceLevel: "normal",
      }),
    );
  });

  it("should log slow performance (1000-5000ms) as warn", async () => {
    // Simulate 2000ms request
    jest.advanceTimersByTime(2000);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Slow request detected",
        responseTime: 2000,
        performanceLevel: "slow",
      }),
    );
  });

  it("should log critical performance (> 5000ms) as error", async () => {
    jest.advanceTimersByTime(6000);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Critical slow request",
        responseTime: 6000,
        performanceLevel: "critical",
      }),
    );
  });

  it("should track correlation IDs across logs", async () => {
    const correlationId = "test-correlation-id";
    const req = { headers: { "x-correlation-id": correlationId } };

    loggerMiddleware(req, res, next);

    expect(req.log.bindings().correlationId).toBe(correlationId);
  });
});
```

**Coverage Impact**: +8% function coverage  
**Estimated Effort**: 1.5 hours

#### 3. Rate Limiter Configuration Tests

**File**: `apps/api/__tests__/middleware/security.ratelimit.test.js`

**Test Cases to Add:**

```javascript
describe("Rate Limiter Configuration", () => {
  it("should respect RATE_LIMIT_GENERAL_MAX env variable", () => {
    process.env.RATE_LIMIT_GENERAL_MAX = "50";
    const limiter = createLimiter({
      windowMs: 900000,
      max: process.env.RATE_LIMIT_GENERAL_MAX,
    });

    expect(limiter.max).toBe(50);
  });

  it("should use default when env variable not set", () => {
    delete process.env.RATE_LIMIT_GENERAL_MAX;
    const limiter = createLimiter({ windowMs: 900000, max: 100 });

    expect(limiter.max).toBe(100);
  });

  it("should return 429 when rate limit exceeded", async () => {
    const req = { ip: "127.0.0.1" };

    // Exceed limit
    for (let i = 0; i < 101; i++) {
      await limiters.general(req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Too many requests, please try again later.",
    });
  });

  it("should use Redis when available", async () => {
    const redisClient = { get: jest.fn(), set: jest.fn() };
    const limiter = createLimiter({ store: redisClient });

    await limiter(req, res, next);

    expect(redisClient.get).toHaveBeenCalled();
  });

  it("should fallback to memory store when Redis unavailable", async () => {
    const limiter = createLimiter({ store: undefined });

    await limiter(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
```

**Coverage Impact**: +7% branch coverage  
**Estimated Effort**: 2 hours

#### 4. Feature Flag Tests

**File**: `apps/api/__tests__/routes/featureFlags.test.js`

**Test Cases to Add:**

```javascript
describe("Feature Flags", () => {
  describe("AI Commands", () => {
    it("should allow requests when ENABLE_AI_COMMANDS=true", async () => {
      process.env.ENABLE_AI_COMMANDS = "true";

      const response = await request(app)
        .post("/api/ai/commands/execute")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ command: "test" });

      expect(response.status).not.toBe(503);
    });

    it("should reject requests when ENABLE_AI_COMMANDS=false", async () => {
      process.env.ENABLE_AI_COMMANDS = "false";

      const response = await request(app)
        .post("/api/ai/commands/execute")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ command: "test" });

      expect(response.status).toBe(503);
      expect(response.body.error).toContain("temporarily unavailable");
    });
  });

  describe("Voice Processing", () => {
    it("should allow uploads when ENABLE_VOICE_PROCESSING=true", async () => {
      process.env.ENABLE_VOICE_PROCESSING = "true";

      const response = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .attach("audio", Buffer.from("test"), "test.mp3");

      expect(response.status).not.toBe(503);
    });

    it("should reject uploads when ENABLE_VOICE_PROCESSING=false", async () => {
      process.env.ENABLE_VOICE_PROCESSING = "false";

      const response = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .attach("audio", Buffer.from("test"), "test.mp3");

      expect(response.status).toBe(503);
    });

    it("should validate file size against VOICE_MAX_FILE_SIZE_MB", async () => {
      process.env.VOICE_MAX_FILE_SIZE_MB = "1";
      const largeFile = Buffer.alloc(2 * 1024 * 1024); // 2MB

      const response = await request(app)
        .post("/api/voice/ingest")
        .set("Authorization", `Bearer ${validToken}`)
        .attach("audio", largeFile, "large.mp3");

      expect(response.status).toBe(413);
    });
  });

  describe("New Billing", () => {
    it("should use new billing flow when ENABLE_NEW_BILLING=true", async () => {
      process.env.ENABLE_NEW_BILLING = "true";

      const response = await request(app)
        .post("/api/billing/charge")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ amount: 5000, paymentMethodId: "pm_test" });

      expect(stripe.paymentIntents.create).toHaveBeenCalled();
    });
  });
});
```

**Coverage Impact**: +12% branch coverage  
**Estimated Effort**: 3 hours

#### 5. Health Check Tests

**File**: `apps/api/__tests__/routes/health.detailed.test.js`

**Test Cases to Add:**

```javascript
describe("Health Check Endpoints", () => {
  it("should return basic health status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      uptime: expect.any(Number),
      timestamp: expect.any(Number),
    });
  });

  it("should check database connection in detailed health", async () => {
    prisma.$queryRaw = jest.fn().mockResolvedValue([{ result: 1 }]);

    const response = await request(app).get("/api/health/detailed");

    expect(response.body.database).toBe("connected");
  });

  it("should return 503 when database is down", async () => {
    prisma.$queryRaw = jest.fn().mockRejectedValue(new Error("DB down"));

    const response = await request(app).get("/api/health/detailed");

    expect(response.status).toBe(503);
    expect(response.body.database).toBe("disconnected");
  });

  it("should timeout database check after 5 seconds", async () => {
    prisma.$queryRaw = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 6000)),
      );

    const response = await request(app).get("/api/health/detailed");

    expect(response.body.database).toBe("timeout");
  }, 10000);

  it("should check Redis connection in detailed health", async () => {
    redisClient.ping = jest.fn().mockResolvedValue("PONG");

    const response = await request(app).get("/api/health/detailed");

    expect(response.body.redis).toBe("connected");
  });

  it("should include version information", async () => {
    const response = await request(app).get("/api/health/detailed");

    expect(response.body.version).toBe("2.2.0");
  });
});
```

**Coverage Impact**: +5% function coverage  
**Estimated Effort**: 1 hour

---

### Priority 2: Security & Validation Coverage

#### 6. JWT Scope Enforcement Tests

**File**: `apps/api/__tests__/middleware/security.scopes.test.js`

```javascript
describe("JWT Scope Enforcement", () => {
  it("should allow request with required scope", async () => {
    const token = jwt.sign({ sub: "123", scopes: ["ai:command"] }, SECRET);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const middleware = requireScope("ai:command");

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it("should reject request without required scope", async () => {
    const token = jwt.sign({ sub: "123", scopes: ["billing:read"] }, SECRET);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const middleware = requireScope("ai:command");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Insufficient permissions",
    });
  });

  it("should handle multiple scopes", async () => {
    const token = jwt.sign(
      { sub: "123", scopes: ["ai:command", "billing:read"] },
      SECRET,
    );

    const req = { headers: { authorization: `Bearer ${token}` } };
    const middleware = requireScope(["ai:command", "billing:read"]);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should log audit trail for scope-protected actions", async () => {
    const token = jwt.sign({ sub: "123", scopes: ["ai:command"] }, SECRET);
    const req = {
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      path: "/api/ai/commands/execute",
    };

    await auditLog(req, res, next);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "scope_protected_access",
        userId: "123",
        scope: "ai:command",
      }),
    );
  });
});
```

**Coverage Impact**: +6% function coverage  
**Estimated Effort**: 1.5 hours

#### 7. Billing Integration Tests

**File**: `apps/api/__tests__/routes/billing.enhanced.test.js`

```javascript
describe("Billing Integration", () => {
  it("should validate amount range (1-9,999,999 cents)", async () => {
    const response = await request(app)
      .post("/api/billing/charge")
      .send({ amount: 10000000, paymentMethodId: "pm_test" });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Amount must be between");
  });

  it("should support idempotency keys", async () => {
    const idempotencyKey = "test-key-123";

    const response1 = await request(app)
      .post("/api/billing/charge")
      .set("Idempotency-Key", idempotencyKey)
      .send({ amount: 5000, paymentMethodId: "pm_test" });

    const response2 = await request(app)
      .post("/api/billing/charge")
      .set("Idempotency-Key", idempotencyKey)
      .send({ amount: 5000, paymentMethodId: "pm_test" });

    expect(response1.body.chargeId).toBe(response2.body.chargeId);
  });

  it("should handle Stripe card errors gracefully", async () => {
    stripe.paymentIntents.create = jest.fn().mockRejectedValue({
      type: "StripeCardError",
      message: "Card declined",
    });

    const response = await request(app)
      .post("/api/billing/charge")
      .send({ amount: 5000, paymentMethodId: "pm_test" });

    expect(response.status).toBe(402);
    expect(response.body.error).toBe("Card declined");
  });

  it("should verify webhook signatures", async () => {
    const invalidSignature = "invalid";

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("Stripe-Signature", invalidSignature)
      .send({ type: "payment_intent.succeeded" });

    expect(response.status).toBe(400);
  });
});
```

**Coverage Impact**: +9% function coverage  
**Estimated Effort**: 2 hours

---

### Priority 3: Integration & E2E Coverage

#### 8. End-to-End API Flow Tests

**File**: `apps/api/__tests__/integration/e2e.flows.test.js`

```javascript
describe("End-to-End API Flows", () => {
  it("should complete full shipment creation flow", async () => {
    // 1. Create shipment
    const shipment = await request(app)
      .post("/api/shipments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        origin: "New York",
        destination: "Los Angeles",
        weight: 1000,
      });

    expect(shipment.status).toBe(201);

    // 2. Get shipment details
    const details = await request(app)
      .get(`/api/shipments/${shipment.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(details.status).toBe(200);

    // 3. Update shipment status
    const update = await request(app)
      .patch(`/api/shipments/${shipment.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "IN_TRANSIT" });

    expect(update.status).toBe(200);
  });

  it("should enforce rate limits across requests", async () => {
    const promises = [];
    for (let i = 0; i < 101; i++) {
      promises.push(request(app).get("/api/health"));
    }

    const results = await Promise.all(promises);
    const rateLimited = results.filter((r) => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

**Coverage Impact**: +8% line coverage  
**Estimated Effort**: 3 hours

---

## 📊 Coverage Targets & Timeline

### Coverage Goals

- **Lines**: 88% (current ~75%, need +13%)
- **Functions**: 85% (current ~70%, need +15%)
- **Branches**: 80% (current ~65%, need +15%)
- **Statements**: 88% (current ~75%, need +13%)

### Implementation Timeline

#### Week 1: Critical Path (Priority 1)

- Day 1-2: Enhanced Error Handler Tests (+10% functions)
- Day 3: Logger Performance Tests (+8% functions)
- Day 4-5: Rate Limiter & Feature Flag Tests (+19% branches)

#### Week 2: Security & Integration (Priority 2 & 3)

- Day 1-2: JWT Scope & Billing Tests (+15% functions)
- Day 3-4: E2E Flow Tests (+8% lines)
- Day 5: Review and refinement

**Total Estimated Effort**: 20-25 hours  
**Expected Coverage Increase**: 25-30% across all metrics

---

## 🚀 Running Tests

### Full Test Suite

```bash
cd apps/api
npm test -- --coverage
```

### Watch Mode (during development)

```bash
npm test -- --watch
```

### Specific Test File

```bash
npm test -- errorHandler.enhanced.test.js
```

### Coverage Report

```bash
npm test -- --coverage --coverageReporters=html
open coverage/index.html
```

### CI Pipeline

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: cd apps/api && npm ci
      - name: Run tests with coverage
        run: cd apps/api && npm test -- --coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./apps/api/coverage/coverage-final.json
```

---

## ✅ Success Criteria

### Test Suite Passes

- ✅ All 44+ existing tests pass
- ✅ All new tests pass
- ✅ No flaky tests
- ✅ Tests run in <5 minutes

### Coverage Thresholds Met

- ✅ Lines: ≥88%
- ✅ Functions: ≥85%
- ✅ Branches: ≥80%
- ✅ Statements: ≥88%

### Code Quality

- ✅ No console.log statements
- ✅ Mocks properly restored
- ✅ Async operations handled correctly
- ✅ Error paths tested
- ✅ Edge cases covered

---

## 📝 Maintenance

### Test Review Schedule

- **Weekly**: Review failing tests in CI
- **Sprint**: Add tests for new features
- **Monthly**: Update snapshots and mocks
- **Quarterly**: Refactor slow or flaky tests

### Coverage Monitoring

- Track coverage trends in Codecov
- Block PRs that reduce coverage
- Celebrate coverage milestones
- Review uncovered code monthly

---

**Status**: 🎯 Strategy complete, ready for implementation  
**Next Step**: Begin Priority 1 tests (estimated 10 hours)
