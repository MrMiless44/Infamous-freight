/**
 * Payment & Payout API Routes
 * Handles instant payouts, payment processing, and transaction management
 */

const express = require("express");
const router = express.Router();
const paymentService = require("../services/paymentService");
const bankTransferService = require("../services/bankTransfer");
const { authenticate, requireScope, limiters, auditLog } = require("../middleware/security");
const { withIdempotency } = require("../middleware/idempotency");
const { requirePerm } = require("../auth/authorize");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { body, param } = require("express-validator");

// ============================================================================
// BANK TRANSFER ENDPOINTS (Cost Optimization - $0 fees!)
// ============================================================================

/**
 * POST /api/payments/bank-transfer/link-token
 * Create Plaid Link token for bank verification
 * Scope: payment:setup
 */
router.post(
  "/bank-transfer/link-token",
  limiters.general,
  authenticate,
  requireScope("payment:setup"),
  auditLog,
  async (req, res, next) => {
    try {
      const userId = req.user.sub;
      const linkToken = await bankTransferService.createLinkToken(userId);

      res.status(200).json({
        success: true,
        data: { linkToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/bank-transfer/exchange-token
 * Exchange public token for access token
 * Scope: payment:setup
 */
router.post(
  "/bank-transfer/exchange-token",
  limiters.general,
  authenticate,
  requireScope("payment:setup"),
  auditLog,
  [
    body("publicToken").notEmpty().withMessage("Public token is required"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { publicToken } = req.body;
      const result = await bankTransferService.exchangePublicToken(publicToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/bank-transfer/initiate
 * Initiate bank transfer (0% fees!)
 * Scope: payment:transfer
 */
router.post(
  "/bank-transfer/initiate",
  limiters.billing,
  authenticate,
  requireScope("payment:transfer"),
  requirePerm("payment:send"),
  auditLog,
  withIdempotency({ scope: "payments:bank-transfer" }),
  [
    body("amount")
      .isFloat({ min: 1, max: 100000 })
      .withMessage("Amount must be between $1 and $100,000"),
    body("accountId").notEmpty().withMessage("Account ID is required"),
    body("accessToken").notEmpty().withMessage("Access token is required"),
    body("description").optional().isString().withMessage("Description must be a string"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { amount, accountId, accessToken, description } = req.body;
      const userId = req.user.sub;

      const result = await bankTransferService.initiateBankTransfer({
        userId,
        amount: parseFloat(amount),
        accountId,
        accessToken,
        description,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
        });
      }

      res.status(200).json({
        success: true,
        data: result.transfer,
        message: result.message,
        savings: {
          stripeFee: (parseFloat(amount) * 0.029 + 0.30).toFixed(2),
          bankTransferFee: 0,
          saved: (parseFloat(amount) * 0.029 + 0.30).toFixed(2),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/bank-transfer/fees
 * Calculate bank transfer fees (always $0!)
 * Scope: payment:view
 */
router.get(
  "/bank-transfer/fees",
  limiters.general,
  authenticate,
  requireScope("payment:view"),
  auditLog,
  async (req, res, next) => {
    try {
      const { amount } = req.query;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({
          success: false,
          error: "Valid amount is required",
        });
      }

      const fees = bankTransferService.calculateBankTransferFee(parseFloat(amount));

      res.status(200).json({
        success: true,
        data: fees,
        message: "Bank transfers have NO fees! Save money vs credit cards.",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/bank-transfer/:transferId/status
 * Get bank transfer status
 * Scope: payment:view
 */
router.get(
  "/bank-transfer/:transferId/status",
  limiters.general,
  authenticate,
  requireScope("payment:view"),
  auditLog,
  [
    param("transferId").notEmpty().withMessage("Transfer ID is required"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { transferId } = req.params;
      const status = await bankTransferService.getBankTransferStatus(transferId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// INSTANT PAYOUT ENDPOINTS
// ============================================================================

/**
 * POST /api/payments/payout/instant
 * Request instant same-day payout (0-15 min arrival)
 * Scope: payment:payout
 */
router.post(
  "/payout/instant",
  limiters.billing,
  authenticate,
  requireScope("payment:payout"),
  requirePerm("payout:run"),
  auditLog,
  withIdempotency({ scope: "payments:payout:instant" }),
  [
    body("amount")
      .isFloat({ min: 10, max: 25000 })
      .withMessage("Amount must be between $10 and $25,000"),
    body("method").isIn(["stripe", "paypal", "debitCard"]).withMessage("Invalid payment method"),
    body("destination").notEmpty().withMessage("Payment destination is required"),
    body("currency")
      .optional()
      .isIn(["USD", "EUR", "GBP", "CAD", "AUD"])
      .withMessage("Invalid currency"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { amount, method, destination, currency, reason } = req.body;
      const userId = req.user.sub;

      const result = await paymentService.requestInstantPayout({
        recipientId: userId,
        recipientType: "user",
        amount: parseFloat(amount),
        currency: currency || "USD",
        method,
        destination,
        reason: reason || "User requested payout",
        metadata: {
          requestedBy: userId,
          requestedAt: new Date().toISOString(),
          ipAddress: req.ip,
        },
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
        });
      }

      res.status(200).json({
        success: true,
        data: result.payout,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/payments/payout/standard
 * Request standard payout (1-2 business days)
 * Scope: payment:payout
 */
router.post(
  "/payout/standard",
  limiters.billing,
  authenticate,
  requireScope("payment:payout"),
  requirePerm("payout:run"),
  auditLog,
  withIdempotency({ scope: "payments:payout:standard" }),
  [
    body("amount")
      .isFloat({ min: 1, max: 100000 })
      .withMessage("Amount must be between $1 and $100,000"),
    body("method").isIn(["bankTransfer", "stripe", "paypal"]).withMessage("Invalid payment method"),
    body("destination").notEmpty().withMessage("Payment destination is required"),
    body("currency")
      .optional()
      .isIn(["USD", "EUR", "GBP", "CAD", "AUD"])
      .withMessage("Invalid currency"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { amount, method, destination, currency, reason } = req.body;
      const userId = req.user.sub;

      const result = await paymentService.requestStandardPayout({
        recipientId: userId,
        recipientType: "user",
        amount: parseFloat(amount),
        currency: currency || "USD",
        method,
        destination,
        reason: reason || "User requested payout",
        metadata: {
          requestedBy: userId,
          requestedAt: new Date().toISOString(),
        },
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
        });
      }

      res.status(200).json({
        success: true,
        data: result.payout,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// BONUS PAYOUT ENDPOINTS
// ============================================================================

/**
 * POST /api/payments/bonus/payout
 * Process instant payout for earned bonus
 * Scope: payment:bonus
 */
router.post(
  "/bonus/payout",
  limiters.billing,
  authenticate,
  requireScope("payment:bonus"),
  requirePerm("payout:run"),
  auditLog,
  withIdempotency({ scope: "payments:bonus:payout" }),
  [
    body("bonusId").notEmpty().withMessage("Bonus ID is required"),
    body("amount").isFloat({ min: 10 }).withMessage("Amount must be at least $10"),
    body("bonusType").notEmpty().withMessage("Bonus type is required"),
    body("paymentMethod")
      .optional()
      .isIn(["stripe", "paypal", "debitCard"])
      .withMessage("Invalid payment method"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { bonusId, amount, bonusType, paymentMethod } = req.body;
      const userId = req.user.sub;

      const result = await paymentService.processBonusPayout({
        userId,
        bonusId,
        amount: parseFloat(amount),
        bonusType,
        paymentMethod,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
        });
      }

      res.status(200).json({
        success: true,
        data: result.payout,
        message: "Bonus payout processed - arriving in 0-15 minutes",
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// PAYOUT STATUS & TRACKING
// ============================================================================

/**
 * GET /api/payments/payout/:payoutId/status
 * Get current status of a payout
 * Scope: payment:view
 */
router.get(
  "/payout/:payoutId/status",
  limiters.general,
  authenticate,
  requireScope("payment:view"),
  auditLog,
  [param("payoutId").notEmpty().withMessage("Payout ID is required"), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { payoutId } = req.params;
      const method = req.query.method || "stripe";

      const result = await paymentService.getPayoutStatus(payoutId, method);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// PAYMENT METHODS
// ============================================================================

/**
 * GET /api/payments/methods
 * Get available payment methods for user
 * Scope: payment:view
 */
router.get(
  "/methods",
  limiters.general,
  authenticate,
  requireScope("payment:view"),
  auditLog,
  async (req, res, next) => {
    try {
      const userId = req.user.sub;
      const country = req.query.country || "US";

      const result = await paymentService.getAvailablePaymentMethods(userId, country);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/payments/fees/calculate
 * Calculate payout fees for given amount
 * Scope: payment:view
 */
router.get(
  "/fees/calculate",
  limiters.general,
  authenticate,
  requireScope("payment:view"),
  auditLog,
  async (req, res, next) => {
    try {
      const { amount, type = "instant" } = req.query;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({
          success: false,
          error: "Valid amount is required",
        });
      }

      const fees = paymentService.calculatePayoutFees(parseFloat(amount), type);

      res.status(200).json({
        success: true,
        data: {
          amount: parseFloat(amount),
          fees,
          netAmount: parseFloat(amount) - fees.total,
          type,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// BATCH PAYOUTS (ADMIN ONLY)
// ============================================================================

/**
 * POST /api/payments/batch/process
 * Process multiple payouts at once
 * Scope: payment:admin
 */
router.post(
  "/batch/process",
  limiters.billing,
  authenticate,
  requireScope("payment:admin"),
  auditLog,
  [
    body("payouts")
      .isArray({ min: 1, max: 100 })
      .withMessage("Payouts must be an array (1-100 items)"),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { payouts } = req.body;

      const result = await paymentService.batchProcessPayouts(payouts);

      res.status(200).json({
        success: true,
        data: result,
        message: `Processed ${result.successful}/${result.processed} payouts successfully`,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/payments/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "Payment & Payout Service",
    status: "operational",
    timestamp: new Date().toISOString(),
    features: {
      instantPayout: true,
      standardPayout: true,
      bonusPayout: true,
      batchProcessing: true,
    },
  });
});

module.exports = router;
