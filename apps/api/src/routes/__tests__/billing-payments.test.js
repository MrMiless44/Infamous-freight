const express = require("express");
const request = require("supertest");

// Mock logger
const mockLogger = { info: jest.fn() };
jest.mock("../../middleware/logger", () => ({ logger: mockLogger }));

// Mock security middleware
jest.mock("../../middleware/security", () => ({
  authenticate: jest.fn((req, res, next) => {
    const authHeader = req.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const jwt = require("jsonwebtoken");
    req.user = jwt.decode(authHeader.replace("Bearer ", ""));
    next();
  }),
  requireScope: jest.fn((scope) => (req, res, next) => {
    if (!req.user || !req.user.scopes || !req.user.scopes.includes(scope)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    next();
  }),
  limiters: {
    billing: jest.fn((req, res, next) => next()),
    general: jest.fn((req, res, next) => next()),
  },
  auditLog: jest.fn((req, res, next) => next()),
}));

// Mock validation
jest.mock("../../middleware/validation", () => ({
  handleValidationErrors: jest.fn((req, res, next) => next()),
}));

// Mock express-validator
jest.mock("express-validator", () => ({
  body: jest.fn(() => ({
    isFloat: jest.fn(() => ({
      withMessage: jest.fn(() => (req, res, next) => next()),
    })),
    isString: jest.fn(() => ({
      notEmpty: jest.fn(() => (req, res, next) => next()),
      trim: jest.fn(() => (req, res, next) => next()),
    })),
    optional: jest.fn(() => ({
      isString: jest.fn(() => ({
        trim: jest.fn(() => (req, res, next) => next()),
      })),
      isIn: jest.fn(() => ({
        withMessage: jest.fn(() => (req, res, next) => next()),
      })),
    })),
  })),
}));

// Now require router
const billingPaymentsRouter = require("../billing-payments");

// Create test app
const app = express();
app.use(express.json());
app.use("/api/billing", billingPaymentsRouter);
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ success: false, error: err.message || "Internal Server Error" });
});

