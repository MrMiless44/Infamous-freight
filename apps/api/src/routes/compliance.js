/**
 * Compliance Routes
 * Hours of Service (HOS), ELD, FMCSA compliance endpoints
 */

const express = require('express');
const {
    limiters,
    authenticate,
    requireScope,
    auditLog,
} = require('../middleware/security');
const {
    validateString,
    handleValidationErrors,
} = require('../middleware/validation');
const compliance = require('../services/complianceTracking');
const { logger } = require('../middleware/logger');

const router = express.Router();

/**
 * POST /api/compliance/hos/track
 * Track driver hours of service activity
 */
router.post(
    '/compliance/hos/track',
    limiters.general,
    authenticate,
    requireScope('compliance:write'),
    auditLog,
    async (req, res, next) => {
        try {
            const { driverId, activity } = req.body;

            if (!driverId || !activity) {
                return res.status(400).json({
                    ok: false,
                    error: 'Driver ID and activity required'
                });
            }

            const result = await compliance.trackHOS(driverId, activity);

            res.json({
                ok: true,
                ...result
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/compliance/hos/status/:driverId
 * Get current HOS status for driver
 */
router.get(
    '/compliance/hos/status/:driverId',
    limiters.general,
    authenticate,
    requireScope('compliance:read'),
    auditLog,
    async (req, res, next) => {
        try {
            const { driverId } = req.params;

            const status = await compliance.getDriverHOSStatus(driverId);

            res.json({
                ok: true,
                status
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/compliance/hos/violations/:driverId
 * Check for HOS violations
 */
router.get(
    '/compliance/hos/violations/:driverId',
    limiters.general,
    authenticate,
    requireScope('compliance:read'),
    auditLog,
    async (req, res, next) => {
        try {
            const { driverId } = req.params;

            const violations = await compliance.checkHOSViolations(driverId);

            res.json({
                ok: true,
                violations,
                count: violations.length
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST /api/compliance/report
 * Generate compliance report
 */
router.post(
    '/compliance/report',
    limiters.general,
    authenticate,
    requireScope('compliance:read'),
    auditLog,
    async (req, res, next) => {
        try {
            const organizationId = req.user.organizationId;
            const { startDate, endDate } = req.body;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    ok: false,
                    error: 'Start date and end date required'
                });
            }

            const report = await compliance.generateComplianceReport(
                organizationId,
                startDate,
                endDate
            );

            res.json({
                ok: true,
                report
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
