/**
 * Predictive Analytics Engine (Phase 11)
 *
 * Forecast key business metrics and customer behaviors
 *
 * Features:
 * - Churn prediction (who's likely to leave)
 * - LTV prediction (future customer value)
 * - Upsell opportunities identification
 * - Campaign response prediction
 * - Customer growth trajectory
 * - Seasonal trend forecasting
 * - Event likelihood scoring
 * - What-if scenario modeling
 *
 * Target Performance:
 * - Prediction accuracy: >80%
 * - Actionable predictions: 1,000+ per day
 * - Conversion lift: 15-25%
 */

const prisma = require("../lib/prisma");
const { logger } = require("../middleware/logger");

/**
 * Prediction types
 */
const PREDICTION_TYPES = {
    CHURN: "churn",
    LTV: "ltv",
    UPSELL: "upsell",
    CAMPAIGN_RESPONSE: "campaign_response",
    GROWTH: "growth",
    CONVERSION: "conversion",
    NEXT_PURCHASE: "next_purchase",
    PRODUCT_AFFINITY: "product_affinity",
};

/**
 * Risk levels for churn
 */
const CHURN_RISK_LEVELS = {
    LOW: { min: 0, max: 0.3, label: "Low Risk", action: "monitor" },
    MEDIUM: { min: 0.3, max: 0.6, label: "Medium Risk", action: "engage" },
    HIGH: { min: 0.6, max: 0.8, label: "High Risk", action: "intervene" },
    CRITICAL: { min: 0.8, max: 1.0, label: "Critical Risk", action: "urgent" },
};

/**
 * Upsell opportunity categories
 */
const UPSELL_CATEGORIES = {
    PREMIUM_DELIVERY: { valueIncrease: 1.5, conversionRate: 0.25 },
    VOLUME_DISCOUNT: { valueIncrease: 2.0, conversionRate: 0.35 },
    SUBSCRIPTION: { valueIncrease: 3.0, conversionRate: 0.15 },
    ADDITIONAL_SERVICES: { valueIncrease: 1.3, conversionRate: 0.4 },
};

/**
 * Predictive Analytics Engine
 */
class PredictiveAnalytics {
    constructor() {
        this.modelCache = new Map();
        this.cacheTTL = 1800000; // 30 minutes cache
    }