// Helper to create JWT token
const jwt = require("jsonwebtoken");
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "user123", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("Billing Payments Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/billing/payment-intent", () => {
    it("should create payment intent successfully", async () => {
      const token = createToken(["billing:payment"]);
      const response = await request(app)
        .post("/api/billing/payment-intent")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 99.99,
          currency: "USD",
          description: "Test payment",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toMatch(/^pi_test_/);
      expect(response.body.data.amount).toBe(99.99);
      expect(response.body.data.currency).toBe("USD");
      expect(response.body.data.status).toBe("requires_payment_method");
      expect(mockLogger.info).toHaveBeenCalledWith("Payment intent created", expect.any(Object));
    });

    it("should default to USD currency", async () => {
      const token = createToken(["billing:payment"]);
      const response = await request(app)
        .post("/api/billing/payment-intent")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 50.0 })
        .expect(200);

      expect(response.body.data.currency).toBe("USD");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).post("/api/billing/payment-intent").send({ amount: 99.99 }).expect(401);
    });

    it("should return 403 when missing billing:payment scope", async () => {
      const token = createToken(["other:scope"]);
      await request(app)
        .post("/api/billing/payment-intent")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 99.99 })
        .expect(403);
    });
  });

  describe("POST /api/billing/confirm-payment", () => {
    it("should confirm payment successfully", async () => {
      const token = createToken(["billing:payment"]);
      const response = await request(app)
        .post("/api/billing/confirm-payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ intentId: "pi_test_12345" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("succeeded");
      expect(response.body.data.paymentId).toBe("pi_test_12345");
      expect(mockLogger.info).toHaveBeenCalledWith("Payment confirmed", expect.any(Object));
    });

    it("should return 401 when not authenticated", async () => {
      await request(app)
        .post("/api/billing/confirm-payment")
        .send({ intentId: "pi_test_12345" })
        .expect(401);
    });

    it("should return 403 when missing billing:payment scope", async () => {
      const token = createToken(["billing:read"]);
      await request(app)
        .post("/api/billing/confirm-payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ intentId: "pi_test_12345" })
        .expect(403);
    });
  });

  describe("GET /api/billing/revenue", () => {
    it("should return revenue metrics", async () => {
      const token = createToken(["billing:admin"]);
      const response = await request(app)
        .get("/api/billing/revenue")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe("month");
      expect(response.body.data.totalRevenue).toBeDefined();
      expect(response.body.data.transactionCount).toBeDefined();
      expect(response.body.data.averageTransaction).toBeDefined();
      expect(response.body.data.currency).toBe("USD");
      expect(response.body.data.dateRange).toBeDefined();
    });

    it("should accept custom period parameter", async () => {
      const token = createToken(["billing:admin"]);
      const response = await request(app)
        .get("/api/billing/revenue")
        .query({ period: "year" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.period).toBe("year");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/billing/revenue").expect(401);
    });

    it("should return 403 when missing billing:admin scope", async () => {
      const token = createToken(["billing:read"]);
      await request(app)
        .get("/api/billing/revenue")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });

  describe("POST /api/billing/subscribe", () => {
    it("should create subscription successfully", async () => {
      const token = createToken(["billing:subscribe"]);
      const response = await request(app)
        .post("/api/billing/subscribe")
        .set("Authorization", `Bearer ${token}`)
        .send({ planId: "plan_professional" })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionId).toMatch(/^sub_/);
      expect(response.body.data.status).toBe("active");
      expect(response.body.data.planId).toBe("plan_professional");
      expect(response.body.data.renewalDate).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith("Subscription created", expect.any(Object));
    });

    it("should return 401 when not authenticated", async () => {
      await request(app)
        .post("/api/billing/subscribe")
        .send({ planId: "plan_professional" })
        .expect(401);
    });

    it("should return 403 when missing billing:subscribe scope", async () => {
      const token = createToken(["billing:read"]);
      await request(app)
        .post("/api/billing/subscribe")
        .set("Authorization", `Bearer ${token}`)
        .send({ planId: "plan_professional" })
        .expect(403);
    });
  });

  describe("GET /api/billing/transactions", () => {
    it("should return transaction history", async () => {
      const token = createToken(["billing:read"]);
      const response = await request(app)
        .get("/api/billing/transactions")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeInstanceOf(Array);
      expect(response.body.data.count).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith("Transactions retrieved", expect.any(Object));
    });

    it("should include transaction details", async () => {
      const token = createToken(["billing:read"]);
      const response = await request(app)
        .get("/api/billing/transactions")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const transaction = response.body.data.transactions[0];
      expect(transaction.id).toBeDefined();
      expect(transaction.amount).toBeDefined();
      expect(transaction.currency).toBe("USD");
      expect(transaction.status).toBe("completed");
      expect(transaction.date).toBeDefined();
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/billing/transactions").expect(401);
    });

    it("should return 403 when missing billing:read scope", async () => {
      const token = createToken(["other:scope"]);
      await request(app)
        .get("/api/billing/transactions")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });

  describe("Middleware Integration", () => {
    it("should apply rate limiting", async () => {
      const { limiters } = require("../../middleware/security");
      const token = createToken(["billing:payment"]);

      await request(app)
        .post("/api/billing/payment-intent")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 99.99 });

      expect(limiters.billing).toHaveBeenCalled();
    });

    it("should apply audit logging", async () => {
      const { auditLog } = require("../../middleware/security");
      const token = createToken(["billing:payment"]);

      await request(app)
        .post("/api/billing/payment-intent")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 99.99 });

      expect(auditLog).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", async () => {
      const token = createToken(["billing:payment"]);
      // Sending malformed data
      await request(app)
        .post("/api/billing/payment-intent")
        .set("Authorization", `Bearer ${token}`)
        .send("invalid")
        .expect(500);
    });
  });
});
