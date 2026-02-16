// apps/api/src/services/driverPerformanceScoring.js

class DriverPerformanceScoringService {
  /**
   * Comprehensive driver performance scoring system
   * Evaluates: safety, reliability, customer satisfaction, efficiency
   */

  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Calculate overall driver score
   */
  async calculateDriverScore(driverId) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { shipments: true, reviews: true, violations: true },
    });

    if (!driver) return null;

    const scores = {
      safety: this.calculateSafetyScore(driver),
      reliability: await this.calculateReliabilityScore(driver),
      customerSatisfaction: this.calculateSatisfactionScore(driver),
      efficiency: this.calculateEfficiencyScore(driver),
      professionalism: this.calculateProfessionalismScore(driver),
    };

    const weights = {
      safety: 0.25,
      reliability: 0.25,
      customerSatisfaction: 0.25,
      efficiency: 0.15,
      professionalism: 0.1,
    };

    this.overallScore = Object.entries(scores).reduce(
      (sum, [key, value]) => sum + value * weights[key],
      0,
    );

    const tier = this.getDriverTier(this.overallScore);

    return {
      driverId,
      overallScore: Math.round(this.overallScore * 100) / 100,
      tier,
      scores,
      badgeEarned: this.getBadges(scores),
      incentives: this.getIncentives(tier),
      improvements: this.getImprovementAreas(scores),
    };
  }

  /**
   * Safety Score (0-100)
   * Based on: accidents, violations, safety complaints
   */
  calculateSafetyScore(driver) {
    let score = 100;

    // Deduct for violations
    if (driver.violations) {
      driver.violations.forEach((v) => {
        if (v.type === "speeding") score -= 5;
        if (v.type === "rash_driving") score -= 10;
        if (v.type === "accident") score -= 15;
      });
    }

    // Deduct for safety complaints
    const safetyComplaints = driver.reviews?.filter((r) => r.safetyRating < 3).length || 0;
    score -= safetyComplaints * 3;

    return Math.max(score, 0);
  }

  /**
   * Reliability Score (0-100)
   * Based on: on-time delivery, cancellations, failed deliveries
   */
  async calculateReliabilityScore(driver) {
    let score = 100;

    const shipments = driver.shipments || [];
    const lateDeliveries = shipments.filter((s) => s.deliveredAt > s.estimatedDelivery).length;
    const totalDeliveries = shipments.filter((s) => s.status === "delivered").length;

    if (totalDeliveries > 0) {
      const latePercentage = (lateDeliveries / totalDeliveries) * 100;
      score -= latePercentage * 0.5;
    }

    // Deduct for cancellations
    const cancellations = shipments.filter((s) => s.status === "cancelled").length;
    score -= cancellations * 2;

    // Deduct for failed deliveries
    const failedDeliveries = shipments.filter((s) => s.status === "failed").length;
    score -= failedDeliveries * 5;

    return Math.max(score, 0);
  }

  /**
   * Customer Satisfaction Score (0-100)
   * Based on: ratings, reviews, complaints
   */
  calculateSatisfactionScore(driver) {
    const reviews = driver.reviews || [];

    if (reviews.length === 0) return 80; // Default for new drivers

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return avgRating * 20; // Scale 1-5 to 0-100
  }

  /**
   * Efficiency Score (0-100)
   * Based on: shipments per day, average delivery time
   */
  calculateEfficiencyScore(driver) {
    const shipments = driver.shipments || [];
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const recentShipments = shipments.filter((s) => s.createdAt > lastMonth);
    const daysActive = Math.ceil((Date.now() - driver.createdAt) / (1000 * 60 * 60 * 24));

    const shipmentsPerDay = recentShipments.length / (daysActive || 1);
    const efficiencyScore = Math.min((shipmentsPerDay / 20) * 100, 100); // Benchmark: 20 per day

    return efficiencyScore;
  }

  /**
   * Professionalism Score (0-100)
   * Based on: documentation, vehicle condition, communication
   */
  calculateProfessionalismScore(driver) {
    let score = 100;

    // Deduct if documents are incomplete
    if (!driver.licenseVerified) score -= 10;
    if (!driver.backgroundCheckPassed) score -= 15;
    if (!driver.insuranceActive) score -= 20;

    // Deduct for communication issues
    const responseTimes = driver.reviews?.map((r) => r.responseTime) || [];
    if (responseTimes.some((t) => t > 3600000)) score -= 5; // Slow response

    return Math.max(score, 0);
  }

  /**
   * Get driver tier based on score
   */
  getDriverTier(score) {
    if (score >= 95) return "PLATINUM";
    if (score >= 85) return "GOLD";
    if (score >= 75) return "SILVER";
    if (score >= 65) return "BRONZE";
    return "STANDARD";
  }

  /**
   * Get badges based on performance
   */
  getBadges(scores) {
    const badges = [];

    if (scores.safety === 100) badges.push("Safety Champion");
    if (scores.reliability === 100) badges.push("Reliability Expert");
    if (scores.customerSatisfaction > 95) badges.push("Customer Favorite");
    if (scores.efficiency > 90) badges.push("Speed Demon");

    return badges;
  }

  /**
   * Get incentives based on tier
   */
  getIncentives(tier) {
    const incentives = {
      PLATINUM: ["$200 bonus", "10% commission boost", "Priority assignment"],
      GOLD: ["$100 bonus", "5% commission boost", "Preferred routes"],
      SILVER: ["$50 bonus", "2% commission boost"],
      BRONZE: ["Monthly bonus opportunity"],
      STANDARD: [],
    };

    return incentives[tier] || [];
  }

  /**
   * Get improvement areas
   */
  getImprovementAreas(scores) {
    const areas = [];

    if (scores.safety < 80) areas.push({ area: "Safety", priority: "HIGH" });
    if (scores.reliability < 80) areas.push({ area: "Reliability", priority: "HIGH" });
    if (scores.customerSatisfaction < 75)
      areas.push({ area: "Customer Service", priority: "MEDIUM" });
    if (scores.efficiency < 70) areas.push({ area: "Efficiency", priority: "MEDIUM" });

    return areas;
  }
}

module.exports = { DriverPerformanceScoringService };
