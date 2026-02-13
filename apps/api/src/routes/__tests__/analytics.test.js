const express = require("express");
const request = require("supertest");

// Mock the analytics service first
const mockAnalyticsService = {
  getShipmentMetrics: jest.fn(),
  forecastRevenue: jest.fn(),
  getRegionalAnalytics: jest.fn(),
  getDriverAnalytics: jest.fn(),
  getCustomerSatisfaction: jest.fn(),
  getCostAnalysis: jest.fn(),
};

jest.mock("../../services/analytics", () => mockAnalyticsService);

jest.mock("../../middleware/security", () => ({
  authenticate: jest.fn((req, res, next) => {
    const authHeader = req.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const jwt = require("jsonwebtoken");
      req.user = jwt.decode(authHeader.replace("Bearer ", ""));
      if (!req.user) throw new Error("Invalid token");
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  }),
  requireScope: jest.fn((scope) => (req, res, next) => {
    if (!req.user || !req.user.scopes || !req.user.scopes.includes(scope)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  }),
}));

// Now require the router after mocks are set up
const analyticsRouter = require("../analytics");

// Create test app
const app = express();
app.use(express.json());
app.use("/api/analytics", analyticsRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Helper to create JWT token
const jwt = require("jsonwebtoken");
const createToken = (scopes = []) => {
  return jwt.sign({ sub: "user123", scopes }, "test-secret", { expiresIn: "1h" });
};

describe("Analytics Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/analytics/performance", () => {
    it("should return shipment performance metrics", async () => {
      const mockMetrics = {
        totalShipments: 150,
        completedShipments: 125,
        averageDeliveryTime: 2.5,
        onTimeDeliveryRate: 0.92,
      };
      mockAnalyticsService.getShipmentMetrics.mockResolvedValue(mockMetrics);

      const token = createToken(["analytics:read"]);
      const response = await request(app)
        .get("/api/analytics/performance")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toEqual(mockMetrics);
      expect(response.body.data).toHaveProperty("timestamp");
      expect(mockAnalyticsService.getShipmentMetrics).toHaveBeenCalledWith({
        startDate: null,
        endDate: null,
        region: undefined,
        status: undefined,
      });
    });

    it("should accept date filters", async () => {
      mockAnalyticsService.getShipmentMetrics.mockResolvedValue({});

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/performance")
        .query({ startDate: "2026-01-01", endDate: "2026-01-31" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockAnalyticsService.getShipmentMetrics).toHaveBeenCalledWith({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        region: undefined,
        status: undefined,
      });
    });

    it("should accept region filter", async () => {
      mockAnalyticsService.getShipmentMetrics.mockResolvedValue({});

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/performance")
        .query({ region: "US-WEST" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockAnalyticsService.getShipmentMetrics).toHaveBeenCalledWith({
        startDate: null,
        endDate: null,
        region: "US-WEST",
        status: undefined,
      });
    });

    it("should accept status filter", async () => {
      mockAnalyticsService.getShipmentMetrics.mockResolvedValue({});

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/performance")
        .query({ status: "delivered" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockAnalyticsService.getShipmentMetrics).toHaveBeenCalledWith({
        startDate: null,
        endDate: null,
        region: undefined,
        status: "delivered",
      });
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/analytics/performance").expect(401);
    });

    it("should return 403 when missing analytics:read scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .get("/api/analytics/performance")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should handle service errors", async () => {
      mockAnalyticsService.getShipmentMetrics.mockRejectedValue(new Error("Service error"));

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/performance")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);
    });
  });

  describe("GET /api/analytics/revenue", () => {
    it("should return revenue forecast for default 3 months", async () => {
      const mockForecast = [
        { month: "Feb 2026", predicted: 125000, confidence: 0.85 },
        { month: "Mar 2026", predicted: 130000, confidence: 0.82 },
        { month: "Apr 2026", predicted: 135000, confidence: 0.78 },
      ];
      mockAnalyticsService.forecastRevenue.mockResolvedValue(mockForecast);

      const token = createToken(["analytics:read"]);
      const response = await request(app)
        .get("/api/analytics/revenue")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.forecast).toEqual(mockForecast);
      expect(response.body.data).toHaveProperty("generatedAt");
      expect(mockAnalyticsService.forecastRevenue).toHaveBeenCalledWith(3);
    });

    it("should accept custom monthsAhead parameter", async () => {
      mockAnalyticsService.forecastRevenue.mockResolvedValue([]);

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/revenue")
        .query({ monthsAhead: "6" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockAnalyticsService.forecastRevenue).toHaveBeenCalledWith(6);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/analytics/revenue").expect(401);
    });

    it("should return 403 when missing analytics:read scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .get("/api/analytics/revenue")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should handle service errors", async () => {
      mockAnalyticsService.forecastRevenue.mockRejectedValue(new Error("Service error"));

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/revenue")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);
    });
  });

  describe("GET /api/analytics/regions/:region", () => {
    it("should return regional analytics", async () => {
      const mockRegional = {
        region: "US-WEST",
        totalShipments: 500,
        averageDeliveryTime: 2.3,
        revenue: 75000,
        topDrivers: ["driver1", "driver2"],
      };
      mockAnalyticsService.getRegionalAnalytics.mockResolvedValue(mockRegional);

      const token = createToken(["analytics:read"]);
      const response = await request(app)
        .get("/api/analytics/regions/US-WEST")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRegional);
      expect(mockAnalyticsService.getRegionalAnalytics).toHaveBeenCalledWith("US-WEST");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/analytics/regions/US-WEST").expect(401);
    });

    it("should return 403 when missing analytics:read scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .get("/api/analytics/regions/US-WEST")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should handle service errors", async () => {
      mockAnalyticsService.getRegionalAnalytics.mockRejectedValue(new Error("Service error"));

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/regions/US-WEST")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);
    });
  });

  describe("GET /api/analytics/drivers", () => {
    it("should return driver performance analytics", async () => {
      const mockDrivers = [
        { id: "driver1", name: "John Doe", completedDeliveries: 150, rating: 4.8 },
        { id: "driver2", name: "Jane Smith", completedDeliveries: 125, rating: 4.9 },
      ];
      mockAnalyticsService.getDriverAnalytics.mockResolvedValue(mockDrivers);

      const token = createToken(["analytics:read"]);
      const response = await request(app)
        .get("/api/analytics/drivers")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.drivers).toEqual(mockDrivers);
      expect(response.body.data.totalDrivers).toBe(2);
      expect(mockAnalyticsService.getDriverAnalytics).toHaveBeenCalled();
    });

    it("should handle empty driver list", async () => {
      mockAnalyticsService.getDriverAnalytics.mockResolvedValue([]);

      const token = createToken(["analytics:read"]);
      const response = await request(app)
        .get("/api/analytics/drivers")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.drivers).toEqual([]);
      expect(response.body.data.totalDrivers).toBe(0);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/analytics/drivers").expect(401);
    });

    it("should return 403 when missing analytics:read scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .get("/api/analytics/drivers")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should handle service errors", async () => {
      mockAnalyticsService.getDriverAnalytics.mockRejectedValue(new Error("Service error"));

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/drivers")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);
    });
  });

  describe("GET /api/analytics/satisfaction", () => {
    it("should return customer satisfaction metrics", async () => {
      const mockSatisfaction = {
        overallScore: 4.6,
        nps: 72,
        totalResponses: 350,
        promoters: 250,
        passives: 75,
        detractors: 25,
      };
      mockAnalyticsService.getCustomerSatisfaction.mockResolvedValue(mockSatisfaction);

      const token = createToken(["analytics:read"]);
      const response = await request(app)
        .get("/api/analytics/satisfaction")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSatisfaction);
      expect(mockAnalyticsService.getCustomerSatisfaction).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/analytics/satisfaction").expect(401);
    });

    it("should return 403 when missing analytics:read scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .get("/api/analytics/satisfaction")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should handle service errors", async () => {
      mockAnalyticsService.getCustomerSatisfaction.mockRejectedValue(new Error("Service error"));

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/satisfaction")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);
    });
  });

  describe("GET /api/analytics/costs", () => {
    it("should return cost analysis", async () => {
      const mockCosts = {
        totalCosts: 45000,
        fuelCosts: 18000,
        laborCosts: 22000,
        maintenanceCosts: 5000,
        optimizationOpportunities: [
          { area: "routing", potentialSavings: 2500 },
          { area: "fuel", potentialSavings: 1800 },
        ],
      };
      mockAnalyticsService.getCostAnalysis.mockResolvedValue(mockCosts);

      const token = createToken(["analytics:read"]);
      const response = await request(app)
        .get("/api/analytics/costs")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCosts);
      expect(mockAnalyticsService.getCostAnalysis).toHaveBeenCalled();
    });

    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/analytics/costs").expect(401);
    });

    it("should return 403 when missing analytics:read scope", async () => {
      const token = createToken(["other:scope"]);

      await request(app)
        .get("/api/analytics/costs")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should handle service errors", async () => {
      mockAnalyticsService.getCostAnalysis.mockRejectedValue(new Error("Service error"));

      const token = createToken(["analytics:read"]);
      await request(app)
        .get("/api/analytics/costs")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);
    });
  });

  describe("Authentication and Authorization", () => {
    it("should require authentication for all endpoints", async () => {
      const endpoints = [
        "/api/analytics/performance",
        "/api/analytics/revenue",
        "/api/analytics/regions/US-WEST",
        "/api/analytics/drivers",
        "/api/analytics/satisfaction",
        "/api/analytics/costs",
      ];

      for (const endpoint of endpoints) {
        await request(app).get(endpoint).expect(401);
      }
    });

    it("should require analytics:read scope for all endpoints", async () => {
      const token = createToken(["other:scope"]);
      const endpoints = [
        "/api/analytics/performance",
        "/api/analytics/revenue",
        "/api/analytics/regions/US-WEST",
        "/api/analytics/drivers",
        "/api/analytics/satisfaction",
        "/api/analytics/costs",
      ];

      for (const endpoint of endpoints) {
        await request(app).get(endpoint).set("Authorization", `Bearer ${token}`).expect(403);
      }
    });
  });
});
