// apps/api/src/routes/phase8.advanced.js
const router = require("express").Router();
const { limiters } = require("../middleware/security");
const { authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");

// Import Phase 8 services
const { MLRouteOptimizationService } = require("../services/mlRouteOptimization");
const { FraudDetectionService } = require("../services/fraudDetection");
const { DynamicPricingService } = require("../services/dynamicPricing");
const { PredictiveAnalyticsService } = require("../services/predictiveAnalytics");
const { AIChatbotService } = require("../services/aiChatbot");
const { MultiCurrencyService } = require("../services/multiCurrency");
const { RealTimeTrackingService } = require("../services/realTimeTracking");
const { BlockchainVerificationService } = require("../services/blockchainVerification");
const { VoiceCommandService } = require("../services/voiceCommands");
const { DriverPerformanceScoringService } = require("../services/driverPerformanceScoring");
const { CustomerSatisfactionNPSService } = require("../services/customerSatisfactionNPS");
const { AdvancedSchedulingEngineService } = require("../services/advancedSchedulingEngine");
const { ARShipmentTrackingService } = require("../services/arShipmentTracking");
const { AdvancedReportingEngineService } = require("../services/advancedReportingEngine");

/**
 * ML Route Optimization
 */
router.post(
  "/ml/optimize-routes",
  limiters.general,
  authenticate,
  requireScope("ai:optimization"),
  auditLog,
  async (req, res, next) => {
    try {
      const { shipments, drivers } = req.body;
      const mlService = new MLRouteOptimizationService(req.prisma);
      const result = await mlService.optimizeRoutesML(shipments, drivers);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Fraud Detection
 */
router.post(
  "/fraud/analyze-payment",
  limiters.ai,
  authenticate,
  requireScope("fraud:detection"),
  auditLog,
  async (req, res, next) => {
    try {
      const { payment } = req.body;
      const fraudService = new FraudDetectionService(req.prisma);
      const result = await fraudService.analyzePaymentFraud(payment);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Dynamic Pricing
 */
router.post(
  "/pricing/calculate",
  limiters.general,
  authenticate,
  requireScope("pricing:calculate"),
  auditLog,
  async (req, res, next) => {
    try {
      const { shipment } = req.body;
      const pricingService = new DynamicPricingService(req.prisma);
      const result = await pricingService.calculateDynamicPrice(shipment);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Predictive Analytics
 */
router.get(
  "/analytics/forecast/revenue/:days",
  limiters.general,
  authenticate,
  requireScope("analytics:read"),
  auditLog,
  async (req, res, next) => {
    try {
      const { days } = req.params;
      const analyticsService = new PredictiveAnalyticsService(req.prisma);
      const result = await analyticsService.forecastRevenue(parseInt(days));

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * AI Chatbot
 */
router.post(
  "/chatbot/message",
  limiters.general,
  authenticate,
  auditLog,
  async (req, res, next) => {
    try {
      const { message, conversationId } = req.body;
      const chatbot = new AIChatbotService(req.prisma);
      const result = await chatbot.processMessage(req.user.sub, message, conversationId);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Multi-Currency
 */
router.get(
  "/currency/convert/:from/:to/:amount",
  limiters.general,
  authenticate,
  async (req, res, next) => {
    try {
      const { from, to, amount } = req.params;
      const currencyService = new MultiCurrencyService();
      const result = await currencyService.convertAmount(parseFloat(amount), from, to);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Real-Time Tracking
 */
router.get("/tracking/subscribe/:shipmentId", authenticate, async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const trackingService = new RealTimeTrackingService();
    const result = trackingService.subscribeToUpdates(shipmentId, req.user.sub);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Blockchain Verification
 */
router.post(
  "/blockchain/verify-shipment",
  limiters.general,
  authenticate,
  requireScope("blockchain:verify"),
  auditLog,
  async (req, res, next) => {
    try {
      const { shipmentData } = req.body;
      const blockchainService = new BlockchainVerificationService();
      const result = blockchainService.addShipmentRecord(shipmentData);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Voice Commands
 */
router.post("/voice/process", limiters.general, authenticate, auditLog, async (req, res, next) => {
  try {
    const { voiceInput } = req.body;
    const voiceService = new VoiceCommandService();
    const result = await voiceService.processVoiceCommand(voiceInput, req.user.sub);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Driver Performance Scoring
 */
router.get(
  "/drivers/:driverId/performance-score",
  limiters.general,
  authenticate,
  requireScope("drivers:read"),
  async (req, res, next) => {
    try {
      const { driverId } = req.params;
      const scoringService = new DriverPerformanceScoringService(req.prisma);
      const result = await scoringService.calculateDriverScore(driverId);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Customer Satisfaction NPS
 */
router.post(
  "/satisfaction/send-survey",
  limiters.general,
  authenticate,
  auditLog,
  async (req, res, next) => {
    try {
      const { shipmentId } = req.body;
      const npsService = new CustomerSatisfactionNPSService(req.prisma);
      const result = await npsService.sendNPSSurvey(shipmentId, req.user.sub);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Advanced Scheduling
 */
router.post(
  "/scheduling/generate-optimal",
  limiters.general,
  authenticate,
  requireScope("scheduling:write"),
  auditLog,
  async (req, res, next) => {
    try {
      const { shipments, drivers } = req.body;
      const schedulingService = new AdvancedSchedulingEngineService(req.prisma);
      const result = await schedulingService.generateOptimalSchedule(shipments, drivers);

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * AR Tracking
 */
router.post("/ar/start-session/:shipmentId", authenticate, async (req, res, next) => {
  try {
    const { shipmentId } = req.params;
    const arService = new ARShipmentTrackingService();
    const result = arService.startARSession(shipmentId, req.user.sub);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Advanced Reporting
 */
router.get(
  "/reports/executive-dashboard",
  limiters.general,
  authenticate,
  requireScope("reports:read"),
  async (req, res, next) => {
    try {
      const { dateRange } = req.query;
      const reportingService = new AdvancedReportingEngineService(req.prisma);
      const result = await reportingService.generateExecutiveDashboard(dateRange || "30d");

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
