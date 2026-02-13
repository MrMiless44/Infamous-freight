/**
 * Feedback Routes Tests
 * Tests for user feedback collection and management
 *
 * Routes tested:
 * - POST /api/feedback - Submit feedback
 * - GET /api/feedback - Get feedback (with filters)
 * - GET /api/feedback/stats - Get feedback statistics
 * - PATCH /api/feedback/:id/status - Update feedback status
 * - POST /api/feedback/track1-validation - Submit Track 1 validation feedback
 */

const request = require("supertest");
const express = require("express");
const path = require("path");
const { generateTestJWT } = require("../../__tests__/helpers/jwt");

// Mock fs module to prevent actual file operations
jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  readFileSync: jest.fn(() => JSON.stringify({ test: "data" })),
  rmSync: jest.fn(),
}));

// Mock dependencies
jest.mock("../../middleware/security", () => ({
  limiters: {
    general: (req, res, next) => next(),
  },
  authenticate: (req, res, next) => {
    const auth = req.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const jwt = require("jsonwebtoken");
      req.user = jwt.decode(auth.replace("Bearer ", ""));
      if (!req.user) throw new Error("Invalid token");
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  },
  requireScope: (scope) => (req, res, next) => {
    if (!req.user || !req.user.scopes || !req.user.scopes.includes(scope)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  },
  auditLog: (req, res, next) => next(),
}));

jest.mock("../../middleware/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocks
const feedbackRouter = require("../feedback");
const fs = require("fs");

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/feedback", feedbackRouter);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

// Test suite
describe("Feedback Routes", () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe("POST /api/feedback", () => {
    it("should submit feedback successfully", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["feedback:submit"],
      });

      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          category: "feature_request",
          title: "Add dark mode",
          description: "Please add a dark mode option for better nighttime viewing",
          rating: 5,
          metadata: { page: "settings" },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toMatch(/^fb_/);
      expect(response.body.data.category).toBe("feature_request");
      expect(response.body.data.title).toBe("Add dark mode");
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.user_id).toBe("user_123");
      expect(response.body.message).toBe("Thank you for your feedback!");
    });

    it("should reject invalid category", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["feedback:submit"],
      });

      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          category: "invalid_category",
          title: "Test",
          description: "Test description",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid category");
      expect(response.body.allowed).toBeDefined();
    });

    it("should reject feedback without authentication", async () => {
      const response = await request(app).post("/api/feedback").send({
        category: "general",
        title: "Test",
        description: "Test description",
      });

      expect(response.status).toBe(401);
    });

    it("should reject missing required fields", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["feedback:submit"],
      });

      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          category: "general",
        });

      expect(response.status).toBe(400);
    });

    it("should handle bug reports", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["feedback:submit"],
      });

      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          category: "bug_report",
          title: "Login button not working",
          description: "The login button does not respond when clicked",
          rating: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.category).toBe("bug_report");
      expect(response.body.data.status).toBe("new");
    });

    it("should handle optional screenshot URL", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["feedback:submit"],
      });

      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          category: "ui_ux",
          title: "UI improvement",
          description: "Button placement could be better",
          screenshot_url: "https://example.com/screenshot.png",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.screenshot_url).toBe("https://example.com/screenshot.png");
    });
  });

  describe("GET /api/feedback", () => {
    beforeEach(async () => {
      // Reset fs mocks
      jest.clearAllMocks();

      // Mock readFileSync to return feedback data
      const mockFeedback = [
        {
          category: "feature_request",
          title: "Feature 1",
          description: "Description 1",
          rating: 5,
          status: "new",
          created_at: new Date().toISOString(),
        },
        {
          category: "bug_report",
          title: "Bug 1",
          description: "Description 2",
          rating: 2,
          status: "new",
          created_at: new Date().toISOString(),
        },
      ];

      fs.readFileSync.mockReturnValue(mockFeedback.map((f) => JSON.stringify(f)).join("\n"));
    });

    it("should get all feedback", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:read"],
      });

      const response = await request(app)
        .get("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.count).toBe(2);
    });

    it("should filter feedback by category", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:read"],
      });

      const response = await request(app)
        .get("/api/feedback?category=bug_report")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].category).toBe("bug_report");
    });

    it("should filter feedback by rating", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:read"],
      });

      const response = await request(app)
        .get("/api/feedback?rating=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].rating).toBe(5);
    });

    it("should return empty array when no feedback exists", async () => {
      // Mock file doesn't exist
      fs.existsSync.mockReturnValue(false);

      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:read"],
      });

      const response = await request(app)
        .get("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe("GET /api/feedback/stats", () => {
    beforeEach(async () => {
      // Reset fs mocks
      jest.clearAllMocks();
      fs.existsSync.mockReturnValue(true);

      // Mock readFileSync to return feedback data
      const mockFeedback = [
        {
          category: "feature_request",
          title: "Feature 1",
          description: "Description 1",
          rating: 5,
          status: "new",
          created_at: new Date().toISOString(),
        },
        {
          category: "bug_report",
          title: "Bug 1",
          description: "Description 2",
          rating: 3,
          status: "new",
          created_at: new Date().toISOString(),
        },
        {
          category: "bug_report",
          title: "Bug 1",
          description: "Same bug again",
          rating: 4,
          status: "new",
          created_at: new Date().toISOString(),
        },
      ];

      fs.readFileSync.mockReturnValue(mockFeedback.map((f) => JSON.stringify(f)).join("\n"));
    });

    it("should get feedback statistics", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:stats"],
      });

      const response = await request(app)
        .get("/api/feedback/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.by_category).toBeDefined();
      expect(response.body.data.by_rating).toBeDefined();
      expect(response.body.data.avg_rating).toBeGreaterThan(0);
    });

    it("should calculate average rating correctly", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:stats"],
      });

      const response = await request(app)
        .get("/api/feedback/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // (5 + 3 + 4) / 3 = 4.0
      expect(response.body.data.avg_rating).toBe(4.0);
    });

    it("should return count by category", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:stats"],
      });

      const response = await request(app)
        .get("/api/feedback/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.by_category.feature_request).toBe(1);
      expect(response.body.data.by_category.bug_report).toBe(2);
    });

    it("should identify top issues", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:stats"],
      });

      const response = await request(app)
        .get("/api/feedback/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.top_issues).toBeDefined();
      expect(Array.isArray(response.body.data.top_issues)).toBe(true);
    });

    it("should handle empty feedback gracefully", async () => {
      // Mock file doesn't exist
      fs.existsSync.mockReturnValue(false);

      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:stats"],
      });

      const response = await request(app)
        .get("/api/feedback/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.avg_rating).toBe(0);
    });
  });

  describe("PATCH /api/feedback/:id/status", () => {
    const feedbackId = "fb_1234567890_abc123";

    beforeEach(async () => {
      // Reset fs mocks
      jest.clearAllMocks();
      fs.existsSync.mockReturnValue(true);

      // Mock readFileSync to return existing feedback
      const mockFeedback = {
        id: feedbackId,
        category: "bug_report",
        title: "Bug to track",
        description: "This bug needs status updates",
        status: "new",
        created_at: new Date().toISOString(),
      };

      fs.readFileSync.mockReturnValue(JSON.stringify(mockFeedback, null, 2));
    });

    it("should update feedback status", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:admin"],
      });

      const response = await request(app)
        .patch(`/api/feedback/${feedbackId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "in_review",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("in_review");
      expect(response.body.data.updated_by).toBe("admin_123");
    });

    it("should reject invalid status", async () => {
      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:admin"],
      });

      const response = await request(app)
        .patch(`/api/feedback/${feedbackId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "invalid_status",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid status");
      expect(response.body.allowed).toBeDefined();
    });

    it("should return 404 for non-existent feedback", async () => {
      // Mock file doesn't exist for this feedback ID
      fs.existsSync.mockReturnValue(false);

      const authToken = generateTestJWT({
        sub: "admin_123",
        email: "admin@test.com",
        scopes: ["feedback:admin"],
      });

      const response = await request(app)
        .patch("/api/feedback/fb_nonexistent/status")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          status: "resolved",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Feedback not found");
    });
  });

  describe("POST /api/feedback/track1-validation", () => {
    it("should submit Track 1 validation feedback", async () => {
      const authToken = generateTestJWT({
        sub: "validator_123",
        email: "validator@test.com",
        scopes: ["validation:submit"],
      });

      const response = await request(app)
        .post("/api/feedback/track1-validation")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          performance_rating: 5,
          security_rating: 4,
          reliability_rating: 5,
          comments: "Excellent implementation",
          concerns: ["Minor logging issue"],
          recommendations: ["Add more tests"],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toMatch(/^track1_/);
      expect(response.body.data.ratings.overall).toBe("4.7");
      expect(response.body.message).toContain("Thank you");
    });

    it("should calculate overall rating correctly", async () => {
      const authToken = generateTestJWT({
        sub: "validator_123",
        email: "validator@test.com",
        scopes: ["validation:submit"],
      });

      const response = await request(app)
        .post("/api/feedback/track1-validation")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          performance_rating: 3,
          security_rating: 4,
          reliability_rating: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.ratings.overall).toBe("4.0");
    });

    it("should reject without authentication", async () => {
      const response = await request(app).post("/api/feedback/track1-validation").send({
        performance_rating: 5,
        security_rating: 5,
        reliability_rating: 5,
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Security & Validation", () => {
    it("should require authentication for all endpoints", async () => {
      const endpoints = [
        { method: "post", path: "/api/feedback" },
        { method: "get", path: "/api/feedback" },
        { method: "get", path: "/api/feedback/stats" },
        { method: "patch", path: "/api/feedback/fb_test/status" },
        { method: "post", path: "/api/feedback/track1-validation" },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path).send({});

        expect(response.status).toBe(401);
      }
    });

    it("should validate rating range (1-5)", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["feedback:submit"],
      });

      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          category: "general",
          title: "Test",
          description: "Test description",
          rating: 10, // Invalid rating
        });

      expect(response.status).toBe(400);
    });

    it("should handle metadata as optional", async () => {
      const authToken = generateTestJWT({
        sub: "user_123",
        email: "user@test.com",
        scopes: ["feedback:submit"],
      });

      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          category: "general",
          title: "Test without metadata",
          description: "Test description",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.metadata).toBeDefined();
    });
  });
});
