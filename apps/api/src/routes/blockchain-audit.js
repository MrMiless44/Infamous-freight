/**
 * Phase 4 Blockchain & Audit Routes
 * Immutable transaction ledger, escrow contracts, smart contracts, distributed verification
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { limiters } = require("../middleware/security");
const blockchainAuditService = require("../services/blockchainAuditService");
const logger = require("../middleware/logger");

/**
 * POST /api/v4/blockchain/initialize
 * Initialize blockchain network
 */
router.post(
    "/initialize",
    limiters.general,
    authenticate,
    requireScope("admin:blockchain"),
    auditLog,
    async (req, res, next) => {
        try {
            const result = blockchainAuditService.initialize();

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/blockchain/record-transaction
 * Record transaction to blockchain
 */
router.post(
    "/record-transaction",
    limiters.general,
    authenticate,
    requireScope("blockchain:write"),
    auditLog,
    async (req, res, next) => {
        try {
            const {
                type,
                sender,
                receiver,
                amount,
                loadId,
                status,
            } = req.body;

            const result = await blockchainAuditService.recordTransaction({
                type,
                sender,
                receiver,
                amount,
                loadId,
                status,
            });

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/blockchain/mine
 * Mine new block with pending transactions
 */
router.post(
    "/mine",
    limiters.general,
    authenticate,
    requireScope("admin:blockchain"),
    auditLog,
    async (req, res, next) => {
        try {
            const result = await blockchainAuditService.mineBlock();

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/blockchain/escrow/create
 * Create escrow smart contract
 */
router.post(
    "/escrow/create",
    limiters.general,
    authenticate,
    requireScope("blockchain:contracts"),
    auditLog,
    validateString("shipper", "driver", "loadId"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { shipper, driver, amount, loadId, releaseCondition } = req.body;

            const result = await blockchainAuditService.createEscrowContract({
                shipper,
                driver,
                amount,
                loadId,
                releaseCondition,
            });

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/blockchain/escrow/confirm-delivery
 * Confirm delivery and release escrow funds
 */
router.post(
    "/escrow/confirm-delivery",
    limiters.general,
    authenticate,
    requireScope("blockchain:contracts"),
    auditLog,
    validateString("escrowId"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { escrowId, driver, proofOfDelivery, driverSignature } = req.body;

            const result = await blockchainAuditService.confirmDeliveryAndRelease(
                escrowId,
                {
                    driver,
                    proofOfDelivery,
                    driverSignature,
                },
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/blockchain/escrow/dispute
 * Initiate escrow dispute
 */
router.post(
    "/escrow/dispute",
    limiters.general,
    authenticate,
    requireScope("blockchain:contracts"),
    auditLog,
    validateString("escrowId", "reason"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { escrowId, reason, initiator, respondent } = req.body;

            const result = await blockchainAuditService.disputeEscrow(escrowId, {
                reason,
                initiator,
                respondent,
            });

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/blockchain/verify-audit-trail
 * Verify audit trail for transaction
 */
router.post(
    "/verify-audit-trail",
    limiters.general,
    authenticate,
    requireScope("blockchain:read"),
    validateString("transactionId"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { transactionId } = req.body;

            const result = await blockchainAuditService.verifyAuditTrail(
                transactionId,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/v4/blockchain/state
 * Export blockchain state
 */
router.get(
    "/state",
    limiters.general,
    authenticate,
    requireScope("blockchain:read"),
    async (req, res, next) => {
        try {
            const state = blockchainAuditService.exportChainState();

            res.status(200).json({
                success: true,
                state,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/v4/blockchain/statistics
 * Get blockchain statistics
 */
router.get(
    "/statistics",
    limiters.general,
    authenticate,
    requireScope("blockchain:read"),
    async (req, res, next) => {
        try {
            const stats = blockchainAuditService.getStatistics();

            res.status(200).json({
                success: true,
                statistics: stats,
            });
        } catch (err) {
            next(err);
        }
    },
);

module.exports = router;
