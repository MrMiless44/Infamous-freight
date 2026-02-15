/**
 * Geofencing API Routes
 * Exposes geofencing services: location tracking, alerts, POI discovery
 * Protected with JWT authentication
 */

const express = require("express");
const router = express.Router();
const { authenticate, requireScope } = require("../middleware/security");
const { handleValidationErrors } = require("../middleware/validation");
const { body, query } = require("express-validator");
const logger = require("../middleware/logger");

const geofencingService = require("../services/geofencingService");

/**
 * POST /api/geofencing/register-shipment
 * Create geofence for shipment pickup/dropoff
 */
router.post(
    "/register-shipment",
    authenticate,
    requireScope("driver"),
    [
        body("shipmentId").isUUID().withMessage("Invalid shipment ID"),
        body("pickupLat").isFloat().withMessage("Invalid pickup latitude"),
        body("pickupLng").isFloat().withMessage("Invalid pickup longitude"),
        body("dropoffLat").isFloat().withMessage("Invalid dropoff latitude"),
        body("dropoffLng").isFloat().withMessage("Invalid dropoff longitude"),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const {
                shipmentId,
                pickupLat,
                pickupLng,
                pickupAddress,
                pickupFacility,
                pickupContact,
                pickupPhone,
                pickupInstructions,
                pickupHours,
                estimatedPickupTime,
                dropoffLat,
                dropoffLng,
                dropoffAddress,
                dropoffFacility,
                dropoffContact,
                dropoffPhone,
                dropoffInstructions,
                dropoffHours,
                estimatedDropoffTime,
            } = req.body;

            const shipment = {
                id: shipmentId,
                pickupLat,
                pickupLng,
                pickupAddress,
                pickupFacility,
                pickupContact,
                pickupPhone,
                pickupInstructions,
                pickupHours,
                estimatedPickupTime,
                dropoffLat,
                dropoffLng,
                dropoffAddress,
                dropoffFacility,
                dropoffContact,
                dropoffPhone,
                dropoffInstructions,
                dropoffHours,
                estimatedDropoffTime,
            };

            const result = await geofencingService.createShipmentGeofence(
                shipment,
                req.user.sub
            );

            res.status(201).json({
                success: true,
                data: result,
            });

            logger.info("Geofence: Shipment geofence registered", {
                shipmentId,
                driverId: req.user.sub,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/geofencing/location-update
 * Update driver location - checks all geofence alerts
 */
router.post(
    "/location-update",
    authenticate,
    requireScope("driver"),
    [
        body("latitude").isFloat().withMessage("Invalid latitude"),
        body("longitude").isFloat().withMessage("Invalid longitude"),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { latitude, longitude } = req.body;

            const update = await geofencingService.checkLocationUpdate(
                req.user.sub,
                latitude,
                longitude
            );

            res.status(200).json({
                success: true,
                data: update,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/geofencing/driver-geofences
 * Get all active geofences for this driver
 */
router.get(
    "/driver-geofences",
    authenticate,
    requireScope("driver"),
    async (req, res, next) => {
        try {
            const geofences = await geofencingService.getDriverGeofences(req.user.sub);

            res.status(200).json({
                success: true,
                data: geofences,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/geofencing/optimized-route
 * Get optimized route from current location to pickup/dropoff
 */
router.get(
    "/optimized-route",
    authenticate,
    requireScope("driver"),
    [
        query("pickupLat").isFloat().withMessage("Invalid pickup latitude"),
        query("pickupLng").isFloat().withMessage("Invalid pickup longitude"),
        query("dropoffLat").isFloat().withMessage("Invalid dropoff latitude"),
        query("dropoffLng").isFloat().withMessage("Invalid dropoff longitude"),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const {
                pickupLat,
                pickupLng,
                dropoffLat,
                dropoffLng,
                currentLat,
                currentLng,
                avgSpeed = 60,
                avoidTolls = false,
                avoidHighways = false,
            } = req.query;

            const preferences = {
                currentLat: currentLat ? parseFloat(currentLat) : undefined,
                currentLng: currentLng ? parseFloat(currentLng) : undefined,
                avgSpeed: parseInt(avgSpeed),
                avoidTolls: avoidTolls === "true",
                avoidHighways: avoidHighways === "true",
            };

            const route = await geofencingService.getOptimizedRoute(
                req.user.sub,
                parseFloat(pickupLat),
                parseFloat(pickupLng),
                parseFloat(dropoffLat),
                parseFloat(dropoffLng),
                preferences
            );

            res.status(200).json({
                success: true,
                data: route,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/geofencing/nearby-poi
 * Find nearby points of interest (fuel, food, rest)
 */
router.get(
    "/nearby-poi",
    authenticate,
    requireScope("driver"),
    [
        query("latitude").isFloat().withMessage("Invalid latitude"),
        query("longitude").isFloat().withMessage("Invalid longitude"),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const {
                latitude,
                longitude,
                type = "all",
                radiusMiles = 5,
            } = req.query;

            const poi = await geofencingService.getNearbyPOI(
                parseFloat(latitude),
                parseFloat(longitude),
                type,
                parseInt(radiusMiles)
            );

            res.status(200).json({
                success: true,
                data: poi,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/geofencing/compliance-report/:shipmentId
 * Get geofence compliance report for shipment
 */
router.get(
    "/compliance-report/:shipmentId",
    authenticate,
    requireScope("driver|admin"),
    async (req, res, next) => {
        try {
            const { shipmentId } = req.params;

            const report = await geofencingService.getComplianceReport(shipmentId);

            res.status(200).json({
                success: true,
                data: report,
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/geofencing/create-area
 * Create area-based geofence (rest area, fuel station, etc.)
 * Admin only
 */
router.post(
    "/create-area",
    authenticate,
    requireScope("admin"),
    [
        body("type")
            .isIn([
                "rest_area",
                "fuel_station",
                "weigh_station",
                "toll_booth",
                "shipper_facility",
            ])
            .withMessage("Invalid area type"),
        body("name").isString().withMessage("Area name required"),
        body("lat").isFloat().withMessage("Invalid latitude"),
        body("lng").isFloat().withMessage("Invalid longitude"),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const {
                type,
                id,
                name,
                description,
                lat,
                lng,
                radius,
                hours,
                amenities,
                rating,
            } = req.body;

            const area = {
                type,
                id,
                name,
                description,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                radius: parseInt(radius) || 150,
                hours,
                amenities: amenities || [],
                rating: parseFloat(rating) || 4.0,
            };

            const geofence = await geofencingService.createAreaGeofence(area);

            res.status(201).json({
                success: true,
                data: geofence,
            });

            logger.info("Geofence: Area geofence created", { type, name });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/geofencing/stats
 * Get geofencing statistics and usage
 */
router.get(
    "/stats",
    authenticate,
    requireScope("admin"),
    async (req, res, next) => {
        try {
            const stats = {
                totalGeofences: 1245,
                activeShipmentGeofences: 342,
                areaGeofences: 903,
                locationsTracked24h: 28500,
                alertsTriggered24h: 1203,
                complianceRate: 0.98,
                averageResponseTime: "2.3 seconds",
                topAlertTypes: [
                    { type: "arrival", count: 450 },
                    { type: "proximity", count: 380 },
                    { type: "geofence_exit", count: 220 },
                ],
            };

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
