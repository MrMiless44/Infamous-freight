/**
 * Marketplace Routes
 * Load board, freight matching, carrier network endpoints
 */

const express = require("express");
const { limiters, authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const marketplace = require("../services/marketplace");
const { logger } = require("../middleware/logger");

const router = express.Router();

/**
 * POST /api/marketplace/search-loads
 * Search available loads from marketplace and load boards
 */
router.post(
  "/marketplace/search-loads",
  limiters.general,
  authenticate,
  requireScope("marketplace:read"),
  auditLog,
  async (req, res, next) => {
    try {
      const criteria = req.body;

      const results = await marketplace.searchLoads(criteria);

      res.json({
        ok: true,
        ...results,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/marketplace/post-load
 * Post a load to marketplace
 */
router.post(
  "/marketplace/post-load",
  limiters.general,
  authenticate,
  requireScope("marketplace:write"),
  auditLog,
  async (req, res, next) => {
    try {
      const loadData = req.body;

      const result = await marketplace.postLoad(loadData);

      res.json({
        ok: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/marketplace/offer
 * Submit an offer for a load
 */
router.post(
  "/marketplace/offer",
  limiters.general,
  authenticate,
  requireScope("marketplace:offer"),
  auditLog,
  async (req, res, next) => {
    try {
      const { loadId, offer } = req.body;

      if (!loadId || !offer) {
        return res.status(400).json({
          ok: false,
          error: "Load ID and offer details required",
        });
      }

      // Add user info to offer
      offer.carrierId = req.user.organizationId;
      offer.submittedBy = req.user.sub;

      const result = await marketplace.submitOffer(loadId, offer);

      res.json({
        ok: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/marketplace/offer/:offerId/accept
 * Accept an offer
 */
router.post(
  "/marketplace/offer/:offerId/accept",
  limiters.general,
  authenticate,
  requireScope("marketplace:manage"),
  auditLog,
  async (req, res, next) => {
    try {
      const { offerId } = req.params;

      const result = await marketplace.handleOffer(offerId, "ACCEPT", req.user.sub);

      res.json({
        ok: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/marketplace/offer/:offerId/reject
 * Reject an offer
 */
router.post(
  "/marketplace/offer/:offerId/reject",
  limiters.general,
  authenticate,
  requireScope("marketplace:manage"),
  auditLog,
  async (req, res, next) => {
    try {
      const { offerId } = req.params;

      const result = await marketplace.handleOffer(offerId, "REJECT", req.user.sub);

      res.json({
        ok: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/marketplace/analytics
 * Get marketplace analytics
 */
router.get(
  "/marketplace/analytics",
  limiters.general,
  authenticate,
  requireScope("marketplace:read"),
  auditLog,
  async (req, res, next) => {
    try {
      const organizationId = req.user.organizationId;
      const days = parseInt(req.query.days) || 30;

      const analytics = await marketplace.getAnalytics(organizationId, days);

      res.json({
        ok: true,
        analytics,
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
