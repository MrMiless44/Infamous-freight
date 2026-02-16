/**
 * Compliance Tracking Service
 * Hours of Service (HOS), Electronic Logging Device (ELD), FMCSA compliance monitoring
 */

const { logger } = require("../middleware/logger");
const prisma = require("../db/prisma");

class ComplianceService {
  constructor() {
    // HOS limits per FMCSA rules (Title 49 CFR Part 395)
    this.hosLimits = {
      property: {
        drivingLimit: 11, // hours per day
        onDutyLimit: 14, // hours per day
        weeklyLimit: 60, // hours per 7 days (for drivers on 7-day schedule)
        weeklyLimitAlt: 70, // hours per 8 days (for drivers on 8-day schedule)
        restBreakRequired: 0.5, // 30 minutes after 8 hours driving
        offDutyReset: 34, // hours for weekly reset
      },
      passenger: {
        drivingLimit: 10,
        onDutyLimit: 15,
        weeklyLimit: 60,
        weeklyLimitAlt: 70,
        restBreakRequired: 0,
        offDutyReset: 34,
      },
    };

    // Violation severity
    this.violationSeverity = {
      critical: 10, // Immediate action required
      serious: 7, // High priority
      moderate: 5, // Monitor closely
      minor: 2, // Warning
    };
  }

  /**
   * Track driver hours of service
   */
  async trackHOS(driverId, activity) {
    try {
      logger.info("Tracking HOS", { driverId, activity: activity.type });

      // Record activity
      const hosLog = await prisma.hosLog.create({
        data: {
          driverId,
          activityType: activity.type, // 'driving', 'on_duty', 'off_duty', 'sleeper'
          startTime: activity.startTime,
          endTime: activity.endTime,
          location: activity.location,
          odometer: activity.odometer,
          document: activity.document || null,
        },
      });

      // Check for violations
      const violations = await this.checkHOSViolations(driverId);

      // Send alerts if violations detected
      if (violations.length > 0) {
        await this.sendComplianceAlerts(driverId, violations);
      }

      return {
        logged: true,
        logId: hosLog.id,
        violations,
        currentStatus: await this.getDriverHOSStatus(driverId),
      };
    } catch (error) {
      logger.error({ error }, "HOS tracking error");
      throw error;
    }
  }

