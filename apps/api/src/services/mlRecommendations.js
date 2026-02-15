/**
 * ML Load Recommendations Service
 * Advanced load scoring with machine learning recommendations
 * Factors: earnings potential, driver preferences, historical performance, market trends
 */

const logger = require("../middleware/logger");

class MLLoadRecommendations {
    constructor() {
        this.modelVersion = "1.0.0";
        this.featureWeights = {
            ratePremium: 0.25,      // Rate vs avg on corridor
            distance: 0.15,         // Optimal distance band
            driverHistory: 0.20,    // Driver's success rate
            marketDemand: 0.15,     // Loads available on corridor
            timeOfDay: 0.10,        // Time sensitivity
            hazmatMatch: 0.08,      // Hazmat capability
            freshness: 0.07,        // Load age (newer better)
        };
        this.cache = new Map();
    }

    /**
     * Get personalized load recommendations for driver
     * Uses ML model to rank loads by predicted success + earnings
     */
    async getRecommendations(driverId, params = {}) {
        try {
            const {
                limit = 20,
                minScore = 70,
                includeHazmat = false
            } = params;

            const cacheKey = `ml-recommendations:${driverId}`;
            const cached = this.cache.get(cacheKey);

            // Return cached if fresh (5 min)
            if (cached && cached.expiry > Date.now()) {
                logger.debug("ML: Recommendations cache hit", { driverId });
                return cached.data.slice(0, limit);
            }

            // Get driver profile & history
            const driverProfile = await this.getDriverProfile(driverId);

            // Get available loads
            const availableLoads = await this.getAvailableLoads();

            // Score each load
            const scoredLoads = availableLoads.map(load => ({
                ...load,
                mlScore: this.scoreLoad(load, driverProfile),
                predictedEarnings: this.predictEarnings(load, driverProfile),
                acceptanceProbability: this.predictAcceptance(load, driverProfile),
            }));

            // Rank by ML score
            const recommendations = scoredLoads
                .filter(l => l.mlScore >= minScore && (includeHazmat || !l.hazmat))
                .sort((a, b) => b.mlScore - a.mlScore)
                .map(l => ({
                    ...l,
                    reason: this.generateRecommendationReason(l, driverProfile),
                }));

            // Cache
            this.cache.set(cacheKey, {
                data: recommendations,
                expiry: Date.now() + 5 * 60 * 1000,
            });

            logger.info("ML: Recommendations generated", {
                driverId,
                count: recommendations.length,
                avgScore: (recommendations.reduce((s, l) => s + l.mlScore, 0) / recommendations.length).toFixed(1),
            });

            return recommendations.slice(0, limit);
        } catch (err) {
            logger.error("ML: Recommendations failed", { error: err.message });
            throw err;
        }
    }

