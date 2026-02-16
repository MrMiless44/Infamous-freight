/**
 * Webhook API Routes
 * POST /api/webhooks/subscribe - Subscribe to events
 * GET /api/webhooks/subscriptions - List subscriptions
 * DELETE /api/webhooks/subscriptions/:id - Unsubscribe
 * GET /api/webhooks/status - Queue status
 */

const express = require("express");
const { body } = require("express-validator");
const webhookService = require("../services/webhookService");
const { authenticate } = require("../middleware/security");
const { handleValidationErrors } = require("../middleware/validation");
const { logger } = require("../middleware/logger");

const router = express.Router();

/**
 * POST /api/webhooks/subscribe
 * Subscribe to webhook events
 */
router.post(
  "/subscribe",
  authenticate,
  [
    body("event").isIn(["loads:new", "loads:updated", "bid:received", "driver:assigned"]),
    body("targetUrl").isURL(),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { event, targetUrl } = req.body;
      const userId = req.user.sub;

      // Check existing subscription
      const existing = webhookService.getSubscription(userId, event);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Subscription already exists for this event",
        });
      }

      // Subscribe
      const subscription = await webhookService.subscribe(userId, event, targetUrl);

      res.status(201).json({
        success: true,
        data: {
          id: subscription.id,
          event: subscription.event,
          targetUrl: subscription.targetUrl,
          secret: subscription.secret, // Share once
          active: true,
          createdAt: subscription.createdAt,
        },
      });
    } catch (err) {
      logger.error("Webhook subscribe failed", { error: err.message });
      next(err);
    }
  },
);

/**
 * GET /api/webhooks/subscriptions
 * List all subscriptions for user
 */
router.get("/subscriptions", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const subscriptions = webhookService.getUserSubscriptions(userId);

    const safe = subscriptions.map((sub) => ({
      id: sub.id,
      event: sub.event,
      targetUrl: sub.targetUrl,
      active: sub.active,
      failureCount: sub.failureCount,
      createdAt: sub.createdAt,
    }));

    res.json({
      success: true,
      data: safe,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/webhooks/subscriptions/:id
 * Unsubscribe from event
 */
router.delete("/subscriptions/:event", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const { event } = req.params;

    const unsubscribed = webhookService.unsubscribe(userId, event);

    if (!unsubscribed) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    res.json({
      success: true,
      message: "Unsubscribed",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/webhooks/status
 * Get webhook queue status (admin only)
 */
router.get("/status", authenticate, async (req, res, next) => {
  try {
    // Verify admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const status = webhookService.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
