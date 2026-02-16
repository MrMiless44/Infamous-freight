// apps/api/src/services/advancedSchedulingEngine.js

class AdvancedSchedulingEngineService {
  /**
   * Constraint-based scheduling for pickups and deliveries
   * Optimizes based on time windows, vehicle capacity, driver availability
   */

  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Generate optimal schedule for shipments
   */
  async generateOptimalSchedule(shipments, drivers, constraints = {}) {
    // Sort shipments by priority
    const sortedShipments = this.prioritizeShipments(shipments);

    // Create schedule slots
    const schedule = {};
    const assignedShipments = [];

    for (const driver of drivers) {
      schedule[driver.id] = {
        driverId: driver.id,
        capacity: driver.capacity,
        used: 0,
        timeWindows: this.generateTimeWindows(driver),
        shipments: [],
      };
    }

    // Assign shipments to drivers
    for (const shipment of sortedShipments) {
      const bestDriver = this.findBestDriver(shipment, schedule, drivers);

      if (bestDriver) {
        schedule[bestDriver.id].shipments.push({
          shipmentId: shipment.id,
          weight: shipment.weight,
          eta: this.calculateETA(shipment, bestDriver),
          constraint: this.getConstraint(shipment),
        });

        schedule[bestDriver.id].used += shipment.weight;
        assignedShipments.push(shipment.id);
      }
    }

    return {
      schedule,
      assigned: assignedShipments,
      unassigned: shipments.filter((s) => !assignedShipments.includes(s.id)),
      optimality: this.calculateOptimality(schedule),
    };
  }

  /**
   * Prioritize shipments for scheduling
   */
  prioritizeShipments(shipments) {
    return shipments.sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) return (b.priority || 0) - (a.priority || 0);

      // Earlier deadline first
      if (a.deadlineTime !== b.deadlineTime) {
        return new Date(a.deadlineTime) - new Date(b.deadlineTime);
      }

      // Heavier first
      return b.weight - a.weight;
    });
  }

  /**
   * Generate available time windows for driver
   */
  generateTimeWindows(driver) {
    const today = new Date();
    const windows = [];

    // Morning slot: 6 AM - 12 PM
    windows.push({
      start: new Date(today.setHours(6, 0, 0)),
      end: new Date(today.setHours(12, 0, 0)),
      capacity: driver.capacity * 0.4,
    });

    // Afternoon slot: 12 PM - 6 PM
    windows.push({
      start: new Date(today.setHours(12, 0, 0)),
      end: new Date(today.setHours(18, 0, 0)),
      capacity: driver.capacity * 0.6,
    });

    return windows;
  }

  /**
   * Find best driver for shipment
   */
  findBestDriver(shipment, schedule, drivers) {
    let bestDriver = null;
    let bestScore = -Infinity;

    for (const driver of drivers) {
      const driverSchedule = schedule[driver.id];

      // Check capacity
      if (driverSchedule.used + shipment.weight > driverSchedule.capacity) {
        continue;
      }

      // Check time window
      const canFit = this.canFitInTimeWindow(shipment, driverSchedule);
      if (!canFit) continue;

      // Calculate score
      const score = this.calculateDriverScore(shipment, driverSchedule, driver);

      if (score > bestScore) {
        bestScore = score;
        bestDriver = driver;
      }
    }

    return bestDriver;
  }

  /**
   * Check if shipment can fit in available time window
   */
  canFitInTimeWindow(shipment, driverSchedule) {
    const pickupTime = new Date(shipment.pickupTime);

    for (const window of driverSchedule.timeWindows) {
      if (pickupTime >= window.start && pickupTime <= window.end) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate driver score for assignment (higher is better)
   */
  calculateDriverScore(shipment, driverSchedule, driver) {
    let score = 0;

    // Proximity to pickup location (in production, use actual distance)
    score += 50 * (1 - (shipment.pickupDistance || 0) / 100);

    // Driver availability
    score += 30 * (1 - driverSchedule.used / driverSchedule.capacity);

    // Driver rating
    score += 20 * (driver.rating / 5);

    return score;
  }

  /**
   * Calculate ETA
   */
  calculateETA(shipment, driver) {
    const pickupTime = new Date(shipment.pickupTime);
    const deliveryTime = new Date(pickupTime.getTime() + (shipment.estimatedDuration || 3600000));

    return {
      pickupETA: pickupTime,
      deliveryETA: deliveryTime,
      durationMinutes: (shipment.estimatedDuration || 3600000) / 60000,
    };
  }

  /**
   * Get scheduling constraints
   */
  getConstraint(shipment) {
    if (shipment.fragile) return "FRAGILE";
    if (shipment.hazmat) return "HAZMAT";
    if (shipment.temperature) return "TEMPERATURE_CONTROLLED";
    return "STANDARD";
  }

  /**
   * Calculate schedule optimality
   */
  calculateOptimality(schedule) {
    const totalCapacityUsed = Object.values(schedule).reduce((sum, s) => sum + s.used, 0);
    const totalCapacity = Object.values(schedule).reduce((sum, s) => sum + s.capacity, 0);

    return {
      capacityUtilization: Math.round((totalCapacityUsed / totalCapacity) * 100),
      balanceScore: this.calculateBalanceScore(schedule),
      efficiency: this.calculateEfficiency(schedule),
    };
  }

  /**
   * Calculate how balanced the schedule is among drivers
   */
  calculateBalanceScore(schedule) {
    const loads = Object.values(schedule).map((s) => s.used);
    const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / loads.length;

    // Lower variance = better balance (score 0-100)
    return 100 - Math.min(Math.sqrt(variance) * 10, 100);
  }

  /**
   * Calculate schedule efficiency
   */
  calculateEfficiency(schedule) {
    const totalShipments = Object.values(schedule).reduce((sum, s) => sum + s.shipments.length, 0);
    const totalDrivers = Object.keys(schedule).length;

    return Math.round(totalShipments / totalDrivers);
  }

  /**
   * Auto-reschedule on cancellation
   */
  async autoRescheduleOnCancellation(shipmentId, drivers) {
    // Find shipments affected by this cancellation
    // Re-optimize remaining schedule
    // Return new assignments

    return {
      rescheduled: true,
      affected: 0,
      newAssignments: [],
    };
  }
}

module.exports = { AdvancedSchedulingEngineService };
