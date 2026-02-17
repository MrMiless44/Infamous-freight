// Compliance and Audit Logging Service
// Tracks all data changes for compliance (GDPR, SOC 2, etc.)

const logger = require('./logger');
const { prisma } = require('../config/database');

class ComplianceAuditService {
    constructor(config = {}) {
        this.retentionDays = config.retentionDays || 90;
        this.enableEncryption = config.enableEncryption !== false;
        this.enableDigitalSignature = config.enableDigitalSignature !== false;
    }

    /**
     * Log data access
     */
    async logDataAccess(userId, resource, action, data, ipAddress) {
        try {
            const auditEntry = await prisma.auditLog.create({
                data: {
                    userId,
                    resource,
                    action,
                    dataSnapshot: JSON.stringify(data),
                    ipAddress,
                    timestamp: new Date(),
                    userAgent: this.userAgent,
                },
            });

            logger.info('Data access logged', {
                userId,
                resource,
                action,
                auditId: auditEntry.id,
            });

            return auditEntry;
        } catch (error) {
            logger.error('Failed to log data access', {
                error: error.message,
                userId,
                resource,
            });
            throw error;
        }
    }

    /**
     * Log data modification
     */
    async logDataModification(userId, resource, recordId, action, before, after, reason = '') {
        try {
            const auditEntry = await prisma.auditLog.create({
                data: {
                    userId,
                    resource,
                    action,
                    recordId,
                    beforeSnapshot: JSON.stringify(before),
                    afterSnapshot: JSON.stringify(after),
                    reason,
                    timestamp: new Date(),
                    changeType: action === 'UPDATE' ? 'modification' : 'deletion',
                },
            });

            logger.info('Data modification logged', {
                userId,
                resource,
                recordId,
                action,
                auditId: auditEntry.id,
            });

            return auditEntry;
        } catch (error) {
            logger.error('Failed to log data modification', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Right to be forgotten (GDPR)
     */
    async rightToBeForgotten(userId, dataTypes = []) {
        try {
            logger.warn('GDPR: Right to be forgotten request', {
                userId,
                dataTypes,
                timestamp: new Date(),
            });

            // Delete personal data
            const deleted = {
                userData: 0,
                shipments: 0,
                communications: 0,
                auditLogs: 0,
            };

            // Delete user profile (keep audit trail)
            if (dataTypes.includes('profile') || dataTypes.length === 0) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        email: `deleted-${userId}@anonymous.local`,
                        firstName: 'Deleted',
                        lastName: 'User',
                        phone: null,
                        address: null,
                    },
                });
                deleted.userData = 1;
            }

            // Create GDPR deletion record for compliance
            await prisma.gdprRequest.create({
                data: {
                    userId,
                    requestType: 'deletion',
                    status: 'completed',
                    dataTypes,
                    completedAt: new Date(),
                },
            });

            logger.info('GDPR right to be forgotten completed', {
                userId,
                deleted,
            });

            return deleted;
        } catch (error) {
            logger.error('GDPR right to be forgotten failed', {
                userId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Data portability request (GDPR)
     */
    async dataPortability(userId) {
        try {
            // Fetch all user data
            const userData = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    shipments: true,
                    communications: true,
                },
            });

            const exportData = {
                user: userData,
                exportedAt: new Date(),
                format: 'JSON',
            };

            logger.info('GDPR data portability request completed', {
                userId,
                recordCount: Object.keys(exportData).length,
            });

            return exportData;
        } catch (error) {
            logger.error('GDPR data portability failed', {
                userId,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Log authentication events
     */
    async logAuthenticationEvent(userId, action, status, ipAddress, reason = '') {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    resource: 'authentication',
                    action,
                    status,
                    ipAddress,
                    reason,
                    timestamp: new Date(),
                },
            });

            logger.info('Authentication event logged', {
                userId,
                action,
                status,
            });
        } catch (error) {
            logger.error('Failed to log authentication event', {
                error: error.message,
            });
        }
    }

