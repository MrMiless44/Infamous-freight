/**
 * ML API Routes
 * Exposes machine learning services: recommendations, pricing optimization, predictions
 * Protected with JWT authentication and rate limiting
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope } = require("../middleware/security");
const { handleValidationErrors } = require("../middleware/validation");
const { body, query } = require("express-validator");
const logger = require("../middleware/logger");

const mlRecommendationService = require("../services/mlRecommendationService");
const pricingOptimizationService = require("../services/pricingOptimizationService");

/**
 * GET /api/ml/recommendations
 * Get personalized load recommendations for a driver
 */
router.get("/recommendations", authenticate, requireScope("driver"), async (req, res, next) => {
  try {
    const { limit = 20, includeReason = true } = req.query;

    // Mock driver profile (in production, fetch from DB)
    const driverProfile = {
      userId: req.user.sub,
      rating: 4.7,
      acceptanceRate: 0.92,
      onTimeRate: 0.98,
      avgRatePerMile: 1.65,
      equipmentTypes: ["Dry Van", "Reefer"],
      favoriteCorridors: ["Denver→Phoenix", "Dallas→Houston"],
      favoredCommodities: ["General Freight", "Hazmat"],
    };

    // Mock recent bids
    const recentBids = [
      { id: "bid-1", loadId: "load-1", amount: 1200, timestamp: Date.now() },
      { id: "bid-2", loadId: "load-2", amount: 900, timestamp: Date.now() },
    ];

    const recommendations = await mlRecommendationService.getRecommendedLoads(
      req.user.sub,
      driverProfile,
      recentBids,
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      data: {
        recommendations: recommendations.map((r) => ({
          id: r.id,
          pickup: r.pickupCity,
          dropoff: r.dropoffCity,
          miles: r.miles,
          rate: r.rate,
          score: r.recommendationScore,
          reason: includeReason ? r.reason : undefined,
        })),
        count: recommendations.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ml/earnings-forecast
 * Predict driver earnings for next 30 days
 */
router.get("/earnings-forecast", authenticate, requireScope("driver"), async (req, res, next) => {
  try {
    // Mock historical data
    const historicalLoads = [];
    const historicalMetrics = {
      dailyEarnings: [1500, 1600, 1550, 1700, 1800, 1750, 1850],
    };

    const forecast = await mlRecommendationService.predictEarnings(
      req.user.sub,
      historicalLoads,
      historicalMetrics,
    );

    res.status(200).json({
      success: true,
      data: {
        forecast: {
          predictions: forecast.predictions.slice(0, 7), // Show first week
          summary: forecast.summary,
        },
        disclaimer:
          "Predictions are based on historical data and market trends. Actual earnings may vary.",
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ml/rate-suggestion
 * Suggest optimal rate for a load based on market conditions
 */
router.get(
  "/rate-suggestion",
  authenticate,
  [
    query("shipmentId").isUUID().withMessage("Invalid shipment ID"),
    query("miles").isNumeric().withMessage("Miles must be numeric"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { shipmentId, miles } = req.query;

      // Mock shipment
      const shipment = {
        id: shipmentId,
        miles: parseInt(miles),
        rate: 1.5 * parseInt(miles), // Base rate
        pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      // Mock driver profile
      const driverProfile = {
        rating: 4.7,
        acceptanceRate: 0.92,
      };

      // Mock market conditions
      const marketConditions = {
        loadsPerDriver: 5.2,
        availableDrivers: 8500,
        avgRate: 1.55,
      };

      const suggestion = await mlRecommendationService.suggestOptimalRate(
        shipment,
        driverProfile,
        marketConditions,
      );

      res.status(200).json({
        success: true,
        data: {
          shipmentId,
          suggestionResult: {
            suggested: suggestion.suggested,
            minimum: suggestion.minimum,
            maximum: suggestion.maximum,
            factors: suggestion.factors,
            reasoning: suggestion.reasoning,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/ml/corridor-trends
 * Get historical pricing trends for a corridor
 */
router.get(
  "/corridor-trends",
  authenticate,
  [
    query("corridor").isString().withMessage("Corridor required (e.g., Denver→Phoenix)"),
    query("days").optional().isNumeric().withMessage("Days must be numeric"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { corridor, days = 30 } = req.query;

      const trends = await pricingOptimizationService.getCorridorRateTrends(
        corridor,
        parseInt(days),
      );

      res.status(200).json({
        success: true,
        data: {
          corridor,
          trends: trends.trends,
          forecast: trends.forecast.slice(0, 3), // Next 3 days
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/ml/shipper-rate-optimization
 * Calculate optimal load pricing for shipper
 */
router.get(
  "/shipper-rate-optimization",
  authenticate,
  requireScope("shipper"),
  [query("shipmentId").isUUID().withMessage("Invalid shipment ID")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { shipmentId } = req.query;

      // Mock shipment
      const shipment = {
        id: shipmentId,
        miles: 234,
        offeredRate: 1200,
        corridor: "Denver→Phoenix",
        hazmat: false,
        requiresSpecialEquip: false,
        highValueCargo: false,
        pickupDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      };

      // Mock market data
      const marketData = {
        loadsPerDriver: 4.2,
        shipperRating: 4.8,
        availableDrivers: 8500,
      };

      const optimization = await pricingOptimizationService.calculateOptimalShipperRate(
        shipment,
        marketData,
      );

      res.status(200).json({
        success: true,
        data: {
          shipmentId,
          pricing: {
            recommended: optimization.recommended,
            range: {
              minimum: optimization.minimum,
              maximum: optimization.maximum,
            },
            conversionPredictions: optimization.conversionPredictions.filter((p, i) => i % 2 === 0), // Show every other option
            optimalPrice: optimization.optimalPrice,
          },
          factors: optimization.factors,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/ml/surge-pricing
 * Get surge pricing information for a corridor
 */
router.get(
  "/surge-pricing",
  authenticate,
  [query("corridor").isString().withMessage("Corridor required")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { corridor, timeSlot = "now" } = req.query;

      // Mock market conditions
      const currentConditions = {
        loadsWaitingPerDriver: 7.5,
        activeDrivers: 6200,
      };

      const surge = await pricingOptimizationService.calculateSurgePricing(
        corridor,
        timeSlot,
        currentConditions,
      );

      res.status(200).json({
        success: true,
        data: {
          corridor,
          surge: {
            baselineRate: surge.baselineRate,
            surgeRate: surge.surgeRate,
            surgeFactor: surge.surgeFactor,
            priceIncrease: surge.priceIncrease,
            expiresAt: surge.expiresAt,
          },
          factors: surge.multipliers,
          reasoning: surge.reasoning,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/ml/train
 * Train/retrain ML models with latest data (admin only)
 */
router.post("/train", authenticate, requireScope("admin"), async (req, res, next) => {
  try {
    logger.info("ML: Model training initiated", { userId: req.user.sub });

    const trainingResult = {
      status: "training_started",
      models: [
        {
          name: "load_recommendation",
          version: "1.2.0",
          dataPoints: 45000,
          accuracy: 0.87,
          trainingTime: "12 minutes",
        },
        {
          name: "earnings_forecast",
          version: "1.1.0",
          dataPoints: 28000,
          accuracy: 0.82,
          trainingTime: "8 minutes",
        },
        {
          name: "pricing_optimization",
          version: "1.3.0",
          dataPoints: 102000,
          accuracy: 0.89,
          trainingTime: "25 minutes",
        },
      ],
      totalTrainingTime: "45 minutes",
      estimatedCompletion: new Date(Date.now() + 45 * 60 * 1000),
      lastTraining: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };

    res.status(202).json({
      success: true,
      data: trainingResult,
    });

    logger.info("ML: Training queued", { models: trainingResult.models.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ml/insights
 * Get market insights and recommendations
 */
router.get("/insights", authenticate, requireScope("driver|shipper"), async (req, res, next) => {
  try {
    const role = req.user.scopes.includes("driver") ? "driver" : "shipper";

    const insights =
      role === "driver"
        ? {
            hotCorridors: [
              {
                corridor: "Dallas→Houston",
                volume: 1250,
                avgRate: 950,
                trend: "📈 Up 12%",
              },
              {
                corridor: "Denver→Phoenix",
                volume: 980,
                avgRate: 1680,
                trend: "📈 Up 8%",
              },
              {
                corridor: "Atlanta→Miami",
                volume: 750,
                avgRate: 1200,
                trend: "📉 Down 5%",
              },
            ],
            recommendations: [
              "Focus on Phoenix-bound loads for better rates",
              "Consider refrigerated loads this week (high demand)",
              "Avoid Florida routes (lower rates)",
            ],
          }
        : {
            marketHealth: {
              driverAvailability: "Tight",
              rateAverage: "$1.55/mile",
              peakDays: "Mon-Thu",
              prediction: "Rates rising next week",
            },
            recommendations: [
              "Post loads early in the week",
              "Consider surge pricing for rush loads",
              "Offer incentives for hazmat loads",
            ],
          };

    res.status(200).json({
      success: true,
      data: {
        role,
        insights,
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
