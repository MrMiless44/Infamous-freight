/**
 * Analytics API Routes
 * Exposes driver/shipper dashboards, leaderboards, market analysis
 */

const express = require("express");
const { query, validationResult } = require("express-validator");
const analyticsService = require("../services/analyticsService").getInstance();
const { authenticate, requireScope } = require("../middleware/security");
const logger = require("../middleware/logger");

const router = express.Router();

/**
 * GET /api/analytics/driver/dashboard
 * Driver personal dashboard
 */
router.get("/driver/dashboard", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const daysBack = parseInt(req.query.days || "7");

    if (daysBack < 1 || daysBack > 365) {
      return res.status(400).json({
        success: false,
        error: "Days must be between 1 and 365",
      });
    }

    const dashboard = await analyticsService.getDriverDashboard(userId, daysBack);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (err) {
    logger.error("Analytics: Driver dashboard failed", { error: err.message });
    next(err);
  }
});

/**
 * GET /api/analytics/driver/trends
 * Revenue and performance trends over time
 */
router.get("/driver/trends", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const months = parseInt(req.query.months || "12");

    if (months < 1 || months > 36) {
      return res.status(400).json({
        success: false,
        error: "Months must be between 1 and 36",
      });
    }

    const trends = await analyticsService.getRevenueTrends(userId, months);

    res.json({
      success: true,
      data: trends,
    });
  } catch (err) {
    logger.error("Analytics: Trends failed", { error: err.message });
    next(err);
  }
});

/**
 * GET /api/analytics/leaderboard
 * Performance leaderboard (public)
 */
router.get("/leaderboard", async (req, res, next) => {
  try {
    const metric = req.query.metric || "earnings";
    const limit = Math.min(parseInt(req.query.limit || "50"), 100);

    if (!["earnings", "rating", "loads"].includes(metric)) {
      return res.status(400).json({
        success: false,
        error: "Invalid metric. Must be: earnings, rating, or loads",
      });
    }

    const leaderboard = await analyticsService.getLeaderboard(metric, limit);

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (err) {
    logger.error("Analytics: Leaderboard failed", { error: err.message });
    next(err);
  }
});

/**
 * GET /api/analytics/market
 * Market analysis for corridor
 */
router.get("/market", async (req, res, next) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: "origin and destination are required",
      });
    }

    const analysis = await analyticsService.getMarketAnalysis(origin, destination);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    logger.error("Analytics: Market analysis failed", { error: err.message });
    next(err);
  }
});

/**
 * GET /api/analytics/shipper/dashboard
 * Shipper organization dashboard
 */
router.get("/shipper/dashboard", authenticate, async (req, res, next) => {
  try {
    // Verify user is shipper
    if (req.user.role !== "shipper") {
      return res.status(403).json({
        success: false,
        error: "Forbidden - shipper role required",
      });
    }

    const organizationId = req.user.organizationId;
    const daysBack = parseInt(req.query.days || "30");

    if (daysBack < 1 || daysBack > 365) {
      return res.status(400).json({
        success: false,
        error: "Days must be between 1 and 365",
      });
    }

    const dashboard = await analyticsService.getShipperDashboard(organizationId, daysBack);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (err) {
    logger.error("Analytics: Shipper dashboard failed", { error: err.message });
    next(err);
  }
});

module.exports = router;
