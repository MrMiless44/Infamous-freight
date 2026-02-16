/**
 * Phase 4 Neural Networks & Advanced ML Routes
 * Load acceptance prediction, demand forecasting, fraud detection, risk scoring
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { limiters } = require("../middleware/security");
const neuralNetworkService = require("../services/neuralNetworkService");
const logger = require("../middleware/logger");

/**
 * POST /api/v4/ml/nn/initialize
 * Initialize neural network models for driver
 */
router.post(
  "/nn/initialize",
  limiters.general,
  authenticate,
  requireScope("ai:advanced_ml"),
  auditLog,
  validateString("driverId"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { driverId } = req.body;
      const result = await neuralNetworkService.initializeDriverModels(driverId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/ml/nn/load-acceptance
 * Predict load acceptance probability
 */
router.post(
  "/nn/load-acceptance",
  limiters.ai,
  authenticate,
  requireScope("ai:prediction"),
  auditLog,
  async (req, res, next) => {
    try {
      const { driverId, load } = req.body;

      const probability = await neuralNetworkService.predictLoadAcceptance(driverId, load);

      res.status(200).json({
        success: true,
        driverId,
        loadId: load.id,
        acceptanceProbability: probability,
        recommendation:
          probability > 0.7
            ? "high_likelihood"
            : probability > 0.4
              ? "moderate_likelihood"
              : "low_likelihood",
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/ml/nn/demand-forecast
 * Forecast demand for next 7 days
 */
router.post(
  "/nn/demand-forecast",
  limiters.general,
  authenticate,
  requireScope("ai:forecasting"),
  auditLog,
  validateString("region"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { region, historicalData } = req.body;

      const forecast = await neuralNetworkService.forecastDemand(region, historicalData);

      res.status(200).json({
        success: true,
        region,
        forecast,
        forecastLength: forecast.length,
        averageVolume: Math.round(forecast.reduce((sum, f) => sum + f.volume, 0) / forecast.length),
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/ml/nn/fraud-detection
 * Detect fraudulent transaction patterns
 */
router.post(
  "/nn/fraud-detection",
  limiters.ai,
  authenticate,
  requireScope("fraud:detection"),
  auditLog,
  async (req, res, next) => {
    try {
      const { driverId, transaction } = req.body;

      const result = await neuralNetworkService.detectFraud(driverId, transaction);

      res.status(200).json({
        success: true,
        driverId,
        transactionId: transaction.id,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/ml/nn/risk-score
 * Calculate driver risk score
 */
router.post(
  "/nn/risk-score",
  limiters.general,
  authenticate,
  requireScope("admin:risk_assessment"),
  auditLog,
  validateString("driverId"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { driverId, driverData } = req.body;

      const result = await neuralNetworkService.calculateRiskScore(driverId, driverData);

      res.status(200).json({
        success: true,
        driverId,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/ml/nn/train-model
 * Train neural network model with data
 */
router.post(
  "/nn/train-model",
  limiters.general,
  authenticate,
  requireScope("admin:ml_training"),
  auditLog,
  validateString("driverId"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { driverId, modelType, trainingData } = req.body;

      const result = await neuralNetworkService.trainModel(driverId, modelType, trainingData);

      res.status(200).json({
        success: true,
        driverId,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v4/ml/nn/status/:driverId
 * Get neural network status for driver
 */
router.get(
  "/nn/status/:driverId",
  limiters.general,
  authenticate,
  requireScope("ai:view"),
  async (req, res, next) => {
    try {
      const { driverId } = req.params;

      res.status(200).json({
        success: true,
        driverId,
        status: "initialized",
        models: ["loadAcceptance", "demandForecast", "fraudDetection", "riskScoring"],
        trainingStatus: "completed",
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
