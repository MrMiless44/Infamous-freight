/**
 * AI Dispatch Scoring Service
 * Ranks loads by profit-per-mile, deadhead distance, risk factors
 */

const { logger } = require('../middleware/logger');
const financialIntelligence = require('./financialIntelligence');

class AIDispatchScoringService {
    constructor() {
        // Scoring weights (must sum to 1.0)
        this.weights = {
            profitPerMile: 0.35,      // Most important
            totalProfit: 0.25,
            deadheadRatio: 0.15,      // Lower is better
            riskScore: 0.10,          // Lower is better
            timeEfficiency: 0.10,
            customerRating: 0.05
        };

        // Risk factors
        this.riskFactors = {
            weather: { low: 0, medium: 5, high: 10 },
            traffic: { low: 0, medium: 3, high: 8 },
            route: { low: 0, medium: 4, high: 9 },
            customer: { excellent: 0, good: 2, poor: 7 }
        };
    }

    /**
     * Score a load and return ranking
     * @param {Object} load - Load details (origin, destination, rate, etc.)
     * @param {Object} currentLocation - Driver's current location
     * @param {Object} options - Additional scoring options
     * @returns {Object} Scored load with breakdown
     */
    async scoreLoad(load, currentLocation, options = {}) {
        try {
            logger.info('Scoring load', { loadId: load.id, origin: load.origin });

            // Calculate profit metrics
            const profitAnalysis = await financialIntelligence.calculateProfitPerMile({
                revenue: load.rate,
                distance: load.distance,
                estimatedTime: load.estimatedTime,
                loadType: load.type
            });

            // Calculate deadhead (empty miles to pickup)
            const deadhead = await this.calculateDeadhead(currentLocation, load.origin);

            // Calculate risk score
            const riskScore = await this.calculateRiskScore(load, options);

            // Calculate time efficiency
            const timeEfficiency = this.calculateTimeEfficiency(load);

            // Get customer rating
            const customerRating = await this.getCustomerRating(load.customerId);

            // Normalize all scores to 0-100 scale
            const scores = {
                profitPerMile: this.normalizeProfitPerMile(profitAnalysis.profitPerMile),
                totalProfit: this.normalizeTotalProfit(profitAnalysis.profit),
                deadheadRatio: this.normalizeDeadhead(deadhead.ratio), // Invert (lower is better)
                riskScore: this.normalizeRisk(riskScore), // Invert (lower is better)
                timeEfficiency: timeEfficiency,
                customerRating: customerRating
            };

            // Calculate weighted final score
            const finalScore = Object.entries(this.weights).reduce((total, [key, weight]) => {
                return total + (scores[key] * weight);
            }, 0);

            const result = {
                loadId: load.id,
                score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
                rank: null, // Will be set when comparing multiple loads
                recommendation: this.getRecommendation(finalScore),
                breakdown: {
                    profitPerMile: {
                        value: profitAnalysis.profitPerMile,
                        score: scores.profitPerMile,
                        weight: this.weights.profitPerMile
                    },
                    totalProfit: {
                        value: profitAnalysis.profit,
                        score: scores.totalProfit,
                        weight: this.weights.totalProfit
                    },
                    deadhead: {
                        miles: deadhead.miles,
                        ratio: deadhead.ratio,
                        score: scores.deadheadRatio,
                        weight: this.weights.deadheadRatio
                    },
                    risk: {
                        factors: riskScore.factors,
                        totalRisk: riskScore.total,
                        score: scores.riskScore,
                        weight: this.weights.riskScore
                    },
                    timeEfficiency: {
                        score: scores.timeEfficiency,
                        weight: this.weights.timeEfficiency
                    },
                    customerRating: {
                        rating: customerRating,
                        score: scores.customerRating,
                        weight: this.weights.customerRating
                    }
                },
                metadata: {
                    origin: load.origin,
                    destination: load.destination,
                    distance: load.distance,
                    rate: load.rate,
                    estimatedTime: load.estimatedTime,
                    scoredAt: new Date().toISOString()
                }
            };

            logger.info('Load scored', {
                loadId: load.id,
                score: result.score,
                profitPerMile: profitAnalysis.profitPerMile
            });

            return result;
        } catch (error) {
            logger.error({ error }, 'Load scoring error');
            throw error;
        }
    }

