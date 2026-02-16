/**
 * Phase 4 Compliance & Insurance Automation Routes
 * Automated claims, compliance tracking, FMCSA monitoring, document management
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { limiters } = require("../middleware/security");
const complianceInsuranceService = require("../services/complianceInsuranceService");
const logger = require("../middleware/logger");

/**
 * POST /api/v4/compliance/insurance/claim
 * Initiate automated insurance claim
 */
router.post(
  "/insurance/claim",
  limiters.general,
  authenticate,
  requireScope("insurance:claims"),
  auditLog,
  validateString("type"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const incident = req.body;

      const result = await complianceInsuranceService.initiateInsuranceClaim(incident);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/compliance/track
 * Track and manage compliance records
 */
router.post(
  "/track",
  limiters.general,
  authenticate,
  requireScope("admin:compliance"),
  auditLog,
  validateString("driverId"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { driverId, complianceData } = req.body;

      const result = await complianceInsuranceService.trackCompliance(driverId, complianceData);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/compliance/fmcsa-check
 * Check FMCSA violations
 */
router.post(
  "/fmcsa-check",
  limiters.general,
  authenticate,
  requireScope("admin:compliance"),
  auditLog,
  validateString("driverId"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { driverId } = req.body;

      const result = await complianceInsuranceService.checkFMCSAViolations(driverId);

      res.status(200).json({
        success: true,
        violations: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/compliance/documents/upload
 * Upload compliance document
 */
router.post(
  "/documents/upload",
  limiters.general,
  authenticate,
  requireScope("driver:documents"),
  auditLog,
  validateString("driverId", "type"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { driverId, type, fileName, fileSize, expiryDate, issuingAuthority } = req.body;

      const result = await complianceInsuranceService.uploadComplianceDocument({
        driverId,
        type,
        fileName,
        fileSize,
        expiryDate,
        issuingAuthority,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/v4/compliance/audit
 * Run compliance audit
 */
router.post(
  "/audit",
  limiters.general,
  authenticate,
  requireScope("admin:compliance"),
  auditLog,
  validateString("driverId"),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { driverId } = req.body;

      const result = await complianceInsuranceService.runComplianceAudit(driverId);

      res.status(200).json({
        success: true,
        audit: result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v4/compliance/status/:driverId
 * Get compliance status for driver
 */
router.get(
  "/status/:driverId",
  limiters.general,
  authenticate,
  requireScope("compliance:read"),
  async (req, res, next) => {
    try {
      const { driverId } = req.params;

      const records = complianceInsuranceService.complianceRecords.get(driverId) || [];
      const latest = records[records.length - 1];

      res.status(200).json({
        success: true,
        driverId,
        status: latest?.overallStatus || "unknown",
        lastCheck: latest?.recordDate || null,
        violations: latest?.violations || [],
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v4/compliance/insurance/claims/:driverId
 * Get insurance claims for driver
 */
router.get(
  "/insurance/claims/:driverId",
  limiters.general,
  authenticate,
  requireScope("insurance:read"),
  async (req, res, next) => {
    try {
      const { driverId } = req.params;

      const claims = Array.from(complianceInsuranceService.insuranceClaims.values()).filter(
        (claim) => claim.involved.driver === driverId,
      );

      res.status(200).json({
        success: true,
        driverId,
        claims,
        totalClaims: claims.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v4/compliance/documents/:driverId
 * Get compliance documents for driver
 */
router.get(
  "/documents/:driverId",
  limiters.general,
  authenticate,
  requireScope("driver:documents"),
  async (req, res, next) => {
    try {
      const { driverId } = req.params;

      const documents = Array.from(complianceInsuranceService.documents.values()).filter(
        (doc) => doc.driverId === driverId,
      );

      res.status(200).json({
        success: true,
        driverId,
        documents,
        totalDocuments: documents.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
