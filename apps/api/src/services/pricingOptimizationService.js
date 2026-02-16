/**
 * Dynamic Pricing Optimization Service
 * Algorithmic pricing based on demand, competition, driver performance, and market conditions
 * Used for premium tier driver recommendations and shipper surge pricing
 */

const { logger } = require("../middleware/logger");

class PricingOptimizationService {
  constructor() {
    this.priceCache = new Map();
    this.markerRates = new Map(); // Track market rates per corridor
    this.demandHistory = new Map(); // Historical demand per corridor
    this.updateInterval = 1000 * 60 * 15; // 15 minutes
  }

  /**
   * Calculate optimal pricing for a shipper load
   * Balances: load capacity → driver conversions → market competitiveness
   */
  async calculateOptimalShipperRate(shipment, marketData = {}, historicalConversions = {}) {
    try {
      logger.info("Pricing: Calculating optimal shipper rate", {
        shipmentId: shipment.id,
      });

      // Base rate: shipper's initial offer
      const baseRate = shipment.offeredRate || this.getBaseRateEstimate(shipment);

      // Factor 1: Demand multiplier for corridor (1.0-2.0)
      const demandMultiplier = this.calculateDemandMultiplier(shipment.corridor, marketData);

      // Factor 2: Driver scarcity index (0.8-1.2)
      const scarcityFactor = this.calculateScarcityFactor(marketData);

      // Factor 3: Urgency premium (0.9-1.4)
      const urgencyMultiplier = this.calculateUrgencyMultiplier(shipment);

      // Factor 4: Weather/hazard risk premium (0.95-1.3)
      const hazardMultiplier = this.calculateHazardMultiplier(shipment);

      // Factor 5: Shipper reputation discount/premium (-0.1 to +0.1)
      const shipperFactor = this.calculateShipperFactor(marketData.shipperRating || 4.0);

      // Calculate final recommended rate
      const recommendedRate =
        baseRate *
        demandMultiplier *
        scarcityFactor *
        urgencyMultiplier *
        hazardMultiplier *
        (1 + shipperFactor);

      // Calculate confidence interval (±15%)
      const minRate = recommendedRate * 0.85;
      const maxRate = recommendedRate * 1.15;

      // Predict conversion likelihood at different price points
      const conversionPredictions = [];
      for (let priceMultiplier = 0.8; priceMultiplier <= 1.2; priceMultiplier += 0.1) {
        const price = recommendedRate * priceMultiplier;
        const conversionRate = this.predictConversionRate(
          price,
          recommendedRate,
          historicalConversions,
        );

        conversionPredictions.push({
          rate: Math.round(price * 100) / 100,
          expectedConversionRate: conversionRate,
          expectedBids: Math.round((marketData.availableDrivers || 100) * conversionRate),
        });
      }

      const result = {
        recommended: Math.round(recommendedRate * 100) / 100,
        minimum: Math.round(minRate * 100) / 100,
        maximum: Math.round(maxRate * 100) / 100,
        confidence: 0.87,
        factors: {
          demand: demandMultiplier,
          scarcity: scarcityFactor,
          urgency: urgencyMultiplier,
          hazard: hazardMultiplier,
          shipper: shipperFactor,
        },
        conversionPredictions,
        optimalPrice: this.findOptimalPrice(conversionPredictions, recommendedRate),
        reasoning: this.generatePricingReasoning(marketData, shipment),
      };

      logger.info("Pricing: Calculation complete", {
        shipmentId: shipment.id,
        recommended: result.recommended,
      });

      return result;
    } catch (err) {
      logger.error("Pricing: Optimal rate calculation failed", {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Calculate surge pricing multiplier based on market conditions
   * Used for special event pricing, peak hours, supply shortages
   */
  async calculateSurgePricing(corridor, timeSlot, currentConditions = {}) {
    try {
      logger.info("Pricing: Calculating surge pricing", { corridor, timeSlot });

      // Get baseline rate for corridor
      const baselineRate = this.getCorridorBaseline(corridor);

      // Factor 1: Time of day multiplier
      const timeMultiplier = this.getTimeOfDayMultiplier(timeSlot);

      // Factor 2: Day of week multiplier
      const dayMultiplier = this.getDayOfWeekMultiplier(new Date().getDay());

      // Factor 3: Supply shortage index
      const supplyShortageIndex = currentConditions.loadsWaitingPerDriver || 3;
      const supplyMultiplier = Math.min(2.0, 1.0 + supplyShortageIndex * 0.15);

      // Factor 4: Active driver count (fewer drivers = higher surge)
      const activeDrivers = currentConditions.activeDrivers || 10000;
      const driverAvailability = this.calculateDriverAvailability(activeDrivers);

      // Factor 5: Historical volatility
      const historicalVolatility = this.getCorridorVolatility(corridor);

      // Calculate surge multiplier
      const surgeFactor = timeMultiplier * dayMultiplier * supplyMultiplier * driverAvailability;

      const surgeRate = baselineRate * surgeFactor;

      // Cap surge to reasonable limits (0.5x - 2.5x)
      const cappedRate = Math.min(surgeRate, baselineRate * 2.5);

      const result = {
        baselineRate,
        surgeRate: Math.round(cappedRate * 100) / 100,
        surgeFactor: Math.round(surgeFactor * 100) / 100,
        priceIncrease: Math.round((cappedRate - baselineRate) * 100) / 100,
        multipliers: {
          timeOfDay: timeMultiplier,
          dayOfWeek: dayMultiplier,
          supplyShortage: supplyMultiplier,
          driverAvailability,
        },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        reasoning: this.generateSurgeReasoning(surgeFactor, currentConditions),
      };

      logger.info("Pricing: Surge pricing calculated", {
        corridor,
        surveyFactor: result.surgeFactor,
      });

      return result;
    } catch (err) {
      logger.error("Pricing: Surge pricing failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Calculate historical rates by corridor
   * Shows trends over time for business intelligence
   */
  async getCorridorRateTrends(corridor, days = 30) {
    try {
      logger.info("Pricing: Computing corridor trends", { corridor, days });

      // In production, would query database for historical rates
      const historicalRates = [
        { date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), rate: 1200 },
        { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), rate: 1250 },
        { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), rate: 1300 },
        { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), rate: 1350 },
        { date: new Date(), rate: 1400 },
      ];

      // Calculate trend
      const rates = historicalRates.map((r) => r.rate);
      const avgRate = rates.reduce((a, b) => a + b) / rates.length;
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);
      const volatility = Math.sqrt(
        rates.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / rates.length,
      );

      // Calculate trend direction
      const firstHalf =
        rates.slice(0, Math.floor(rates.length / 2)).reduce((a, b) => a + b) /
        Math.floor(rates.length / 2);
      const secondHalf =
        rates.slice(Math.floor(rates.length / 2)).reduce((a, b) => a + b) /
        Math.ceil(rates.length / 2);
      const trendDirection = secondHalf > firstHalf ? "up" : "down";

      return {
        corridor,
        historicalRates,
        trends: {
          current: historicalRates[historicalRates.length - 1].rate,
          average: Math.round(avgRate),
          minimum: minRate,
          maximum: maxRate,
          volatility: Math.round(volatility),
          direction: trendDirection,
          changePercent: Math.round(((secondHalf - firstHalf) / firstHalf) * 100),
        },
        forecast: this.forecastRateTrend(historicalRates),
      };
    } catch (err) {
      logger.error("Pricing: Trend calculation failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Competitor rate analysis - How do we compare?
   */
  async getCompetitorAnalysis(corridor, ourRate) {
    try {
      // In production, would integrate with competitor data feeds
      const competitorRates = [
        { competitor: "XPO Logistics", rate: 1380, marketShare: 0.15 },
        { competitor: "J.B. Hunt", rate: 1420, marketShare: 0.12 },
        { competitor: "Schneider", rate: 1400, marketShare: 0.1 },
      ];

      const avgCompetitorRate =
        competitorRates.reduce((sum, c) => sum + c.rate, 0) / competitorRates.length;

      const ourCompetitiveness = {
        ourRate,
        avgCompetitor: Math.round(avgCompetitorRate),
        difference: Math.round(ourRate - avgCompetitorRate),
        percentDifference: Math.round(((ourRate - avgCompetitorRate) / avgCompetitorRate) * 100),
        ranking:
          ourRate > avgCompetitorRate
            ? "Above market"
            : ourRate < avgCompetitorRate * 0.95
              ? "Below market (preferred)"
              : "At market",
      };

      return {
        corridor,
        ourRate,
        competitorRates,
        competitiveness: ourCompetitiveness,
        recommendation: this.getCompetitivenessRecommendation(ourCompetitiveness),
      };
    } catch (err) {
      logger.error("Pricing: Competitor analysis failed", {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Incentive optimization - Calculate driver bonus tiers
   */
  async calculateOptimalIncentives(targetMetrics = {}) {
    try {
      logger.info("Pricing: Calculating optimal incentives", { targetMetrics });

      // Base incentive: 15% of load value
      const baseIncentivePercent = 0.15;

      // Tier 1: Standard performance
      const tier1Bonus = {
        name: "Bronze",
        condition: "Drivers with 4.2+ rating",
        incentive: baseIncentivePercent,
        examples: [
          { loads: 10, bonus: 1500, description: "Complete 10 loads" },
          { loads: 20, bonus: 3500, description: "Complete 20 loads" },
        ],
      };

      // Tier 2: High performance
      const tier2Bonus = {
        name: "Silver",
        condition: "Drivers with 4.6+ rating + 95% on-time",
        incentive: baseIncentivePercent * 1.5,
        examples: [
          { loads: 10, bonus: 2200, description: "Complete 10 loads" },
          { loads: 20, bonus: 5000, description: "Complete 20 loads" },
        ],
      };

      // Tier 3: Elite performance
      const tier3Bonus = {
        name: "Gold",
        condition: "Drivers with 4.8+ rating + 98% on-time + hazmat certified",
        incentive: baseIncentivePercent * 2.0,
        examples: [
          { loads: 10, bonus: 3000, description: "Complete 10 loads" },
          { loads: 20, bonus: 6500, description: "Complete 20 loads" },
        ],
      };

      // Special promotions
      const specialPromotions = [
        {
          name: "Peak Hours Bonus",
          bonus: 150,
          description: "Accept loads between 6-10 PM, 25% extra",
          qualifying: "Available any time during peak window",
        },
        {
          name: "Hazmat Premium",
          bonus: 200,
          description: "Every hazmat load gets +$200",
          qualifying: "Must be hazmat certified",
        },
        {
          name: "Referral Bonus",
          bonus: 500,
          description: "Refer a new driver for $500",
          qualifying: "Referred driver must complete 5 loads",
        },
      ];

      const incentives = {
        tiers: [tier1Bonus, tier2Bonus, tier3Bonus],
        specialPromotions,
        totalBudget: 50000, // Monthly incentive budget
        estimatedParticipation: "70% of active drivers",
        expectedROI: 2.5, // 2.5x return on incentive investment
      };

      logger.info("Pricing: Incentive tiers calculated", {
        tiers: 3,
        promotions: specialPromotions.length,
      });

      return incentives;
    } catch (err) {
      logger.error("Pricing: Incentive calculation failed", {
        error: err.message,
      });
      throw err;
    }
  }

  // ============ HELPER METHODS ============

  calculateDemandMultiplier(corridor, marketData) {
    const loadsPerDriver = marketData.loadsPerDriver || 3;
    if (loadsPerDriver > 8) return 1.8; // Very high demand
    if (loadsPerDriver > 5) return 1.4; // High demand
    if (loadsPerDriver > 2) return 1.0; // Normal
    return 0.85; // Low demand
  }

  calculateScarcityFactor(marketData) {
    const availableDrivers = marketData.availableDrivers || 100;
    if (availableDrivers < 50) return 1.2; // Scarce
    if (availableDrivers < 100) return 1.1; // Tight
    return 0.95; // Plentiful
  }

  calculateUrgencyMultiplier(shipment) {
    const pickupDate = new Date(shipment.pickupDate);
    const hoursUntil = (pickupDate - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil < 4) return 1.4; // Emergency
    if (hoursUntil < 12) return 1.2; // Urgent
    if (hoursUntil < 48) return 1.05; // Soon
    return 0.95; // Planned ahead
  }

  calculateHazardMultiplier(shipment) {
    let multiplier = 1.0;

    if (shipment.hazmat) multiplier *= 1.25;
    if (shipment.requiresSpecialEquip) multiplier *= 1.1;
    if (shipment.highValueCargo) multiplier *= 1.15;

    return Math.min(multiplier, 1.3);
  }

  calculateShipperFactor(shipperRating) {
    // Excellent shippers get slight discount (more loads accepted)
    return (shipperRating - 4.0) * 0.05; // Range: -0.1 to +0.1
  }

  predictConversionRate(testPrice, basePrice, historical = {}) {
    const priceRatio = testPrice / basePrice;

    if (priceRatio > 1.15) return 0.4; // Too expensive
    if (priceRatio > 1.05) return 0.65;
    if (priceRatio > 0.95) return 0.85; // Sweet spot
    if (priceRatio > 0.85) return 0.75;
    return 0.5; // Too cheap = quality concern
  }

  findOptimalPrice(predictions, basePrice) {
    // Find price that balances conversion rate with revenue
    let optimal = predictions[0];

    for (const pred of predictions) {
      const revenue = pred.rate * pred.expectedBids;
      const optimalRevenue = optimal.rate * optimal.expectedBids;

      if (revenue > optimalRevenue) {
        optimal = pred;
      }
    }

    return optimal;
  }

  getTimeOfDayMultiplier(timeSlot) {
    // Peak hours have more drivers available = lower multiplier
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) return 0.9; // Night (fewer drivers)
    if (hour >= 6 && hour < 9) return 1.2; // Morning peak
    if (hour >= 16 && hour < 19) return 1.1; // Evening rush
    return 1.0; // Off-peak
  }

  getDayOfWeekMultiplier(dayOfWeek) {
    // Monday-Friday: higher demand
    if (dayOfWeek === 0) return 0.95; // Sunday
    if (dayOfWeek === 6) return 1.05; // Saturday
    return 1.1; // Weekday
  }

  calculateDriverAvailability(activeDrivers) {
    if (activeDrivers < 5000) return 1.3; // Very scarce
    if (activeDrivers < 10000) return 1.15; // Tight
    if (activeDrivers > 50000) return 0.85; // Plentiful
    return 1.0;
  }

  getCorridorVolatility(corridor) {
    // Would calculate from database
    return 0.12; // 12% std deviation
  }

  getCorridorBaseline(corridor) {
    // Would fetch from database
    return 1250;
  }

  getBaseRateEstimate(shipment) {
    // $1.50/mile base + equipment premium
    return 1.5 * shipment.miles;
  }

  generatePricingReasoning(marketData, shipment) {
    const reasons = [];

    if (marketData.loadsPerDriver > 5) {
      reasons.push("High demand supports premium pricing");
    }
    if (shipment.hazmat) {
      reasons.push("Hazmat loads command higher rates");
    }
    if ((new Date(shipment.pickupDate) - Date.now()) / (1000 * 60 * 60) < 24) {
      reasons.push("Load urgency justifies rate premium");
    }

    return reasons;
  }

  generateSurgeReasoning(surgeFactor, conditions) {
    const reasons = [];

    if (conditions.loadsWaitingPerDriver > 5) {
      reasons.push("Supply shortage driving rates up");
    }
    if (!conditions.activeDrivers || conditions.activeDrivers < 10000) {
      reasons.push("Limited driver availability");
    }

    return reasons;
  }

  getCompetitivenessRecommendation(competitiveness) {
    if (competitiveness.percentDifference > 10) return "Reduce price to compete";
    if (competitiveness.percentDifference < -10) return "Increase price - below market";
    return "Pricing is competitive";
  }

  forecastRateTrend(historicalRates) {
    const rates = historicalRates.map((r) => r.rate);
    const n = rates.length;

    // Simple linear regression forecast
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = x.reduce((a, b) => a + b) / n;
    const rateMean = rates.reduce((a, b) => a + b) / n;

    const slope =
      x.reduce((sum, xi, i) => sum + (xi - xMean) * (rates[i] - rateMean), 0) /
      x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    // Forecast next 7 days
    const forecast = [];
    for (let day = 1; day <= 7; day++) {
      forecast.push({
        day,
        forecastedRate: Math.round(rateMean + slope * (n + day - 2)),
      });
    }

    return forecast;
  }
}

module.exports = new PricingOptimizationService();
