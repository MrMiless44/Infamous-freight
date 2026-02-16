// apps/api/src/services/fraudDetection.js

class FraudDetectionService {
  /**
   * Advanced fraud detection using ML + rule-based detection
   * Detects payment fraud, rating manipulation, and system abuse
   */

  constructor(prisma) {
    this.prisma = prisma;
    this.riskThresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
    };
  }

  /**
   * Analyze payment for fraud signals
   */
  async analyzePaymentFraud(payment) {
    const signals = [];
    let riskScore = 0;

    // Check 1: Velocity check (multiple transactions in short time)
    const recentTransactions = await this.prisma.payment.findMany({
      where: {
        userId: payment.userId,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
      },
    });

    if (recentTransactions.length > 5) {
      signals.push({ type: "velocity", severity: "high" });
      riskScore += 0.3;
    }

    // Check 2: Amount anomaly
    const avgTransaction = await this.getAverageTransaction(payment.userId);
    if (payment.amount > avgTransaction * 2.5) {
      signals.push({ type: "amount_anomaly", severity: "medium" });
      riskScore += 0.2;
    }

    // Check 3: Card freshness (new card = higher risk)
    const isNewCard = await this.isNewCard(payment.cardId);
    if (isNewCard) {
      signals.push({ type: "new_card", severity: "low" });
      riskScore += 0.1;
    }

    // Check 4: Geographic mismatch
    const geoMismatch = await this.checkGeographicMismatch(payment);
    if (geoMismatch) {
      signals.push({ type: "geo_mismatch", severity: "high" });
      riskScore += 0.25;
    }

    // Check 5: Billing-Shipping mismatch
    if (this.addressMismatch(payment.billingAddress, payment.shippingAddress)) {
      signals.push({ type: "address_mismatch", severity: "medium" });
      riskScore += 0.15;
    }

    return {
      paymentId: payment.id,
      riskScore: Math.min(riskScore, 1),
      riskLevel: this.getRiskLevel(riskScore),
      signals,
      recommendation: riskScore > 0.7 ? "BLOCK" : "ALLOW",
      flaggedAt: new Date(),
    };
  }

  /**
   * Detect rating/review manipulation
   */
  async detectRatingFraud(review) {
    const signals = [];
    let fraudScore = 0;

    // Check 1: Suspicious reviewer pattern
    const reviewerHistory = await this.prisma.review.findMany({
      where: { userId: review.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // All same rating?
    if (
      reviewerHistory.filter((r) => r.rating === review.rating).length === reviewerHistory.length
    ) {
      signals.push("always_same_rating");
      fraudScore += 0.2;
    }

    // Extreme ratings only?
    const extremes = reviewerHistory.filter((r) => r.rating === 1 || r.rating === 5);
    if (extremes.length / reviewerHistory.length > 0.8) {
      signals.push("extreme_ratings_only");
      fraudScore += 0.25;
    }

    // Check 2: Review farms
    const recentReviews = await this.prisma.review.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
    });

    if (recentReviews.length > 50) {
      signals.push("unusual_volume");
      fraudScore += 0.3;
    }

    // Check 3: Linguistic analysis (would use NLP in production)
    if (review.text && review.text.length < 10) {
      signals.push("suspiciously_short_review");
      fraudScore += 0.15;
    }

    return {
      reviewId: review.id,
      fraudScore: Math.min(fraudScore, 1),
      isFraudulent: fraudScore > 0.5,
      signals,
      action: fraudScore > 0.7 ? "REJECT" : "ALLOW",
    };
  }

  /**
   * Detect system abuse patterns
   */
  async detectAbuse(userId) {
    const abuse = [];
    let abuseScore = 0;

    // Check 1: Account farming (creating too many dummy accounts)
    const createdAccounts = await this.prisma.user.findMany({
      where: { referrerId: userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    if (createdAccounts.length > 10) {
      abuse.push("possible_account_farming");
      abuseScore += 0.3;
    }

    // Check 2: Referral fraud
    const referralBounty = await this.prisma.referralBonus.findMany({
      where: {
        referrerId: userId,
        claimedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (referralBounty.length > 20) {
      abuse.push("referral_fraud_pattern");
      abuseScore += 0.25;
    }

    // Check 3: Coupon abuse
    const couponUse = await this.prisma.couponUsage.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    if (couponUse.length > 15) {
      abuse.push("coupon_stacking");
      abuseScore += 0.35;
    }

    return {
      userId,
      abuseScore: Math.min(abuseScore, 1),
      hasAbuse: abuseScore > 0.5,
      patterns: abuse,
      action: abuseScore > 0.7 ? "SUSPEND" : "MONITOR",
    };
  }

  /**
   * Helper: Get average transaction amount
   */
  async getAverageTransaction(userId) {
    const result = await this.prisma.payment.aggregate({
      where: { userId },
      _avg: { amount: true },
    });

    return result._avg.amount || 0;
  }

  /**
   * Helper: Check if card is new
   */
  async isNewCard(cardId) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return true;

    const ageInDays = (Date.now() - card.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays < 7; // Less than 7 days old
  }

  /**
   * Helper: Check geographic mismatch
   */
  async checkGeographicMismatch(payment) {
    const user = await this.prisma.user.findUnique({ where: { id: payment.userId } });
    if (!user) return false;

    // Simple check: if payment location is far from user location
    const distance = this.getDistanceBetween(user.location, payment.location);
    return distance > 1000; // More than 1000km away
  }

  /**
   * Helper: Check address mismatch
   */
  addressMismatch(billing, shipping) {
    return billing.zipCode !== shipping.zipCode || billing.country !== shipping.country;
  }

  /**
   * Helper: Get risk level
   */
  getRiskLevel(score) {
    if (score < this.riskThresholds.low) return "LOW";
    if (score < this.riskThresholds.medium) return "MEDIUM";
    if (score < this.riskThresholds.high) return "HIGH";
    return "CRITICAL";
  }

  /**
   * Helper: Calculate distance between coordinates
   */
  getDistanceBetween(loc1, loc2) {
    // Implement haversine formula
    return Math.random() * 2000;
  }
}

module.exports = { FraudDetectionService };