    /**
     * Score multiple loads and return ranked list
     */
    async scoreAndRankLoads(loads, currentLocation, options = {}) {
        try {
            // Score all loads in parallel
            const scoredLoads = await Promise.all(
                loads.map(load => this.scoreLoad(load, currentLocation, options))
            );

            // Sort by score (highest first)
            scoredLoads.sort((a, b) => b.score - a.score);

            // Assign ranks
            scoredLoads.forEach((load, index) => {
                load.rank = index + 1;
            });

            logger.info('Loads ranked', {
                totalLoads: loads.length,
                topScore: scoredLoads[0]?.score
            });

            return {
                rankedLoads: scoredLoads,
                totalLoads: scoredLoads.length,
                averageScore: scoredLoads.reduce((sum, l) => sum + l.score, 0) / scoredLoads.length,
                topLoad: scoredLoads[0] || null,
                scoringWeights: this.weights,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error({ error }, 'Load ranking error');
            throw error;
        }
    }

    /**
     * Get load recommendations for a driver
     */
    async getRecommendations(driverId, maxLoads = 10) {
        try {
            // This would integrate with your loads/marketplace service
            // For now, returning structure
            return {
                driverId,
                recommendations: [],
                criteria: {
                    preferredLanes: [],
                    homeBase: null,
                    preferences: {}
                },
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error({ error }, 'Recommendation generation error');
            throw error;
        }
    }

    // ========== Private Helper Methods ==========

    async calculateDeadhead(currentLocation, origin) {
        // Calculate distance from current location to pickup
        // This would integrate with your mapping service
        const deadheadMiles = this.calculateDistance(currentLocation, origin);

        return {
            miles: deadheadMiles,
            ratio: deadheadMiles / (deadheadMiles + 100), // Mock loaded miles
            cost: deadheadMiles * 0.70 // Fuel cost estimate
        };
    }

    async calculateRiskScore(load, options) {
        const factors = {};
        let totalRisk = 0;

        // Weather risk
        factors.weather = options.weatherCondition || 'low';
        totalRisk += this.riskFactors.weather[factors.weather];

        // Traffic risk
        factors.traffic = this.assessTrafficRisk(load);
        totalRisk += this.riskFactors.traffic[factors.traffic];

        // Route risk (mountain passes, construction, etc.)
        factors.route = this.assessRouteRisk(load);
        totalRisk += this.riskFactors.route[factors.route];

        // Customer payment risk
        factors.customer = options.customerHistory || 'good';
        totalRisk += this.riskFactors.customer[factors.customer];

        return {
            total: totalRisk,
            factors,
            maxPossible: 34 // 10 + 8 + 9 + 7
        };
    }

    calculateTimeEfficiency(load) {
        // Score based on revenue per hour
        const hours = load.estimatedTime || (load.distance / 55); // Assume 55mph avg
        const revenuePerHour = hours > 0 ? load.rate / hours : 0;

        // Normalize: $100/hr = 100 score
        return Math.min((revenuePerHour / 100) * 100, 100);
    }

    async getCustomerRating(customerId) {
        // This would query customer payment history, disputes, etc.
        // For now, return default good rating
        return 85; // 0-100 scale
    }

    // Normalization functions (convert raw values to 0-100 scale)
    normalizeProfitPerMile(profitPerMile) {
        // $1/mile = 100 score, scale linearly
        const score = (profitPerMile / 1.0) * 100;
        return Math.max(0, Math.min(score, 100));
    }

    normalizeTotalProfit(totalProfit) {
        // $1000 profit = 100 score
        const score = (totalProfit / 1000) * 100;
        return Math.max(0, Math.min(score, 100));
    }

    normalizeDeadhead(deadheadRatio) {
        // Lower is better: 0% deadhead = 100 score, 50% = 0 score
        const score = (1 - Math.min(deadheadRatio, 0.5) / 0.5) * 100;
        return Math.max(0, Math.min(score, 100));
    }

    normalizeRisk(riskScore) {
        // Lower is better: 0 risk = 100 score, max risk = 0 score
        const score = (1 - riskScore.total / riskScore.maxPossible) * 100;
        return Math.max(0, Math.min(score, 100));
    }

    getRecommendation(score) {
        if (score >= 80) return 'HIGHLY_RECOMMENDED';
        if (score >= 60) return 'RECOMMENDED';
        if (score >= 40) return 'ACCEPTABLE';
        if (score >= 20) return 'NOT_RECOMMENDED';
        return 'AVOID';
    }

    assessTrafficRisk(load) {
        // Check if route goes through major metro areas
        const metroCities = ['new york', 'los angeles', 'chicago', 'houston', 'atlanta'];
        const route = `${load.origin} ${load.destination}`.toLowerCase();

        for (const city of metroCities) {
            if (route.includes(city)) {
                return 'medium';
            }
        }

        return 'low';
    }

    assessRouteRisk(load) {
        // Check for high-risk route characteristics
        const highRiskKeywords = ['mountain', 'pass', 'winter', 'construction'];
        const route = `${load.origin} ${load.destination}`.toLowerCase();

        for (const keyword of highRiskKeywords) {
            if (route.includes(keyword)) {
                return 'high';
            }
        }

        return 'low';
    }

    calculateDistance(pointA, pointB) {
        // Haversine formula for calculating distance between coordinates
        // This is a simplified version - real implementation would use mapping API

        if (!pointA || !pointB) return 0;

        const toRad = (deg) => deg * (Math.PI / 180);

        const lat1 = toRad(pointA.lat || 0);
        const lon1 = toRad(pointA.lng || 0);
        const lat2 = toRad(pointB.lat || 0);
        const lon2 = toRad(pointB.lng || 0);

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const earthRadiusMiles = 3959;

        return earthRadiusMiles * c;
    }
}

// Export singleton instance
module.exports = new AIDispatchScoringService();
