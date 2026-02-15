/**
 * Phase 4 Real-time Notifications Routes
 * WebSocket connections, load matching, driver status, push notifications
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { limiters } = require("../middleware/security");
const realtimeNotificationService = require("../services/realtimeNotificationService");
const logger = require("../middleware/logger");

/**
 * POST /api/v4/notifications/init-connection
 * Initialize WebSocket connection
 */
router.post(
    "/init-connection",
    limiters.general,
    authenticate,
    validateString("userId"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { userId } = req.body;

            const result = realtimeNotificationService.initializeConnection(userId, null);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/subscribe
 * Subscribe to notification topic
 */
router.post(
    "/subscribe",
    limiters.general,
    authenticate,
    validateString("userId", "topic"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { userId, topic } = req.body;

            const result = realtimeNotificationService.subscribe(userId, topic);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/broadcast-load-match
 * Broadcast load match to drivers
 */
router.post(
    "/broadcast-load-match",
    limiters.general,
    authenticate,
    requireScope("dispatch:notifications"),
    auditLog,
    async (req, res, next) => {
        try {
            const { load, driverIds } = req.body;

            const result = await realtimeNotificationService.broadcastLoadMatch(
                load,
                driverIds,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/driver-status
 * Broadcast driver status update
 */
router.post(
    "/driver-status",
    limiters.general,
    authenticate,
    requireScope("driver:status"),
    auditLog,
    validateString("driverId", "status"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { driverId, status } = req.body;

            const result = await realtimeNotificationService.broadcastDriverStatus(
                driverId,
                status,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/send-in-app
 * Send in-app notification
 */
router.post(
    "/send-in-app",
    limiters.general,
    authenticate,
    validateString("userId"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { userId, data } = req.body;

            const result = await realtimeNotificationService.sendInAppNotification(
                userId,
                data,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/send-push
 * Send push notification to mobile
 */
router.post(
    "/send-push",
    limiters.general,
    authenticate,
    validateString("userId"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { userId, data } = req.body;

            const result = await realtimeNotificationService.sendPushNotification(
                userId,
                data,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/deliver-queue/:userId
 * Deliver queued messages when user reconnects
 */
router.post(
    "/deliver-queue/:userId",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const { userId } = req.params;

            const result = await realtimeNotificationService.deliveryQueuedMessages(
                userId,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/load-bid-activity
 * Notify about load bid activity
 */
router.post(
    "/load-bid-activity",
    limiters.general,
    authenticate,
    requireScope("dispatch:notifications"),
    auditLog,
    async (req, res, next) => {
        try {
            const { loadId, bid } = req.body;

            const result = await realtimeNotificationService.notifyLoadBidActivity(
                loadId,
                bid,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/shipment-status
 * Notify shipment status update
 */
router.post(
    "/shipment-status",
    limiters.general,
    authenticate,
    requireScope("dispatch:notifications"),
    auditLog,
    validateString("shipmentId", "newStatus"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { shipmentId, newStatus, notifyUserIds } = req.body;

            const result = await realtimeNotificationService.notifyShipmentStatus(
                shipmentId,
                newStatus,
                notifyUserIds,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/notifications/disconnect/:userId
 * Handle user disconnection
 */
router.post(
    "/disconnect/:userId",
    limiters.general,
    authenticate,
    async (req, res, next) => {
        try {
            const { userId } = req.params;

            const result = realtimeNotificationService.handleDisconnection(userId);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/v4/notifications/analytics
 * Get notification analytics
 */
router.get(
    "/analytics",
    limiters.general,
    authenticate,
    requireScope("admin:view_analytics"),
    async (req, res, next) => {
        try {
            const analytics = realtimeNotificationService.getAnalytics();

            res.status(200).json({
                success: true,
                analytics,
            });
        } catch (err) {
            next(err);
        }
    },
);

module.exports = router;