    /**
     * Predict customer churn probability
     */
    async predictChurn(userId, timeHorizonDays = 30) {
        const startTime = Date.now();

        try {
            // Get customer data
            const customer = await prisma.users.findUnique({
                where: { id: userId },
                include: {
                    shipments: {
                        orderBy: { created_at: "desc" },
                        take: 100,
                    },
                },
            });

            if (!customer) {
                throw new Error("Customer not found");
            }

            // Calculate churn indicators
            const indicators = await this.calculateChurnIndicators(customer);

            // Calculate churn probability using weighted model
            const churnProbability = this.calculateChurnProbability(indicators);

            // Determine risk level
            const riskLevel = this.determineRiskLevel(churnProbability, CHURN_RISK_LEVELS);

            // Generate recommendations
            const recommendations = this.generateChurnRecommendations(churnProbability, indicators);

            // Save prediction
            await this.savePrediction({
                user_id: userId,
                prediction_type: PREDICTION_TYPES.CHURN,
                probability: churnProbability,
                risk_level: riskLevel.label,
                indicators,
                recommendations,
            });

            const processingTime = Date.now() - startTime;
            logger.info("Churn prediction completed", {
                userId,
                probability: churnProbability,
                riskLevel: riskLevel.label,
                processingTime,
            });

            return {
                userId,
                churnProbability: Math.round(churnProbability * 1000) / 1000,
                riskLevel: riskLevel.label,
                recommendedAction: riskLevel.action,
                indicators,
                recommendations,
                timeHorizon: timeHorizonDays,
                confidence: this.calculateConfidence(indicators),
                processingTime,
            };
        } catch (error) {
            logger.error("Failed to predict churn", { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Predict customer lifetime value
     */
    async predictLTV(userId, timeHorizonMonths = 12) {
        const startTime = Date.now();

        try {
            const customer = await prisma.users.findUnique({
                where: { id: userId },
                include: {
                    shipments: {
                        where: { status: { in: ["delivered", "completed"] } },
                        orderBy: { created_at: "asc" },
                    },
                },
            });

            if (!customer) {
                throw new Error("Customer not found");
            }

            if (customer.shipments.length === 0) {
                return {
                    userId,
                    predictedLTV: 0,
                    confidence: 0,
                    growthPotential: "unknown",
                };
            }

            // Calculate historical metrics
            const totalRevenue = customer.shipments.reduce((sum, s) => sum + (s.total_cost || 0), 0);
            const avgOrderValue = totalRevenue / customer.shipments.length;

            // Calculate order frequency
            const firstOrder = new Date(customer.shipments[0].created_at);
            const lastOrder = new Date(customer.shipments[customer.shipments.length - 1].created_at);
            const monthsActive = Math.max(1, (lastOrder - firstOrder) / (1000 * 60 * 60 * 24 * 30));
            const orderFrequency = customer.shipments.length / monthsActive;

            // Calculate growth trend
            const recentOrders = customer.shipments.slice(-6);
            const oldOrders = customer.shipments.slice(0, 6);
            const recentAvg =
                recentOrders.reduce((sum, s) => sum + (s.total_cost || 0), 0) / recentOrders.length;
            const oldAvg = oldOrders.reduce((sum, s) => sum + (s.total_cost || 0), 0) / oldOrders.length;
            const growthRate = (recentAvg - oldAvg) / oldAvg;

            // Predict future orders
            const predictedOrders = orderFrequency * timeHorizonMonths;

            // Adjust for growth trend
            const adjustedAvgOrderValue = avgOrderValue * (1 + growthRate * 0.5);

            // Predict churn to adjust LTV
            const churnPrediction = await this.predictChurn(userId, timeHorizonMonths * 30);
            const survivalProbability = 1 - churnPrediction.churnProbability;

            // Calculate predicted LTV
            const predictedRevenue = predictedOrders * adjustedAvgOrderValue * survivalProbability;
            const predictedLTV = totalRevenue + predictedRevenue;

            // Determine growth potential
            const growthPotential = this.determineGrowthPotential(growthRate, orderFrequency);

            // Save prediction
            await this.savePrediction({
                user_id: userId,
                prediction_type: PREDICTION_TYPES.LTV,
                predicted_value: predictedLTV,
                confidence: this.calculateLTVConfidence(customer.shipments.length, monthsActive),
                factors: {
                    avgOrderValue,
                    orderFrequency,
                    growthRate,
                    survivalProbability,
                },
            });

            const processingTime = Date.now() - startTime;
            logger.info("LTV prediction completed", {
                userId,
                predictedLTV: Math.round(predictedLTV),
                processingTime,
            });

            return {
                userId,
                predictedLTV: Math.round(predictedLTV * 100) / 100,
                historicalRevenue: Math.round(totalRevenue * 100) / 100,
                predictedRevenue: Math.round(predictedRevenue * 100) / 100,
                avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                orderFrequency: Math.round(orderFrequency * 100) / 100,
                growthRate: Math.round(growthRate * 1000) / 1000,
                growthPotential,
                survivalProbability: Math.round(survivalProbability * 1000) / 1000,
                timeHorizon: timeHorizonMonths,
                confidence: this.calculateLTVConfidence(customer.shipments.length, monthsActive),
                processingTime,
            };
        } catch (error) {
            logger.error("Failed to predict LTV", { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Identify upsell opportunities
     */
    async identifyUpsellOpportunities(userId) {
        const startTime = Date.now();

        try {
            const customer = await prisma.users.findUnique({
                where: { id: userId },
                include: {
                    shipments: {
                        orderBy: { created_at: "desc" },
                        take: 50,
                    },
                },
            });

            if (!customer || customer.shipments.length === 0) {
                return { userId, opportunities: [] };
            }

            // Analyze customer behavior
            const avgOrderValue =
                customer.shipments.reduce((sum, s) => sum + (s.total_cost || 0), 0) /
                customer.shipments.length;

            const orderCount = customer.shipments.length;

            // Identify opportunities
            const opportunities = [];

            // Premium delivery upsell
            if (avgOrderValue > 50 && orderCount > 5) {
                opportunities.push({
                    category: "PREMIUM_DELIVERY",
                    probability: 0.25,
                    estimatedValue: avgOrderValue * 0.5,
                    reasoning: "High-value customer with frequent orders",
                    recommendedOffer: "Express delivery membership at 20% discount",
                });
            }

            // Volume discount upsell
            if (orderCount > 10 && avgOrderValue < 100) {
                opportunities.push({
                    category: "VOLUME_DISCOUNT",
                    probability: 0.35,
                    estimatedValue: avgOrderValue * 2.0,
                    reasoning: "Frequent customer could benefit from bulk pricing",
                    recommendedOffer: "Volume discount for 10+ monthly shipments",
                });
            }

            // Subscription model
            if (orderCount > 3 && this.isRegularCustomer(customer.shipments)) {
                opportunities.push({
                    category: "SUBSCRIPTION",
                    probability: 0.15,
                    estimatedValue: avgOrderValue * 3.0 * 12,
                    reasoning: "Regular ordering pattern detected",
                    recommendedOffer: "Monthly subscription with 15% savings",
                });
            }

            // Additional services
            opportunities.push({
                category: "ADDITIONAL_SERVICES",
                probability: 0.4,
                estimatedValue: avgOrderValue * 0.3,
                reasoning: "High engagement, likely to use add-on services",
                recommendedOffer: "Insurance, tracking, and packaging services",
            });

            // Sort by estimated value
            opportunities.sort((a, b) => b.estimatedValue - a.estimatedValue);

            // Save opportunities
            for (const opp of opportunities) {
                await this.savePrediction({
                    user_id: userId,
                    prediction_type: PREDICTION_TYPES.UPSELL,
                    probability: opp.probability,
                    predicted_value: opp.estimatedValue,
                    category: opp.category,
                    recommended_action: opp.recommendedOffer,
                });
            }

            const processingTime = Date.now() - startTime;
            logger.info("Upsell opportunities identified", {
                userId,
                opportunityCount: opportunities.length,
                processingTime,
            });

            return {
                userId,
                opportunities,
                totalPotentialValue: opportunities.reduce((sum, o) => sum + o.estimatedValue, 0),
                processingTime,
            };
        } catch (error) {
            logger.error("Failed to identify upsell opportunities", { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Predict campaign response
     */
    async predictCampaignResponse(userId, campaignType) {
        try {
            const customer = await prisma.users.findUnique({
                where: { id: userId },
                include: {
                    shipments: {
                        orderBy: { created_at: "desc" },
                        take: 20,
                    },
                },
            });

            if (!customer) {
                throw new Error("Customer not found");
            }

            // Calculate engagement score
            const daysSinceLastOrder =
                customer.shipments.length > 0
                    ? (new Date() - new Date(customer.shipments[0].created_at)) / (1000 * 60 * 60 * 24)
                    : 999;

            const orderFrequency =
                customer.shipments.length /
                Math.max(1, (new Date() - new Date(customer.created_at)) / (1000 * 60 * 60 * 24 * 30));

            // Simple response probability model
            let probability = 0.5; // Base probability

            // Adjust based on recency
            if (daysSinceLastOrder < 7) probability += 0.3;
            else if (daysSinceLastOrder < 30) probability += 0.1;
            else if (daysSinceLastOrder > 90) probability -= 0.2;

            // Adjust based on frequency
            if (orderFrequency > 5) probability += 0.2;
            else if (orderFrequency > 2) probability += 0.1;
            else if (orderFrequency < 0.5) probability -= 0.2;

            // Campaign type adjustments
            if (campaignType === "discount") probability += 0.15;
            if (campaignType === "new_feature") probability -= 0.05;

            probability = Math.max(0, Math.min(1, probability));

            logger.info("Campaign response predicted", { userId, probability });

            return {
                userId,
                campaignType,
                responseProbability: Math.round(probability * 1000) / 1000,
                recommendation: probability > 0.6 ? "include" : "exclude",
                factors: {
                    daysSinceLastOrder,
                    orderFrequency,
                    campaignType,
                },
            };
        } catch (error) {
            logger.error("Failed to predict campaign response", { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Perform what-if scenario analysis
     */
    async whatIfAnalysis(scenarioConfig) {
        const startTime = Date.now();

        try {
            const { baseMetrics, changes } = scenarioConfig;

            // Apply changes to base metrics
            const projectedMetrics = { ...baseMetrics };

            for (const [metric, change] of Object.entries(changes)) {
                if (change.type === "percentage") {
                    projectedMetrics[metric] = baseMetrics[metric] * (1 + change.value / 100);
                } else if (change.type === "absolute") {
                    projectedMetrics[metric] = baseMetrics[metric] + change.value;
                }
            }

            // Calculate downstream impacts
            const impacts = this.calculateDownstreamImpacts(baseMetrics, projectedMetrics);

            const processingTime = Date.now() - startTime;
            logger.info("What-if analysis completed", { processingTime });

            return {
                scenario: scenarioConfig.name || "Unnamed Scenario",
                baseMetrics,
                projectedMetrics,
                impacts,
                timestamp: new Date(),
                processingTime,
            };
        } catch (error) {
            logger.error("Failed to perform what-if analysis", { error: error.message });
            throw error;
        }
    }

    // ==================== Helper Methods ====================

    async calculateChurnIndicators(customer) {
        const now = new Date();
        const shipments = customer.shipments;

        if (shipments.length === 0) {
            return {
                daysSinceLastOrder: 999,
                orderFrequency: 0,
                avgOrderValue: 0,
                orderTrend: 0,
                engagementScore: 0,
            };
        }

        const lastOrder = new Date(shipments[0].created_at);
        const daysSinceLastOrder = Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24));

        const accountAge = Math.max(
            1,
            (now - new Date(customer.created_at)) / (1000 * 60 * 60 * 24 * 30),
        );
        const orderFrequency = shipments.length / accountAge;

        const avgOrderValue =
            shipments.reduce((sum, s) => sum + (s.total_cost || 0), 0) / shipments.length;

        const recent = shipments.slice(0, 5);
        const older = shipments.slice(5, 10);
        const recentCount = recent.length;
        const olderCount = older.length;
        const orderTrend = olderCount > 0 ? (recentCount - olderCount) / olderCount : 0;

        const engagementScore = this.calculateEngagementScore({
            daysSinceLastOrder,
            orderFrequency,
            avgOrderValue,
            orderTrend,
        });

        return {
            daysSinceLastOrder,
            orderFrequency: Math.round(orderFrequency * 100) / 100,
            avgOrderValue: Math.round(avgOrderValue * 100) / 100,
            orderTrend: Math.round(orderTrend * 100) / 100,
            engagementScore,
        };
    }

    calculateChurnProbability(indicators) {
        let probability = 0;

        if (indicators.daysSinceLastOrder > 90) probability += 0.4;
        else if (indicators.daysSinceLastOrder > 60) probability += 0.3;
        else if (indicators.daysSinceLastOrder > 30) probability += 0.15;
        else probability += 0.05;

        if (indicators.orderFrequency < 0.5) probability += 0.3;
        else if (indicators.orderFrequency < 1) probability += 0.2;
        else if (indicators.orderFrequency < 2) probability += 0.1;
        else probability += 0.05;

        if (indicators.orderTrend < -0.5) probability += 0.2;
        else if (indicators.orderTrend < 0) probability += 0.1;
        else probability += 0.05;

        if (indicators.engagementScore < 30) probability += 0.1;
        else if (indicators.engagementScore < 50) probability += 0.05;

        return Math.min(1, probability);
    }

    calculateEngagementScore(indicators) {
        let score = 100;
        score -= Math.min(50, indicators.daysSinceLastOrder * 0.5);
        score += Math.min(20, indicators.orderFrequency * 5);
        score += indicators.orderTrend * 10;
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    determineRiskLevel(probability, levels) {
        for (const level of Object.values(levels)) {
            if (probability >= level.min && probability <= level.max) {
                return level;
            }
        }
        return levels.LOW;
    }

    generateChurnRecommendations(probability, indicators) {
        const recommendations = [];

        if (probability > 0.6) {
            recommendations.push("Send urgent re-engagement campaign");
            recommendations.push("Offer personalized discount (15-20%)");
            recommendations.push("Assign to retention specialist");
        }

        if (indicators.daysSinceLastOrder > 60) {
            recommendations.push('Send "We miss you" email');
            recommendations.push("Highlight new features or services");
        }

        if (indicators.orderFrequency < 1) {
            recommendations.push("Encourage regular ordering with subscription");
        }

        if (recommendations.length === 0) {
            recommendations.push("Continue monitoring");
            recommendations.push("Maintain regular communication");
        }

        return recommendations;
    }

    calculateConfidence(indicators) {
        let confidence = 0.5;
        if (indicators.orderFrequency > 2) confidence += 0.2;
        if (indicators.daysSinceLastOrder < 90) confidence += 0.15;
        if (indicators.engagementScore > 0) confidence += 0.15;
        return Math.min(1, confidence);
    }

    calculateLTVConfidence(orderCount, monthsActive) {
        let confidence = 0.3;
        if (orderCount > 10) confidence += 0.3;
        else if (orderCount > 5) confidence += 0.2;
        else if (orderCount > 2) confidence += 0.1;

        if (monthsActive > 12) confidence += 0.3;
        else if (monthsActive > 6) confidence += 0.2;
        else if (monthsActive > 3) confidence += 0.1;

        return Math.min(1, confidence);
    }

    determineGrowthPotential(growthRate, orderFrequency) {
        if (growthRate > 0.3 && orderFrequency > 2) return "high";
        if (growthRate > 0.1 && orderFrequency > 1) return "medium";
        if (growthRate < -0.1) return "declining";
        return "stable";
    }

    isRegularCustomer(shipments) {
        if (shipments.length < 3) return false;

        const gaps = [];
        for (let i = 1; i < shipments.length; i++) {
            const gap =
                (new Date(shipments[i - 1].created_at) - new Date(shipments[i].created_at)) /
                (1000 * 60 * 60 * 24);
            gaps.push(gap);
        }

        const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
        const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
        const stdDev = Math.sqrt(variance);

        return stdDev < avgGap * 0.5 && avgGap < 45;
    }

    calculateDownstreamImpacts(baseMetrics, projectedMetrics) {
        const impacts = {};

        for (const metric in projectedMetrics) {
            const change = projectedMetrics[metric] - baseMetrics[metric];
            const percentChange = (change / baseMetrics[metric]) * 100;

            impacts[metric] = {
                change,
                percentChange: Math.round(percentChange * 100) / 100,
                direction: change > 0 ? "increase" : "decrease",
            };
        }

        return impacts;
    }

    async savePrediction(predictionData) {
        try {
            await prisma.analyticsPrediction.create({
                data: {
                    ...predictionData,
                    created_at: new Date(),
                },
            });
        } catch (error) {
            logger.error("Failed to save prediction", { error: error.message });
        }
    }
}

// Create singleton instance
const predictiveAnalytics = new PredictiveAnalytics();

/**
 * Public API
 */
module.exports = {
    predictChurn: (userId, timeHorizon) => predictiveAnalytics.predictChurn(userId, timeHorizon),
    predictLTV: (userId, timeHorizon) => predictiveAnalytics.predictLTV(userId, timeHorizon),
    identifyUpsellOpportunities: (userId) => predictiveAnalytics.identifyUpsellOpportunities(userId),
    predictCampaignResponse: (userId, campaignType) =>
        predictiveAnalytics.predictCampaignResponse(userId, campaignType),
    whatIfAnalysis: (scenarioConfig) => predictiveAnalytics.whatIfAnalysis(scenarioConfig),

    // Constants
    PREDICTION_TYPES,
    CHURN_RISK_LEVELS,
    UPSELL_CATEGORIES,
};
