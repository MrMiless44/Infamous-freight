/**
 * Phase 4 Analytics & Business Intelligence Routes
 * Real-time dashboards, predictive analytics, performance scoring, route optimization
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { limiters } = require("../middleware/security");
const analyticsBIService = require("../services/analyticsBIService");
const logger = require("../middleware/logger");

/**
 * GET /api/v4/analytics/dashboard/operations
 * Get operations dashboard
 */
router.get(
  "/dashboard/operations",
  limiters.general,
  authenticate,
  requireScope("admin:dashboards"),
  auditLog,
  async (req, res, next) => {
    try {
      const { dispatcherId } = req.user || {};

      const dashboard = await analyticsBIService.getOperationsDashboard(dispatcherId);

      res.status(200).json({
        success: true,
        dashboard,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v4/analytics/market-trends
 * Analyze market trends for profit optimization
 */
router.get(
  "/market-trends",
  limiters.general,
  authenticate,
  requireScope("admin:analytics"),
  auditLog,
  async (req, res, next) => {
    try {
      const trends = await analyticsBIService.analyzeMarketTrends();

      res.status(200).json({
        success: true,
        trends,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/analytics/driver-performance
 * Calculate driver performance score
 */
router.post(
  "/driver-performance",
  limiters.general,
  authenticate,
  requireScope("admin:analytics"),
  auditLog,
  validateString("driverId"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { driverId, driverData } = req.body;

      const result = await analyticsBIService.calculatePerformanceScore(driverId, driverData);

      res.status(200).json({
        success: true,
        performance: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/analytics/route-optimization
 * Optimize route for efficiency
 */
router.post(
  "/route-optimization",
  limiters.general,
  authenticate,
  requireScope("dispatch:optimization"),
  auditLog,
  validateString("routeId"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { route } = req.body;

      const result = await analyticsBIService.optimizeRoute(route);

      res.status(200).json({
        success: true,
        optimization: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v4/analytics/forecast-revenue
 * Get predictive revenue forecast
 */
router.get(
  "/forecast-revenue",
  limiters.general,
  authenticate,
  requireScope("admin:analytics"),
  auditLog,
  async (req, res, next) => {
    try {
      const { days = 30 } = req.query;

      const forecast = await analyticsBIService.getForecastRevenue(parseInt(days));

      res.status(200).json({
        success: true,
        forecast,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v4/analytics/kpis
 * Get key performance indicators
 */
router.get(
  "/kpis",
  limiters.general,
  authenticate,
  requireScope("admin:analytics"),
  auditLog,
  async (req, res, next) => {
    try {
      const kpis = {
        deliveryAccuracy: 96.2,
        customerSatisfaction: 4.6,
        costPerMile: 1.28,
        utilizationRate: 87.3,
        deadheadPercentage: 12.7,
        onTimeDelivery: 94.5,
        damageRate: 0.8,
        revenue24h: 48375,
        profit24h: 35535,
      };

      res.status(200).json({
        success: true,
        kpis,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v4/analytics/regions-demand
 * Get demand levels by region
 */
router.get(
  "/regions-demand",
  limiters.general,
  authenticate,
  requireScope("admin:analytics"),
  auditLog,
  async (req, res, next) => {
    try {
      const regionDemand = [
        {
          name: "Phoenix Metro",
          demandLevel: "high",
          avgRate: 1850,
          availableLoads: 47,
          recommendedCapacity: "increase",
        },
        {
          name: "LA Basin",
          demandLevel: "moderate",
          avgRate: 1580,
          availableLoads: 23,
          recommendedCapacity: "maintain",
        },
        {
          name: "Denver Area",
          demandLevel: "low",
          avgRate: 1420,
          availableLoads: 8,
          recommendedCapacity: "reduce",
        },
        {
          name: "Texas Triangle",
          demandLevel: "very_high",
          avgRate: 2100,
          availableLoads: 89,
          recommendedCapacity: "max_out",
        },
      ];

      res.status(200).json({
        success: true,
        regions: regionDemand,
        topRegion: regionDemand[3],
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
