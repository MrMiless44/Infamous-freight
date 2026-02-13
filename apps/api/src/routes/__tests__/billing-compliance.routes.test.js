/**
 * Tests for billing-compliance routes
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

// Mock Stripe first (before requiring services that use it)
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    subscriptions: {
      update: jest.fn(),
      cancel: jest.fn(),
    },
    customers: {
      create: jest.fn(),
    },
  }));
});

// Mock dependencies
jest.mock("../../middleware/logger");
const mockLogger = require("../../middleware/logger");
mockLogger.info = jest.fn();

// Setup middleware mocks BEFORE requiring the router
jest.mock("../../middleware/security", () => {
  const mockAuthenticate = jest.fn((req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const jwt = require("jsonwebtoken");
    req.user = jwt.decode(token);
    next();
  });

  const mockRequireScope = jest.fn((scope) => (req, res, next) => {
    if (!req.user?.scopes?.includes(scope)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  });

  return {
    authenticate: mockAuthenticate,
    requireScope: mockRequireScope,
    limiters: {
      general: jest.fn((req, res, next) => next()),
      billing: jest.fn((req, res, next) => next()),
    },
  };
});

jest.mock("../../middleware/validation", () => ({
  handleValidationErrors: jest.fn((req, res, next) => next()),
  validateString: jest.fn(() => (req, res, next) => next()),
}));

jest.mock("../../services/tieredPricingService", () => ({
  listTiers: jest.fn(),
  getCurrentPlan: jest.fn(),
  createCheckoutSession: jest.fn(),
  upgradeTier: jest.fn(),
  downgradeTier: jest.fn(),
  cancelSubscription: jest.fn(),
}));
const tieredPricingService = require("../../services/tieredPricingService");

jest.mock("../../services/complianceAutomationService", () => ({
  getGDPRChecklist: jest.fn(),
  exportUserData: jest.fn(),
  deleteUserData: jest.fn(),
  updateConsent: jest.fn(),
}));
const complianceAutomationService = require("../../services/complianceAutomationService");

jest.mock("../../services/referralProgramService", () => ({
  createReferralLink: jest.fn(),
  getUserReferralStats: jest.fn(),
  getLeaderboard: jest.fn(),
  trackReferralSignup: jest.fn(),
  markReferralConverted: jest.fn(),
}));
const referralProgramService = require("../../services/referralProgramService");

jest.mock("../../services/advancedMonitoringService", () => ({
  getHealthStatus: jest.fn(),
  getRUMConfiguration: jest.fn(),
  logBusinessEvent: jest.fn(),
}));
const advancedMonitoringService = require("../../services/advancedMonitoringService");

jest.mock("../../db/prisma");
const db = require("../../db/prisma");

// Import router AFTER all mocks are setup
const router = require("../billing-compliance.routes");

// Get mocked middleware for test setup
const { authenticate, requireScope, limiters } = require("../../middleware/security");

// Setup Express app
const app = express();
app.use(express.json());
app.use("/api", router);

// Helper to create JWT token
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "test-user-id", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("Billing & Compliance Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // MONITORING & HEALTH
  // ============================================

  describe("GET /api/health", () => {
    it("should return healthy status with 200", async () => {
      advancedMonitoringService.getHealthStatus.mockResolvedValue({
        status: "healthy",
        uptime: 12345,
        database: "connected",
      });

      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(advancedMonitoringService.getHealthStatus).toHaveBeenCalledWith(db);
    });

    it("should return degraded status with 503", async () => {
      advancedMonitoringService.getHealthStatus.mockResolvedValue({
        status: "degraded",
        uptime: 12345,
        database: "disconnected",
      });

      const response = await request(app).get("/api/health");

      expect(response.status).toBe(503);
      expect(response.body.status).toBe("degraded");
    });
  });

  describe("GET /api/monitoring/rum-config", () => {
    it("should return RUM configuration", async () => {
      advancedMonitoringService.getRUMConfiguration.mockReturnValue({
        applicationId: "test-app",
        clientToken: "test-token",
        site: "datadoghq.com",
      });

      const response = await request(app).get("/api/monitoring/rum-config");

      expect(response.status).toBe(200);
      expect(response.body.applicationId).toBe("test-app");
    });
  });

  // ============================================
  // COMPLIANCE (GDPR)
  // ============================================

  describe("GET /api/compliance/gdpr/checklist", () => {
    it("should return GDPR checklist", async () => {
      complianceAutomationService.getGDPRChecklist.mockReturnValue({
        items: ["data_export", "data_deletion", "consent_management"],
        completedItems: 3,
        totalItems: 3,
      });

      const response = await request(app).get("/api/compliance/gdpr/checklist");

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(3);
    });
  });

  describe("GET /api/compliance/data/export", () => {
    const token = createToken([]);

    it("should export user data", async () => {
      complianceAutomationService.exportUserData.mockResolvedValue({
        userId: "test-user-id",
        profile: { email: "test@example.com" },
        shipments: [],
      });

      const response = await request(app)
        .get("/api/compliance/data/export")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe("test-user-id");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/compliance/data/export");

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/compliance/data/delete", () => {
    const token = createToken([]);

    it("should delete user data", async () => {
      complianceAutomationService.deleteUserData.mockResolvedValue(true);

      const response = await request(app)
        .delete("/api/compliance/data/delete")
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "user_requested" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(complianceAutomationService.deleteUserData).toHaveBeenCalledWith(
        "test-user-id",
        "user_requested",
      );
    });

    it("should use default reason if not provided", async () => {
      complianceAutomationService.deleteUserData.mockResolvedValue(true);

      const response = await request(app)
        .delete("/api/compliance/data/delete")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(complianceAutomationService.deleteUserData).toHaveBeenCalledWith(
        "test-user-id",
        "user_requested",
      );
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).delete("/api/compliance/data/delete");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/compliance/consents", () => {
    const token = createToken([]);

    it("should return user consents", async () => {
      db.userConsent = {
        findMany: jest.fn().mockResolvedValue([
          { consentType: "marketing", value: true },
          { consentType: "analytics", value: false },
        ]),
      };

      const response = await request(app)
        .get("/api/compliance/consents")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(db.userConsent.findMany).toHaveBeenCalledWith({
        where: { userId: "test-user-id" },
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/compliance/consents");

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/compliance/consents/:consentType", () => {
    const token = createToken([]);

    it("should update user consent", async () => {
      complianceAutomationService.updateConsent.mockResolvedValue({
        consentType: "marketing",
        value: true,
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .put("/api/compliance/consents/marketing")
        .set("Authorization", `Bearer ${token}`)
        .send({ value: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.consent.consentType).toBe("marketing");
      expect(complianceAutomationService.updateConsent).toHaveBeenCalledWith(
        "test-user-id",
        "marketing",
        true,
        expect.any(String),
      );
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .put("/api/compliance/consents/marketing")
        .send({ value: true });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/compliance/reports", () => {
    const token = createToken(["admin:compliance"]);

    it("should return compliance reports", async () => {
      db.complianceReport = {
        findMany: jest.fn().mockResolvedValue([
          { id: "report-1", organizationId: "org-1", generatedAt: new Date() },
          { id: "report-2", organizationId: "org-1", generatedAt: new Date() },
        ]),
      };

      const response = await request(app)
        .get("/api/compliance/reports?organizationId=org-1")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(db.complianceReport.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        orderBy: { generatedAt: "desc" },
        take: 10,
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/compliance/reports");

      expect(response.status).toBe(401);
    });

    it("should return 403 without admin:compliance scope", async () => {
      const tokenNoScope = createToken([]);

      const response = await request(app)
        .get("/api/compliance/reports")
        .set("Authorization", `Bearer ${tokenNoScope}`);

      expect(response.status).toBe(403);
    });
  });

  // ============================================
  // PRICING & SUBSCRIPTIONS
  // ============================================

  describe("GET /api/pricing/tiers", () => {
    it("should return pricing tiers", async () => {
      tieredPricingService.listTiers.mockReturnValue([
        { name: "free", price: 0 },
        { name: "pro", price: 29 },
        { name: "enterprise", price: 99 },
      ]);

      const response = await request(app).get("/api/pricing/tiers");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
    });
  });

  describe("GET /api/pricing/current-plan", () => {
    const token = createToken([]);

    it("should return current plan", async () => {
      tieredPricingService.getCurrentPlan.mockResolvedValue({
        tier: "pro",
        billingCycle: "monthly",
        nextBillingDate: "2026-03-01",
      });

      const response = await request(app)
        .get("/api/pricing/current-plan")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tier).toBe("pro");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/pricing/current-plan");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/pricing/checkout", () => {
    const token = createToken([]);

    it("should create checkout session", async () => {
      tieredPricingService.createCheckoutSession.mockResolvedValue({
        id: "session-123",
        url: "https://checkout.example.com/session-123",
      });

      const response = await request(app)
        .post("/api/pricing/checkout")
        .set("Authorization", `Bearer ${token}`)
        .send({ tier: "pro", billingCycle: "monthly" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBe("session-123");
    });

    it("should default to monthly billing cycle", async () => {
      tieredPricingService.createCheckoutSession.mockResolvedValue({
        id: "session-123",
        url: "https://checkout.example.com/session-123",
      });

      await request(app)
        .post("/api/pricing/checkout")
        .set("Authorization", `Bearer ${token}`)
        .send({ tier: "pro" });

      expect(tieredPricingService.createCheckoutSession).toHaveBeenCalledWith(
        "test-user-id",
        "pro",
        "monthly",
      );
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/pricing/checkout").send({ tier: "pro" });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/pricing/upgrade", () => {
    const token = createToken([]);

    it("should upgrade tier", async () => {
      tieredPricingService.upgradeTier.mockResolvedValue({
        newTier: "enterprise",
        effectiveDate: "2026-02-13",
      });
      advancedMonitoringService.logBusinessEvent.mockReturnValue(undefined);

      const response = await request(app)
        .post("/api/pricing/upgrade")
        .set("Authorization", `Bearer ${token}`)
        .send({ tier: "enterprise" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.newTier).toBe("enterprise");
      expect(advancedMonitoringService.logBusinessEvent).toHaveBeenCalledWith("tier_upgraded", {
        userId: "test-user-id",
        newTier: "enterprise",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/pricing/upgrade").send({ tier: "enterprise" });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/pricing/downgrade", () => {
    const token = createToken([]);

    it("should downgrade tier", async () => {
      tieredPricingService.downgradeTier.mockResolvedValue({
        newTier: "free",
        effectiveDate: "2026-03-01",
      });
      advancedMonitoringService.logBusinessEvent.mockReturnValue(undefined);

      const response = await request(app)
        .post("/api/pricing/downgrade")
        .set("Authorization", `Bearer ${token}`)
        .send({ tier: "free" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.newTier).toBe("free");
      expect(advancedMonitoringService.logBusinessEvent).toHaveBeenCalledWith("tier_downgraded", {
        userId: "test-user-id",
        newTier: "free",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/pricing/downgrade").send({ tier: "free" });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/pricing/cancel", () => {
    const token = createToken([]);

    it("should cancel subscription", async () => {
      tieredPricingService.cancelSubscription.mockResolvedValue({
        success: true,
        cancellationDate: "2026-03-01",
      });
      advancedMonitoringService.logBusinessEvent.mockReturnValue(undefined);

      const response = await request(app)
        .post("/api/pricing/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(advancedMonitoringService.logBusinessEvent).toHaveBeenCalledWith(
        "subscription_canceled",
        { userId: "test-user-id" },
      );
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).post("/api/pricing/cancel");

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // REFERRAL PROGRAM
  // ============================================

  describe("GET /api/referrals/link", () => {
    const token = createToken([]);

    it("should return referral link", async () => {
      referralProgramService.createReferralLink.mockResolvedValue({
        code: "REF123",
        url: "https://example.com/signup?ref=REF123",
      });

      const response = await request(app)
        .get("/api/referrals/link")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe("REF123");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/referrals/link");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/referrals/stats", () => {
    const token = createToken([]);

    it("should return referral stats", async () => {
      referralProgramService.getUserReferralStats.mockResolvedValue({
        totalReferrals: 10,
        convertedReferrals: 5,
        pendingRewards: 50,
      });

      const response = await request(app)
        .get("/api/referrals/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.totalReferrals).toBe(10);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/referrals/stats");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/referrals/leaderboard", () => {
    it("should return default leaderboard", async () => {
      referralProgramService.getLeaderboard.mockResolvedValue([
        { userId: "user-1", referrals: 20 },
        { userId: "user-2", referrals: 15 },
      ]);

      const response = await request(app).get("/api/referrals/leaderboard");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(referralProgramService.getLeaderboard).toHaveBeenCalledWith(10);
    });

    it("should accept custom limit", async () => {
      referralProgramService.getLeaderboard.mockResolvedValue([
        { userId: "user-1", referrals: 20 },
      ]);

      await request(app).get("/api/referrals/leaderboard?limit=5");

      expect(referralProgramService.getLeaderboard).toHaveBeenCalledWith(5);
    });
  });

  describe("POST /api/referrals/track-signup", () => {
    it("should track referral signup", async () => {
      referralProgramService.trackReferralSignup.mockResolvedValue({
        id: "referral-123",
        referrerUserId: "user-1",
        referreeEmail: "referee@example.com",
        fraudDetected: false,
      });

      const response = await request(app).post("/api/referrals/track-signup").send({
        referrerUserId: "user-1",
        referreeEmail: "referee@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fraudDetected).toBe(false);
    });

    it("should include fraud detection result", async () => {
      referralProgramService.trackReferralSignup.mockResolvedValue({
        id: "referral-123",
        referrerUserId: "user-1",
        referreeEmail: "fraud@example.com",
        fraudDetected: true,
      });

      const response = await request(app).post("/api/referrals/track-signup").send({
        referrerUserId: "user-1",
        referreeEmail: "fraud@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body.fraudDetected).toBe(true);
    });
  });

  describe("POST /api/referrals/mark-converted", () => {
    const token = createToken(["admin:referrals"]);

    it("should mark referral as converted", async () => {
      referralProgramService.markReferralConverted.mockResolvedValue({
        id: "referral-123",
        converted: true,
        convertedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post("/api/referrals/mark-converted")
        .set("Authorization", `Bearer ${token}`)
        .send({ referralId: "referral-123", referreeUserId: "user-2" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.referral.converted).toBe(true);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/referrals/mark-converted")
        .send({ referralId: "referral-123", referreeUserId: "user-2" });

      expect(response.status).toBe(401);
    });

    it("should return 403 without admin:referrals scope", async () => {
      const tokenNoScope = createToken([]);

      const response = await request(app)
        .post("/api/referrals/mark-converted")
        .set("Authorization", `Bearer ${tokenNoScope}`)
        .send({ referralId: "referral-123", referreeUserId: "user-2" });

      expect(response.status).toBe(403);
    });
  });

  // ============================================
  // BUSINESS EVENT LOGGING
  // ============================================

  describe("POST /api/events/log", () => {
    const token = createToken([]);

    it("should log business event", async () => {
      advancedMonitoringService.logBusinessEvent.mockReturnValue(undefined);

      const response = await request(app)
        .post("/api/events/log")
        .set("Authorization", `Bearer ${token}`)
        .send({
          eventName: "custom_event",
          eventData: { action: "clicked_button" },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(advancedMonitoringService.logBusinessEvent).toHaveBeenCalledWith("custom_event", {
        userId: "test-user-id",
        action: "clicked_button",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/events/log")
        .send({ eventName: "test_event", eventData: {} });

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // MIDDLEWARE INTEGRATION
  // ============================================

  describe("Middleware Integration", () => {
    it("should apply general rate limiting", async () => {
      await request(app).get("/api/compliance/gdpr/checklist");

      // No rate limiter on this route
      expect(limiters.general).not.toHaveBeenCalled();
    });

    it("should apply billing rate limiting to checkout", async () => {
      const token = createToken([]);
      tieredPricingService.createCheckoutSession.mockResolvedValue({
        id: "session-123",
        url: "https://example.com",
      });

      await request(app)
        .post("/api/pricing/checkout")
        .set("Authorization", `Bearer ${token}`)
        .send({ tier: "pro" });

      expect(limiters.billing).toHaveBeenCalled();
    });
  });
});
