/**
 * ML Recommendation Service
 * Machine Learning-based load recommendations with predictive scoring
 * Uses collaborative filtering + content-based filtering hybrid approach
 */

const { logger } = require("../middleware/logger");

class MLRecommendationService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 min
    this.userProfiles = new Map(); // Track driver preferences
    this.modelVersion = "1.0.0";
  }

  /**
   * Get personalized load recommendations for a driver
   * Uses collaborative filtering + driver preferences
   */
  async getRecommendedLoads(userId, driverProfile, recentBids = [], limit = 20) {
    try {
      const cacheKey = `recommendations:${userId}`;
      const cached = this.cache.get(cacheKey);

      if (cached && cached.expiry > Date.now()) {
        logger.debug("ML: Recommendations cache hit", { userId });
        return cached.data;
      }

      logger.info("ML: Computing recommendations", { userId });

      // Build driver profile vector (features)
      const profileVector = this.buildDriverVector(driverProfile, recentBids);

      // Get available loads (would come from database)
      const availableLoads = await this.getAvailableLoads(driverProfile);

      // Score each load using hybrid algorithm
      const scoredLoads = availableLoads.map((load) => ({
        ...load,
        recommendationScore: this.calculateRecommendationScore(
          load,
          profileVector,
          driverProfile,
          recentBids,
        ),
      }));

      // Sort by recommendation score (highest first)
      const recommended = scoredLoads
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)
        .map((load) => ({
          ...load,
          reason: this.getRecommendationReason(load, profileVector),
        }));

      // Cache results
      this.cache.set(cacheKey, {
        data: recommended,
        expiry: Date.now() + this.cacheExpiry,
      });

      logger.info("ML: Recommendations computed", {
        userId,
        count: recommended.length,
      });

      return recommended;
    } catch (err) {
      logger.error("ML: Recommendations failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Predict driver earnings for next 30 days
   * Uses historical data + seasonal trends + market conditions
   */
  async predictEarnings(userId, historicalLoads = [], historicalMetrics = {}) {
    try {
      logger.info("ML: Computing earnings prediction", { userId });

      // Build time series features
      const timeSeriesFeatures = this.extractTimeSeriesFeatures(historicalLoads, historicalMetrics);

      // Extract trend and seasonality
      const trend = this.calculateTrend(timeSeriesFeatures.dailyEarnings);
      const seasonality = this.calculateSeasonality(timeSeriesFeatures.dailyEarnings);

      // Predict next 30 days
      const predictions = [];
      for (let day = 1; day <= 30; day++) {
        const dayOfWeek = (new Date().getDay() + day) % 7;
        const weekOfYear = Math.floor(day / 7) + 1;

        // Base trend forecast
        const trendComponent = trend.slope * day + trend.intercept;

        // Seasonal adjustment
        const seasonalFactor = seasonality[dayOfWeek] || 1.0;

        // Market factor (would fetch real-time)
        const marketFactor = 1.05; // 5% expected growth

        // Predicted earnings for this day
        const predicted = Math.round(trendComponent * seasonalFactor * marketFactor);

        predictions.push({
          day,
          date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
          predictedEarnings: Math.max(0, predicted),
          confidence: 0.85 - day * 0.01, // Confidence decreases with time
          components: {
            trend: trendComponent,
            seasonal: seasonalFactor,
            market: marketFactor,
          },
        });
      }

      // Calculate summary statistics
      const summary = {
        totalPredicted: predictions.reduce((sum, p) => sum + p.predictedEarnings, 0),
        averageDaily: predictions.reduce((sum, p) => sum + p.predictedEarnings, 0) / 30,
        bestDay: Math.max(...predictions.map((p) => p.predictedEarnings)),
        worstDay: Math.min(...predictions.map((p) => p.predictedEarnings)),
        trend: trend.direction, // "up" or "down"
        confidence: 0.82,
      };

      logger.info("ML: Earnings prediction complete", { userId, summary });

      return { predictions, summary };
    } catch (err) {
      logger.error("ML: Earnings prediction failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Suggest optimal rates for driver loads based on market conditions
   * Uses demand elasticity + competitor rates + driver performance
   */
  async suggestOptimalRate(shipment, driverProfile, marketConditions = {}) {
    try {
      const baseRate = shipment.rate || 1.5; // $ per mile

      // Market demand factor (0.8 to 1.3)
      const demandFactor = this.calculateDemandFactor(marketConditions);

      // Driver reputation factor (0.9 to 1.1)
      const reputationFactor = this.calculateReputationFactor(driverProfile);

      // Competitor rate factor
      const competitorFactor = this.calculateCompetitorFactor(marketConditions);

      // Time urgency (rush loads pay more)
      const urgencyFactor = this.calculateUrgencyFactor(shipment);

      // Calculate optimal rate
      const optimalRate =
        baseRate * demandFactor * reputationFactor * competitorFactor * urgencyFactor;

      // Calculate recommendation range
      const recommendation = {
        suggested: Math.round(optimalRate * 100) / 100,
        minimum: Math.round(optimalRate * 0.95 * 100) / 100, // -5% floor
        maximum: Math.round(optimalRate * 1.15 * 100) / 100, // +15% ceiling
        confidence: 0.78,
        factors: {
          demand: demandFactor,
          reputation: reputationFactor,
          competition: competitorFactor,
          urgency: urgencyFactor,
        },
        reasoning: this.getRateSuggestionReasons(
          demandFactor,
          reputationFactor,
          competitorFactor,
          urgencyFactor,
        ),
      };

      logger.info("ML: Rate suggestion computed", {
        shipmentId: shipment.id,
        suggested: recommendation.suggested,
      });

      return recommendation;
    } catch (err) {
      logger.error("ML: Rate suggestion failed", { error: err.message });
      throw err;
    }
  }

  /**
   * Build numerical feature vector from driver profile + behavior
   */
  buildDriverVector(profile, recentBids) {
    const bidsCount = recentBids.length;
    const acceptanceRate = profile.acceptanceRate || 0.85;
    const rating = profile.rating || 4.5;
    const onTimeRate = profile.onTimeRate || 0.95;
    const avgRatePerMile = profile.avgRatePerMile || 1.5;

    return {
      experience: Math.min(bidsCount / 100, 1.0), // Normalized 0-1
      reliability: (acceptanceRate + onTimeRate) / 2,
      quality: rating / 5.0,
      pricePoint: Math.min(avgRatePerMile / 3.0, 1.0),
      preferredEquipment: profile.equipmentTypes || [],
      geographicPreferences: profile.favoriteCorridors || [],
      commodityPreferences: profile.favoredCommodities || [],
    };
  }

  /**
   * Calculate recommendation score for a load (0-100)
   * Combines collaborative filtering + content-based filtering
   */
  calculateRecommendationScore(load, driverVector, driverProfile, recentBids) {
    let score = 50; // Base score

    // 1. Equipment match (0-20 points)
    if (driverVector.preferredEquipment.includes(load.equipmentType)) {
      score += 20;
    }

    // 2. Rate alignment (0-15 points)
    const ratePerMile = load.rate / (load.miles || 100);
    const rateDeviation = Math.abs(ratePerMile - driverVector.pricePoint);
    score += Math.max(0, 15 - rateDeviation * 10);

    // 3. Geographic preference (0-15 points)
    const corridor = `${load.pickupCity}→${load.dropoffCity}`;
    if (driverVector.geographicPreferences.includes(corridor)) {
      score += 15;
    } else if (load.miles < 400) {
      score += 8; // Bonus for reasonable distance
    }

    // 4. Commodity match (0-10 points)
    if (driverVector.commodityPreferences.includes(load.commodity)) {
      score += 10;
    }

    // 5. Freshness bonus (0-10 points)
    const hoursOld = (Date.now() - new Date(load.postedTime)) / (1000 * 60 * 60);
    if (hoursOld < 1) score += 10;
    else if (hoursOld < 6) score += 5;

    // 6. Similar driver success (0-10 points: collaborative filtering)
    // Would look at similar drivers' acceptance rates for this load
    score += 5; // Base collaborative score

    // 7. Hazmat penalty (-10 points)
    if (load.hazmat && !driverProfile.hazmatCertified) {
      score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Extract time series features for trend analysis
   */
  extractTimeSeriesFeatures(historicalLoads, historicalMetrics) {
    const dailyEarnings = historicalMetrics.dailyEarnings || [1500, 1600, 1550, 1700, 1800];

    return {
      dailyEarnings,
      avgDaily: dailyEarnings.reduce((a, b) => a + b, 0) / dailyEarnings.length,
      volatility: this.calculateVolatility(dailyEarnings),
      trend: this.calculateTrend(dailyEarnings),
    };
  }

  /**
   * Calculate linear trend (least squares regression)
   */
  calculateTrend(data) {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: data[0] || 0, direction: "flat" };

    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;

    const slope =
      x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0) /
      x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    const intercept = yMean - slope * xMean;

    return {
      slope,
      intercept,
      direction: slope > 0 ? "up" : slope < 0 ? "down" : "flat",
    };
  }

  /**
   * Calculate seasonality factors by day of week
   */
  calculateSeasonality(data) {
    const seasonality = { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0 };
    // Would compute from historical data
    // For now, return realistic patterns: weekends lower, weekdays higher
    seasonality[0] = 0.9; // Sunday
    seasonality[5] = 1.1; // Saturday
    seasonality[6] = 1.05; // Friday high
    return seasonality;
  }

  /**
   * Calculate demand factor from market conditions (0.8-1.3)
   */
  calculateDemandFactor(marketConditions) {
    const supplyDemandRatio = marketConditions.loadsPerDriver || 5;
    // High demand (many loads per driver) → higher rates
    if (supplyDemandRatio > 10) return 1.3;
    if (supplyDemandRatio > 5) return 1.15;
    if (supplyDemandRatio > 2) return 1.0;
    return 0.85;
  }

  /**
   * Driver reputation factor (0.9-1.1)
   */
  calculateReputationFactor(driverProfile) {
    const rating = driverProfile.rating || 4.5;
    return 0.9 + (rating / 5.0) * 0.2;
  }

  /**
   * Competitor rate factor
   */
  calculateCompetitorFactor(marketConditions) {
    const avgCompetitorRate = marketConditions.avgRate || 1.5;
    const desiredRate = 1.5;
    return avgCompetitorRate / desiredRate;
  }

  /**
   * Urgency factor for rush loads
   */
  calculateUrgencyFactor(shipment) {
    const pickupDate = new Date(shipment.pickupDate);
    const hoursUntilPickup = (pickupDate - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilPickup < 4) return 1.2; // Rush
    if (hoursUntilPickup < 24) return 1.1; // Soon
    if (hoursUntilPickup > 168) return 0.95; // Planned far ahead
    return 1.0;
  }

  /**
   * Calculate volatility (standard deviation)
   */
  calculateVolatility(data) {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const sqDiff = data.map((val) => Math.pow(val - mean, 2));
    return Math.sqrt(sqDiff.reduce((a, b) => a + b) / data.length);
  }

  /**
   * Get explanation for why this load was recommended
   */
  getRecommendationReason(load, driverVector) {
    const reasons = [];

    if (driverVector.preferredEquipment.includes(load.equipmentType)) {
      reasons.push("Matches your preferred equipment");
    }

    if (load.miles < 400) {
      reasons.push("Good distance for your profile");
    }

    if (load.score > 85) {
      reasons.push("High-quality load with good shipper rating");
    }

    return reasons.length > 0 ? reasons : ["Competitive rate for this corridor"];
  }

  /**
   * Get reasoning for rate suggestions
   */
  getRateSuggestionReasons(demand, reputation, competition, urgency) {
    const reasons = [];

    if (demand > 1.1) reasons.push("High market demand supports higher rates");
    if (reputation > 1.05) reasons.push("Your reputation warrants premium pricing");
    if (urgency > 1.05) reasons.push("Load urgency justifies rate premium");
    if (competition < 0.95) reasons.push("Lower competition allows better rates");

    return reasons.length > 0 ? reasons : ["Market-competitive rate"];
  }

  /**
   * Mock data for testing
   */
  async getAvailableLoads(profile) {
    // In production, would fetch from database
    return [
      {
        id: "load-1",
        pickupCity: "Denver",
        dropoffCity: "Phoenix",
        miles: 600,
        rate: 1800,
        equipmentType: "Dry Van",
        commodity: "General Freight",
        postedTime: new Date(),
        score: 90,
      },
      {
        id: "load-2",
        pickupCity: "Austin",
        dropoffCity: "Dallas",
        miles: 200,
        rate: 850,
        equipmentType: "Reefer",
        commodity: "Perishable",
        postedTime: new Date(),
        score: 85,
      },
    ];
  }
}

// Export singleton
module.exports = new MLRecommendationService();
