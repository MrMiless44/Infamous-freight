// apps/api/src/services/costAllocation.js

class CostAllocationService {
  /**
   * Allocate shipment costs across departments/cost centers
   * Supports multiple allocation methods: weight-based, distance-based, value-based, fixed-percentage
   */
  allocateCosts(shipment, departmentWeights, method = "weight-based") {
    const baselineCost = this.calculateBaseCost(shipment);

    switch (method) {
      case "weight-based":
        return this.allocateByWeight(baselineCost, shipment, departmentWeights);
      case "distance-based":
        return this.allocateByDistance(baselineCost, shipment, departmentWeights);
      case "value-based":
        return this.allocateByValue(baselineCost, shipment, departmentWeights);
      case "fixed-percentage":
        return this.allocateByPercentage(baselineCost, departmentWeights);
      default:
        throw new Error(`Unknown allocation method: ${method}`);
    }
  }

  calculateBaseCost(shipment) {
    const RATE_PER_MILE = 2.5;
    const RATE_PER_LB = 0.15;

    return shipment.distance * RATE_PER_MILE + shipment.weight * RATE_PER_LB;
  }

  allocateByWeight(baseCost, shipment, departmentWeights) {
    const totalWeight = Object.values(departmentWeights).reduce((sum, val) => sum + val, 0);
    const allocation = {};

    Object.entries(departmentWeights).forEach(([dept, weight]) => {
      allocation[dept] = baseCost * (weight / totalWeight);
    });

    return allocation;
  }

  allocateByDistance(baseCost, shipment, departmentWeights) {
    const totalDistance = Object.values(departmentWeights).reduce((sum, val) => sum + val, 0);
    const allocation = {};

    Object.entries(departmentWeights).forEach(([dept, distance]) => {
      allocation[dept] = baseCost * (distance / totalDistance);
    });

    return allocation;
  }

  allocateByValue(baseCost, shipment, departmentWeights) {
    const totalValue = Object.values(departmentWeights).reduce((sum, val) => sum + val, 0);
    const allocation = {};

    Object.entries(departmentWeights).forEach(([dept, value]) => {
      allocation[dept] = baseCost * (value / totalValue);
    });

    return allocation;
  }

  allocateByPercentage(baseCost, percentages) {
    const allocation = {};

    Object.entries(percentages).forEach(([dept, percent]) => {
      allocation[dept] = baseCost * (percent / 100);
    });

    return allocation;
  }

  /**
   * Generate cost allocation report with breakdown
   */
  generateReport(allocations, shipmentId, period = "30d") {
    const report = {
      shipmentId,
      period,
      generatedAt: new Date(),
      totalCost: Object.values(allocations).reduce((sum, val) => sum + val, 0),
      allocations,
      details: Object.entries(allocations).map(([dept, cost]) => ({
        department: dept,
        cost: parseFloat(cost.toFixed(2)),
        percentage: parseFloat(
          ((cost / Object.values(allocations).reduce((sum, val) => sum + val, 0)) * 100).toFixed(1),
        ),
      })),
    };

    return report;
  }

  /**
   * Analyze cost trends across departments
   */
  analyzeTrends(historicalAllocations, timeLimit = 90) {
    const trends = {};
    const now = new Date();

    historicalAllocations.forEach((allocation) => {
      const allocationDate = new Date(allocation.timestamp);
      const daysAgo = (now - allocationDate) / (1000 * 60 * 60 * 24);

      if (daysAgo <= timeLimit) {
        Object.entries(allocation.allocations).forEach(([dept, cost]) => {
          if (!trends[dept]) {
            trends[dept] = { total: 0, count: 0, min: Infinity, max: 0 };
          }
          trends[dept].total += cost;
          trends[dept].count += 1;
          trends[dept].min = Math.min(trends[dept].min, cost);
          trends[dept].max = Math.max(trends[dept].max, cost);
        });
      }
    });

    const analysis = {};
    Object.entries(trends).forEach(([dept, data]) => {
      analysis[dept] = {
        average: data.total / data.count,
        total: data.total,
        count: data.count,
        min: data.min,
        max: data.max,
        trend: data.total > data.count * data.min ? "increasing" : "stable",
      };
    });

    return analysis;
  }
}

module.exports = { CostAllocationService };
