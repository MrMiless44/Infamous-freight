/**
 * Phase 4 Advanced Geofencing Routes
 * Multi-zone management, safety corridors, automated actions, real-time monitoring
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const { limiters } = require("../middleware/security");
const advancedGeofencingService = require("../services/advancedGeofencingService");
const logger = require("../middleware/logger");

/**
 * POST /api/v4/geofencing/zones/create
 * Create geofence zone
 */
router.post(
    "/zones/create",
    limiters.general,
    authenticate,
    requireScope("admin:geofencing"),
    auditLog,
    validateString("name", "type"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const zone = req.body;

            const result = advancedGeofencingService.createZone(zone);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/geofencing/corridors/create
 * Create safety corridor
 */
router.post(
    "/corridors/create",
    limiters.general,
    authenticate,
    requireScope("admin:geofencing"),
    auditLog,
    validateString("name"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const corridor = req.body;

            const result = advancedGeofencingService.createSafetyCorridor(corridor);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v4/geofencing/update-location
 * Update driver location and check boundaries
 */
router.post(
    "/update-location",
    limiters.general,
    authenticate,
    requireScope("driver:location"),
    auditLog,
    validateString("driverId"),
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { driverId, location } = req.body;

            const result = await advancedGeofencingService.updateDriverLocation(
                driverId,
                location,
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/v4/geofencing/zones
 * Get all zones
 */
router.get(
    "/zones",
    limiters.general,
    authenticate,
    requireScope("geofencing:read"),
    async (req, res, next) => {
        try {
            const zones = Array.from(advancedGeofencingService.zones.values());

            res.status(200).json({
                success: true,
                zones,
                totalZones: zones.length,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/v4/geofencing/corridors
 * Get all safety corridors
 */
router.get(
    "/corridors",
    limiters.general,
    authenticate,
    requireScope("geofencing:read"),
    async (req, res, next) => {
        try {
            const corridors = Array.from(advancedGeofencingService.safetyCorridors.values());

            res.status(200).json({
                success: true,
                corridors,
                totalCorridors: corridors.length,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/v4/geofencing/driver-location/:driverId
 * Get driver's current location
 */
router.get(
    "/driver-location/:driverId",
    limiters.general,
    authenticate,
    requireScope("location:read"),
    async (req, res, next) => {
        try {
            const { driverId } = req.params;

            const location = advancedGeofencingService.driverLocations.get(driverId);

            res.status(200).json({
                success: true,
                driverId,
                location: location || null,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/v4/geofencing/zone-history/:driverId
 * Get zone entry/exit history for driver
 */
router.get(
    "/zone-history/:driverId",
    limiters.general,
    authenticate,
    requireScope("location:read"),
    async (req, res, next) => {
        try {
            const { driverId } = req.params;
            const { limit = 50 } = req.query;

            const history = advancedGeofencingService.zoneHistory.get(driverId) || [];
            const limited = history.slice(-limit);

            res.status(200).json({
                success: true,
                driverId,
                history: limited,
                totalEvents: history.length,
            });
        } catch (err) {
            next(err);
        }
    },
);

module.exports = router;
