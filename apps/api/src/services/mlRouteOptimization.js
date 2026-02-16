// apps/api/src/services/mlRouteOptimization.js

const axios = require("axios");

class MLRouteOptimizationService {
  /**
   * Machine Learning-powered route optimization
   * Uses historical data + demand prediction + real-time traffic
   */

  constructor(prisma) {
    this.prisma = prisma;
    this.mlServer = process.env.ML_SERVER || "http://localhost:5000";
  }

  /**
   * Predict optimal routes using ML model
   */
  async optimizeRoutesML(shipments, drivers) {
    try {
      // Collect training data
      const trainingData = await this.prepareTrainingData(shipments, drivers);

      // Call ML model
      const prediction = await axios.post(`${this.mlServer}/api/optimize-routes`, {
        shipments: trainingData.shipments,
        drivers: trainingData.drivers,
        constraints: {
          maxWeight: 1000,
          maxDistance: 500,
          timeWindow: 480, // 8 hours
          preferences: {
            useHistorical: true,
            predictDemand: true,
            trafficAware: true,
          },
        },
      });

      // Extract routes
      const optimizedRoutes = this.extractRoutes(prediction.data);

      // Save to database for learning
      await this.saveRouteMetrics(optimizedRoutes);

      return optimizedRoutes;
    } catch (error) {
      console.error("ML optimization failed:", error);
      // Fallback to heuristic
      return this.fallbackOptimization(shipments, drivers);
    }
  }

  /**
   * Prepare data for ML model
   */
  async prepareTrainingData(shipments, drivers) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Get historical route data
    const historicalRoutes = await this.prisma.routeHistory.findMany({
      where: { createdAt: { gte: lastMonth } },
      include: { shipments: true, driver: true },
    });

    // Extract features
    const features = historicalRoutes.map((route) => ({
      distance: route.totalDistance,
      time: route.totalTime,
      cost: route.cost,
      efficiency: route.efficiency,
      driverRating: route.driver.rating,
      successRate: route.successRate,
      weatherCondition: route.weatherCondition,
      dayOfWeek: new Date(route.createdAt).getDay(),
      hour: new Date(route.createdAt).getHours(),
    }));

    return {
      shipments: shipments.map((s) => ({
        id: s.id,
        origin: s.origin,
        destination: s.destination,
        weight: s.weight,
        urgency: s.urgency,
        value: s.value,
        features: {
          distance: this.calculateDistance(s.origin, s.destination),
          timeWindow: s.deliveryWindow,
        },
      })),
      drivers: drivers.map((d) => ({
        id: d.id,
        currentLocation: d.location,
        capacity: d.capacity,
        rating: d.rating,
        preferredAreas: d.preferredAreas,
        workingHours: d.workingHours,
      })),
      historicalFeatures: features,
    };
  }

  /**
   * Extract optimized routes from ML prediction
   */
  extractRoutes(prediction) {
    const routes = {};

    Object.entries(prediction.routes).forEach(([driverId, route]) => {
      routes[driverId] = {
        driverId,
        shipments: route.shipmentIds,
        waypoints: route.waypoints,
        totalDistance: route.totalDistance,
        totalTime: route.totalTime,
        estimatedCost: route.estimatedCost,
        efficiency: route.efficiency,
        confidence: route.confidence, // ML confidence score
        alternativeRoutes: route.alternativeRoutes || [],
      };
    });

    return routes;
  }

  /**
   * Save route metrics for model retraining
   */
  async saveRouteMetrics(routes) {
    const metrics = Object.entries(routes).map(([driverId, route]) => ({
      driverId,
      shipmentCount: route.shipments.length,
      totalDistance: route.totalDistance,
      totalTime: route.totalTime,
      estimatedCost: route.estimatedCost,
      efficiency: route.efficiency,
      mlConfidence: route.confidence,
      timestamp: new Date(),
    }));

    // Batch save
    await this.prisma.routeMetrics.createMany({ data: metrics });
  }

  /**
   * Predict demand by location & time
   */
  async predictDemand(region, timeWindow) {
    try {
      const response = await axios.get(`${this.mlServer}/api/demand-forecast`, {
        params: { region, timeWindow },
      });

      return {
        region,
        timeWindow,
        predictedShipments: response.data.shipmentCount,
        demandLevel: response.data.level, // 'low', 'medium', 'high', 'peak'
        confidence: response.data.confidence,
        recommendedDrivers: response.data.recommendedDriverCount,
      };
    } catch (error) {
      console.error("Demand prediction failed:", error);
      return null;
    }
  }

  /**
   * Detect anomalies in route data
   */
  async detectAnomalies(route) {
    try {
      const response = await axios.post(`${this.mlServer}/api/anomaly-detect`, {
        distance: route.totalDistance,
        time: route.totalTime,
        cost: route.cost,
        efficiency: route.efficiency,
        shipmentCount: route.shipmentCount,
      });

      return {
        isAnomaly: response.data.isAnomaly,
        anomalyScore: response.data.score,
        reason: response.data.reason,
        alerts: response.data.alerts || [],
      };
    } catch (error) {
      return { isAnomaly: false };
    }
  }

  /**
   * Calculate distance (placeholder)
   */
  calculateDistance(origin, destination) {
    // Implement haversine or use cached value
    return Math.abs(Math.random() * 500);
  }

  /**
   * Fallback to heuristic optimization
   */
  fallbackOptimization(shipments, drivers) {
    // Implement greedy + 2-opt
    return { fallback: true, routes: {} };
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics() {
    try {
      const response = await axios.get(`${this.mlServer}/api/model-metrics`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

module.exports = { MLRouteOptimizationService };