  /**
   * Check for HOS violations
   */
  async checkHOSViolations(driverId) {
    try {
      const violations = [];
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      const vehicleType = driver?.vehicleType || "property";
      const limits = this.hosLimits[vehicleType];

      // Get logs for the last 8 days
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const logs = await prisma.hosLog.findMany({
        where: {
          driverId,
          startTime: { gte: eightDaysAgo },
        },
        orderBy: { startTime: "asc" },
      });

      // Calculate today's hours
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = logs.filter((log) => new Date(log.startTime) >= today);

      const todayDriving = this.sumHours(todayLogs.filter((l) => l.activityType === "driving"));
      const todayOnDuty = this.sumHours(
        todayLogs.filter((l) => ["driving", "on_duty"].includes(l.activityType)),
      );

      // Check 11-hour driving limit
      if (todayDriving > limits.drivingLimit) {
        violations.push({
          type: "DRIVING_LIMIT_EXCEEDED",
          severity: "critical",
          message: `Driving time (${todayDriving.toFixed(1)}h) exceeds ${limits.drivingLimit}h limit`,
          hours: todayDriving,
          limit: limits.drivingLimit,
          timestamp: new Date().toISOString(),
        });
      }

      // Check 14-hour on-duty limit
      if (todayOnDuty > limits.onDutyLimit) {
        violations.push({
          type: "ON_DUTY_LIMIT_EXCEEDED",
          severity: "critical",
          message: `On-duty time (${todayOnDuty.toFixed(1)}h) exceeds ${limits.onDutyLimit}h limit`,
          hours: todayOnDuty,
          limit: limits.onDutyLimit,
          timestamp: new Date().toISOString(),
        });
      }

      // Check 30-minute break requirement
      if (vehicleType === "property" && todayDriving > 8) {
        const hasBreak = this.checkRestBreak(todayLogs, 8, 0.5);
        if (!hasBreak) {
          violations.push({
            type: "REST_BREAK_REQUIRED",
            severity: "serious",
            message: "30-minute break required after 8 hours of driving",
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Check 60/70 hour weekly limit
      const weeklyHours = this.sumHours(
        logs.filter((l) => ["driving", "on_duty"].includes(l.activityType)),
      );
      if (weeklyHours > limits.weeklyLimit) {
        violations.push({
          type: "WEEKLY_LIMIT_EXCEEDED",
          severity: "serious",
          message: `Weekly hours (${weeklyHours.toFixed(1)}h) exceed ${limits.weeklyLimit}h limit`,
          hours: weeklyHours,
          limit: limits.weeklyLimit,
          timestamp: new Date().toISOString(),
        });
      }

      // Log violations
      if (violations.length > 0) {
        logger.warn("HOS violations detected", {
          driverId,
          violationCount: violations.length,
          types: violations.map((v) => v.type),
        });

        // Record violations
        await prisma.complianceViolation.createMany({
          data: violations.map((v) => ({
            driverId,
            type: v.type,
            severity: v.severity,
            message: v.message,
            timestamp: new Date(),
          })),
        });
      }

      return violations;
    } catch (error) {
      logger.error({ error }, "HOS violation check error");
      return [];
    }
  }

  /**
   * Get current HOS status for driver
   */
  async getDriverHOSStatus(driverId) {
    try {
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      const vehicleType = driver?.vehicleType || "property";
      const limits = this.hosLimits[vehicleType];

      // Get today's logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = await prisma.hosLog.findMany({
        where: {
          driverId,
          startTime: { gte: today },
        },
      });

      // Get 8-day logs for weekly check
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const weeklyLogs = await prisma.hosLog.findMany({
        where: {
          driverId,
          startTime: { gte: eightDaysAgo },
        },
      });

      const drivingHours = this.sumHours(todayLogs.filter((l) => l.activityType === "driving"));
      const onDutyHours = this.sumHours(
        todayLogs.filter((l) => ["driving", "on_duty"].includes(l.activityType)),
      );
      const weeklyHours = this.sumHours(
        weeklyLogs.filter((l) => ["driving", "on_duty"].includes(l.activityType)),
      );

      return {
        driverId,
        today: {
          driving: {
            hours: drivingHours,
            remaining: Math.max(0, limits.drivingLimit - drivingHours),
            limit: limits.drivingLimit,
            status: drivingHours < limits.drivingLimit ? "OK" : "LIMIT_REACHED",
          },
          onDuty: {
            hours: onDutyHours,
            remaining: Math.max(0, limits.onDutyLimit - onDutyHours),
            limit: limits.onDutyLimit,
            status: onDutyHours < limits.onDutyLimit ? "OK" : "LIMIT_REACHED",
          },
        },
        weekly: {
          hours: weeklyHours,
          remaining: Math.max(0, limits.weeklyLimit - weeklyHours),
          limit: limits.weeklyLimit,
          status: weeklyHours < limits.weeklyLimit ? "OK" : "LIMIT_REACHED",
        },
        currentActivity: await this.getCurrentActivity(driverId),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({ error }, "HOS status error");
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(organizationId, startDate, endDate) {
    try {
      // Fetch all drivers in organization
      const drivers = await prisma.driver.findMany({
        where: { organizationId },
      });

      // Fetch all violations in date range
      const violations = await prisma.complianceViolation.findMany({
        where: {
          driverId: { in: drivers.map((d) => d.id) },
          timestamp: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: { driver: true },
      });

      // Calculate metrics
      const report = {
        organizationId,
        period: { start: startDate, end: endDate },
        summary: {
          totalDrivers: drivers.length,
          totalViolations: violations.length,
          violationRate: violations.length / drivers.length,
          criticalViolations: violations.filter((v) => v.severity === "critical").length,
          seriousViolations: violations.filter((v) => v.severity === "serious").length,
        },
        violationsByType: this.groupViolationsByType(violations),
        violationsByDriver: this.groupViolationsByDriver(violations),
        complianceScore: this.calculateComplianceScore(drivers.length, violations),
        recommendations: this.generateRecommendations(violations),
        generatedAt: new Date().toISOString(),
      };

      logger.info("Compliance report generated", {
        organizationId,
        totalViolations: report.summary.totalViolations,
        complianceScore: report.complianceScore,
      });

      return report;
    } catch (error) {
      logger.error({ error }, "Compliance report error");
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  sumHours(logs) {
    return logs.reduce((total, log) => {
      const start = new Date(log.startTime);
      const end = log.endTime ? new Date(log.endTime) : new Date();
      const hours = (end - start) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  }

  checkRestBreak(logs, afterHours, requiredDuration) {
    let drivingTime = 0;
    let foundBreak = false;

    for (const log of logs) {
      if (log.activityType === "driving") {
        const hours = (new Date(log.endTime) - new Date(log.startTime)) / (1000 * 60 * 60);
        drivingTime += hours;

        if (drivingTime >= afterHours) {
          // Check for break after this point
          const breakLog = logs.find(
            (l) => l.activityType === "off_duty" && new Date(l.startTime) >= new Date(log.endTime),
          );

          if (breakLog) {
            const breakDuration =
              (new Date(breakLog.endTime) - new Date(breakLog.startTime)) / (1000 * 60 * 60);
            if (breakDuration >= requiredDuration) {
              foundBreak = true;
            }
          }
        }
      }
    }

    return foundBreak;
  }

  async getCurrentActivity(driverId) {
    const latestLog = await prisma.hosLog.findFirst({
      where: { driverId },
      orderBy: { startTime: "desc" },
    });

    return latestLog
      ? {
          type: latestLog.activityType,
          startTime: latestLog.startTime,
          duration: (new Date() - new Date(latestLog.startTime)) / (1000 * 60 * 60),
        }
      : null;
  }

  async sendComplianceAlerts(driverId, violations) {
    // Send alerts via WebSocket, email, SMS
    logger.warn("Compliance alerts sent", { driverId, violations: violations.length });
    // This would integrate with notification service
  }

  groupViolationsByType(violations) {
    const grouped = {};
    for (const violation of violations) {
      if (!grouped[violation.type]) {
        grouped[violation.type] = [];
      }
      grouped[violation.type].push(violation);
    }
    return Object.entries(grouped).map(([type, items]) => ({
      type,
      count: items.length,
      severity: items[0].severity,
    }));
  }

  groupViolationsByDriver(violations) {
    const grouped = {};
    for (const violation of violations) {
      if (!grouped[violation.driverId]) {
        grouped[violation.driverId] = [];
      }
      grouped[violation.driverId].push(violation);
    }
    return Object.entries(grouped).map(([driverId, items]) => ({
      driverId,
      driverName: items[0].driver?.name || "Unknown",
      violations: items.length,
      critical: items.filter((v) => v.severity === "critical").length,
    }));
  }

  calculateComplianceScore(driverCount, violations) {
    if (driverCount === 0) return 100;

    // Base score 100, deduct points for violations
    let score = 100;
    for (const violation of violations) {
      score -= this.violationSeverity[violation.severity];
    }

    return Math.max(0, score);
  }

  generateRecommendations(violations) {
    const recommendations = [];

    const criticalCount = violations.filter((v) => v.severity === "critical").length;
    if (criticalCount > 5) {
      recommendations.push(
        "High number of critical violations. Immediate review of driver scheduling required.",
      );
    }

    const drivingLimit = violations.filter((v) => v.type === "DRIVING_LIMIT_EXCEEDED").length;
    if (drivingLimit > 0) {
      recommendations.push("Implement automated alerts when drivers approach 11-hour limit.");
    }

    const restBreak = violations.filter((v) => v.type === "REST_BREAK_REQUIRED").length;
    if (restBreak > 0) {
      recommendations.push("Enforce mandatory 30-minute breaks after 8 hours of driving.");
    }

    return recommendations;
  }
}

// Export singleton instance
module.exports = new ComplianceService();