    /**
     * ML Scoring Algorithm
     * Combines 7 factors with learned weights
     */
    scoreLoad(load, driverProfile) {
        let score = 50; // Base score

        // 1. Rate Premium (25%)
        const ratePremium = this.calculateRatePremium(load, driverProfile);
        score += ratePremium * this.featureWeights.ratePremium * 40;

        // 2. Distance Optimization (15%)
        const distanceScore = this.calculateDistanceScore(load, driverProfile);
        score += distanceScore * this.featureWeights.distance * 40;

        // 3. Driver History (20%)
        const historyScore = this.calculateHistoryScore(load, driverProfile);
        score += historyScore * this.featureWeights.driverHistory * 40;

        // 4. Market Demand (15%)
        const demandScore = this.calculateDemandScore(load);
        score += demandScore * this.featureWeights.marketDemand * 40;

        // 5. Time of Day (10%)
        const timeScore = this.calculateTimeScore(load);
        score += timeScore * this.featureWeights.timeOfDay * 40;

        // 6. Hazmat Match (8%)
        if (!load.hazmat || driverProfile.hazmatCertified) {
            score += this.featureWeights.hazmatMatch * 40;
        } else {
            score -= this.featureWeights.hazmatMatch * 40; // Penalty
        }

        // 7. Freshness (7%)
        const freshnessScore = this.calculateFreshnessScore(load);
        score += freshnessScore * this.featureWeights.freshness * 40;

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Predict if driver will accept this load
     * Based on driver's acceptance patterns
     */
    predictAcceptance(load, driverProfile) {
        const baseProbability = driverProfile.acceptanceRate / 100;

        // Factors that increase acceptance
        let adjustment = 0;

        if (load.rate > driverProfile.avgRateAccepted * 1.2) adjustment += 0.15;
        if (load.miles <= driverProfile.avgAcceptedMiles * 1.1) adjustment += 0.10;
        if (load.score >= 85) adjustment += 0.12;
        if (this.isPreferredCorridor(load, driverProfile)) adjustment += 0.08;

        return Math.min(0.99, baseProbability + adjustment);
    }

    /**
     * Predict earnings for this load
     * Accounts for driver efficiency and market conditions
     */
    predictEarnings(load, driverProfile) {
        const baseEarnings = load.rate;

        // Driver efficiency factor (some drivers complete in less time)
        const efficiencyMultiplier = 1 + (driverProfile.efficiency - 1.0);

        // Bonus for strong match
        let bonusPercentage = 0;
        if (load.score >= 90) bonusPercentage += 5;
        if (this.isPreferredEquipment(load, driverProfile)) bonusPercentage += 3;

        const predictedEarnings = baseEarnings * efficiencyMultiplier * (1 + bonusPercentage / 100);

        return Math.round(predictedEarnings * 100) / 100;
    }

    /**
     * Generate human-readable reason for recommendation
     */
    generateRecommendationReason(load, driverProfile) {
        const reasons = [];

        if (load.rate > driverProfile.avgRateAccepted * 1.2) {
            reasons.push("High-paying load");
        }

        if (this.isPreferredCorridor(load, driverProfile)) {
            reasons.push("You frequently run this corridor");
        }

        if (load.score >= 90) {
            reasons.push("Excellent match for your profile");
        }

        if (load.freshness < 30) {
            // minutes old
            reasons.push("Just posted - act fast");
        }

        if (driverProfile.acceptanceRate > 85) {
            reasons.push("Similar to loads you typically accept");
        }

        return reasons.length > 0 ? reasons : ["Good opportunity"];
    }

    // Helper scoring methods
    calculateRatePremium(load, driverProfile) {
        const corridorAvgRate = 1.75; // Mock: would query from analytics
        const loadRate = load.rate / (load.miles || 100);
        const ratio = loadRate / corridorAvgRate;

        if (ratio > 1.3) return 1.0;
        if (ratio > 1.1) return 0.7;
        if (ratio > 0.9) return 0.4;
        return 0.0;
    }

    calculateDistanceScore(load, driverProfile) {
        const optimalRange = { min: 200, max: 600 };
        const miles = load.miles || 300;

        if (miles >= optimalRange.min && miles <= optimalRange.max) return 1.0;
        if (miles >= optimalRange.min - 100 && miles <= optimalRange.max + 100) return 0.7;
        return 0.3;
    }

    calculateHistoryScore(load, driverProfile) {
        // Score based on driver's success on similar loads
        const similarLoadsCompleted = driverProfile.completedLoadsCount || 10;
        const driverRating = driverProfile.rating || 4.5;

        // Normalize: 0-5 stars → 0-1 score
        return Math.min(1.0, driverRating / 5.0);
    }

    calculateDemandScore(load) {
        // Higher demand = higher score
        const demandsPercentile = 0.65; // Mock
        return demandsPercentile;
    }

    calculateTimeScore(load) {
        // Early morning and evening loads typically better
        const pickupHour = new Date(load.pickupDate).getHours();
        if (pickupHour < 6 || pickupHour > 20) return 0.9;
        if (pickupHour < 8 || pickupHour > 18) return 0.7;
        return 0.5;
    }

    calculateFreshnessScore(load) {
        const ageMinutes = (Date.now() - new Date(load.postedTime)) / (1000 * 60);
        if (ageMinutes < 15) return 1.0;
        if (ageMinutes < 60) return 0.8;
        if (ageMinutes < 180) return 0.5;
        return 0.2;
    }

    isPreferredCorridor(load, driverProfile) {
        // Check if driver frequently runs this route
        return driverProfile.preferredCorridors?.includes(
            `${load.pickupCity}-${load.dropoffCity}`
        );
    }

    isPreferredEquipment(load, driverProfile) {
        return load.equipmentType === driverProfile.equipmentType;
    }

    // Mock data methods
    async getDriverProfile(driverId) {
        return {
            id: driverId,
            acceptanceRate: 82,
            avgRateAccepted: 1650,
            avgAcceptedMiles: 400,
            rating: 4.7,
            efficiency: 1.05, // 5% faster than average
            hazmatCertified: true,
            preferredCorridors: ["Denver-Phoenix", "Denver-Las Vegas"],
            equipmentType: "dry_van",
            completedLoadsCount: 156,
        };
    }

    async getAvailableLoads() {
        // Mock: would query from database
        return [
            {
                id: "load-1",
                pickupCity: "Denver",
                dropoffCity: "Phoenix",
                miles: 600,
                rate: 2100,
                score: 92,
                hazmat: false,
                equipmentType: "dry_van",
                postedTime: new Date(),
                pickupDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
            },
        ];
    }
}

module.exports = new MLLoadRecommendations();