    /**
     * Audit trail for permission changes
     */
    async logPermissionChange(userId, affectedUserId, role, action, reason = '') {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    resource: 'permissions',
                    action: `${action}_role`,
                    recordId: affectedUserId,
                    metadata: JSON.stringify({ role }),
                    reason,
                    timestamp: new Date(),
                },
            });

            logger.info('Permission change logged', {
                adminUserId: userId,
                affectedUserId,
                role,
                action,
            });
        } catch (error) {
            logger.error('Failed to log permission change', {
                error: error.message,
            });
        }
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(startDate, endDate) {
        try {
            const auditLogs = await prisma.auditLog.findMany({
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            });

            const summary = {
                period: { start: startDate, end: endDate },
                totalEvents: auditLogs.length,
                eventsByAction: {},
                eventsByResource: {},
                authenticationEvents: 0,
                failedAttempts: 0,
                dataModifications: 0,
                gdprRequests: 0,
            };

            for (const log of auditLogs) {
                // Count by action
                summary.eventsByAction[log.action] = (summary.eventsByAction[log.action] || 0) + 1;

                // Count by resource
                summary.eventsByResource[log.resource] =
                    (summary.eventsByResource[log.resource] || 0) + 1;

                // Count special events
                if (log.resource === 'authentication') summary.authenticationEvents++;
                if (log.status === 'failed') summary.failedAttempts++;
                if (log.changeType === 'modification') summary.dataModifications++;
            }

            logger.info('Compliance report generated', {
                period: `${startDate} to ${endDate}`,
                totalEvents: summary.totalEvents,
            });

            return summary;
        } catch (error) {
            logger.error('Failed to generate compliance report', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Purge old audit logs based on retention policy
     */
    async purgeOldLogs() {
        try {
            const cutoffDate = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);

            const deleted = await prisma.auditLog.deleteMany({
                where: {
                    timestamp: { lt: cutoffDate },
                },
            });

            logger.info('Old audit logs purged', {
                count: deleted.count,
                before: cutoffDate,
            });

            return deleted;
        } catch (error) {
            logger.error('Failed to purge old logs', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Detect suspicious activity
     */
    async detectSuspiciousActivity(userId) {
        try {
            const recentLogs = await prisma.auditLog.findMany({
                where: {
                    userId,
                    timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
            });

            const suspicious = [];

            // Multiple failed login attempts
            const failedAttempts = recentLogs.filter(
                (log) => log.resource === 'authentication' && log.status === 'failed'
            ).length;

            if (failedAttempts > 5) {
                suspicious.push({
                    type: 'brute_force',
                    severity: 'high',
                    failedAttempts,
                    recommendation: 'Temporary account lockout',
                });
            }

            // Unusual data access
            const dataAccess = recentLogs.filter((log) => log.action === 'READ').length;
            if (dataAccess > 1000) {
                suspicious.push({
                    type: 'high_data_access',
                    severity: 'medium',
                    accessCount: dataAccess,
                    recommendation: 'Review data access patterns',
                });
            }

            if (suspicious.length > 0) {
                logger.warn('Suspicious activity detected', {
                    userId,
                    alerts: suspicious,
                });
            }

            return suspicious;
        } catch (error) {
            logger.error('Failed to detect suspicious activity', {
                error: error.message,
            });
            return [];
        }
    }

    /**
     * SOC 2 compliance middleware
     */
    socMiddleware() {
        return (req, res, next) => {
            // Set security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

            // Log request for audit
            const requestId = req.id || require('uuid').v4();
            res.setHeader('X-Request-ID', requestId);

            // Capture response
            const originalJson = res.json;
            res.json = function (body) {
                // Log response
                this.logAuditEntry(req.user?.id, req.path, 'READ', {
                    requestId,
                    userId: req.user?.id,
                    endpoint: req.path,
                    method: req.method,
                    statusCode: res.statusCode,
                });

                return originalJson.call(this, body);
            };

            next();
        };
    }

    /**
     * Privacy-by-design principles
     */
    getPBDPrinciples() {
        return {
            principles: [
                'Proactive, not reactive',
                'Privacy by default',
                'Privacy embedded into design',
                'Full functionality',
                'End-to-end security',
                'Visibility and transparency',
                'Respect for user privacy',
            ],
            implementation: {
                dataMinimization: 'Collect only needed data',
                encryption: 'Encrypt data at rest and in transit',
                accessControl: 'Implement role-based access',
                retention: 'Delete data when no longer needed',
                transparency: 'Clear privacy policies',
            },
        };
    }
}

module.exports = new ComplianceAuditService();
