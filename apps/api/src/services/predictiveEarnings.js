/**
 * Predictive Earnings Forecasting Service
 * Predicts driver earnings based on historical data, trends, and market conditions
 */

const { logger } = require("../middleware/logger");

class PredictiveEarningsService {
    constructor() {
        this.modelVersion = "1.0.0";
        this.cache = new Map();
    }

    /**
     * Forecast earnings for next N days
     * Uses time-series analysis + market trends
     */
    async forecastEarnings(driverId, params = {}) {
        try {
            const {
                days = 30,
                includeConfidenceInterval = true,
                granularity = "daily" // daily, weekly, monthly
            } = params;

            const cacheKey = `forecast:${driverId}:${days}d`;
            const cached = this.cache.get(cacheKey);

            if (cached && cached.expiry > Date.now()) {
                logger.debug("Earnings forecast cache hit", { driverId, days });
                return cached.data;
            }

            // Get driver's historical earnings
            const history = await this.getEarningsHistory(driverId, 90);

            // Analyze trends
            const trends = this.analyzeTrends(history);

            // Get market conditions
            const marketFactors = await this.getMarketFactors(driverId);

            // Generate forecast
            const forecast = this.generateForecast(
                history,
                trends,
                marketFactors,
                days,
                granularity
            );

            // Add confidence intervals if requested
            if (includeConfidenceInterval) {
                forecast.data.forEach(point => {
                    point.confidenceInterval = this.calculateConfidenceInterval(point, trends);
                });
            }

            // Cache forecast
            this.cache.set(cacheKey, {
                data: forecast,
                expiry: Date.now() + 60 * 60 * 1000, // 1 hour
            });

            logger.info("Earnings forecast generated", {
                driverId,
                days,
                avgDailyForecast: (
                    forecast.data.reduce((sum, d) => sum + d.predicted, 0) / forecast.data.length
                ).toFixed(0),
                trend: forecast.trend,
            });

            return forecast;
        } catch (err) {
            logger.error("Earnings forecast failed", { error: err.message });
            throw err;
        }
    }

    /**
     * Main forecasting algorithm
     * Combines historical patterns with external factors
     */
    generateForecast(history, trends, marketFactors, days, granularity) {
        const forecast = {
            period: `${days}d`,
            granularity,
            trend: trends.direction, // "up", "down", "stable"
            confidence: this.calculateOverallConfidence(trends),
            data: [],
            summary: {},
        };

        const avgDailyEarnings = trends.avgDaily;
        const seasonalityFactor = this.getSeasonalityFactor(new Date());
        const marketMultiplier = marketFactors.demandFactor * marketFactors.rateFactor;

        // Generate points for forecast period
        for (let i = 1; i <= days; i++) {
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + i);

            // Base: historical average
            let predicted = avgDailyEarnings;

            // Apply trend
            predicted *= 1 + (trends.trendSlope * i) / 100;

            // Apply seasonality
            predicted *= seasonalityFactor;

            // Apply market factors
            predicted *= marketMultiplier;

            // Add noise reduction (smooth changes)
            if (forecast.data.length > 0) {
                const prevPredicted = forecast.data[forecast.data.length - 1].predicted;
                predicted = (prevPredicted * 0.6) + (predicted * 0.4); // 60/40 smoothing
            }

            forecast.data.push({
                date: forecastDate.toISOString().split("T")[0],
                predicted: Math.round(predicted * 100) / 100,
                confidence: this.calculatePointConfidence(i, trends),
            });
        }

        // Calculate summary statistics
        const predictions = forecast.data.map(d => d.predicted);
        forecast.summary = {
            average: (predictions.reduce((a, b) => a + b, 0) / predictions.length).toFixed(2),
            min: Math.min(...predictions).toFixed(2),
            max: Math.max(...predictions).toFixed(2),
            totalForecast: predictions.reduce((a, b) => a + b, 0).toFixed(0),
            percentageChange: (
                ((predictions[predictions.length - 1] - predictions[0]) / predictions[0]) * 100
            ).toFixed(1),
        };

        return forecast;
    }

    /**
     * Analyze historical earnings for trends
     */
    analyzeTrends(history) {
        if (!history || history.length === 0) {
            return {
                avgDaily: 1800, // Default average
                trendSlope: 0,
                volatility: 0.15,
                direction: "stable",
            };
        }

        // Calculate daily averages
        const dailyAvgs = history.map(d => d.earnings);

        // Simple linear trend (least squares)
        const trendSlope = this.calculateTrendSlope(dailyAvgs);

        // Calculate volatility (standard deviation)
        const avg = dailyAvgs.reduce((a, b) => a + b, 0) / dailyAvgs.length;
        const variance = dailyAvgs.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / dailyAvgs.length;
        const volatility = Math.sqrt(variance) / avg;

        // Determine direction
        let direction = "stable";
        if (trendSlope > 2) direction = "up";
        if (trendSlope < -2) direction = "down";

        return {
            avgDaily: avg,
            trendSlope,
            volatility,
            direction,
        };
    }

    /**
     * Get external market factors affecting earnings
     */
    async getMarketFactors(driverId) {
        // Mock: would query from analytics or external APIs
        const now = new Date().getHours();
        const isWeekend = [0, 6].includes(new Date().getDay());

        return {
            demandFactor: isWeekend ? 0.85 : 1.1, // Weekday demand higher
            rateFactor: 1.05, // Market rates trending up
            capacityFactor: 0.95, // Slight oversupply
            seasonalMonth: new Date().getMonth(),
        };
    }

    /**
     * Get seasonality multiplier by month
     */
    getSeasonalityFactor(date) {
        const month = date.getMonth();
        const seasonalityPatterns = {
            0: 0.92,  // January: low
            1: 0.90,  // February: low
            2: 0.95,  // March: moderate
            3: 1.05,  // April: good
            4: 1.10,  // May: strong
            5: 1.15,  // June: peak
            6: 1.12,  // July: strong
            7: 1.14,  // August: strong
            8: 1.08,  // September: good
            9: 1.05,  // October: good
            10: 0.98, // November: moderate
            11: 1.02, // December: moderate but holiday
        };
        return seasonalityPatterns[month] || 1.0;
    }

    /**
     * Calculate confidence interval around prediction
     */
    calculateConfidenceInterval(point, trends) {
        const confidence = point.confidence || 0.8;
        const volatility = trends.volatility || 0.15;

        // 95% confidence interval (1.96 * std error)
        const marginOfError = point.predicted * volatility * 1.96 * (1 - confidence);

        return {
            lower: Math.max(300, Math.round((point.predicted - marginOfError) * 100) / 100),
            upper: Math.round((point.predicted + marginOfError) * 100) / 100),
            width: (marginOfError * 2).toFixed(2),
        };
    }

    /**
     * Calculate confidence for specific forecast point
     */
    calculatePointConfidence(daysOut, trends) {
        // Confidence decreases further in future
        const baseConfidence = 0.85;
        const decayFactor = 0.98; // 2% per day

        return Math.max(0.5, baseConfidence * Math.pow(decayFactor, daysOut));
    }

    /**
     * Calculate overall model confidence
     */
    calculateOverallConfidence(trends) {
        // Higher confidence if low volatility and stable trend
        let confidence = 0.75;

        if (trends.volatility < 0.10) confidence += 0.10;
        if (trends.volatility < 0.05) confidence += 0.05;

        if (trends.trendSlope === 0) confidence += 0.05;

        return Math.min(0.95, confidence);
    }

    /**
     * Calculate linear trend slope
     */
    calculateTrendSlope(data) {
        if (data.length < 2) return 0;

        const n = data.length;
        const xMean = (n - 1) / 2;
        const yMean = data.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            const x = i - xMean;
            const y = data[i] - yMean;
            numerator += x * y;
            denominator += x * x;
        }

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Mock historical earnings data
     */
    async getEarningsHistory(driverId, days) {
        const history = [];
        const baseEarnings = 1800;

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Simulate realistic earnings variation
            const dayOfWeek = date.getDay();
            const variance = (Math.random() - 0.5) * 600;
            const weekendBonus = dayOfWeek === 0 || dayOfWeek === 6 ? 200 : 0;

            history.push({
                date: date.toISOString().split("T")[0],
                earnings: Math.max(300, baseEarnings + variance + weekendBonus),
            });
        }

        return history;
    }

    /**
     * Get earning milestones (weekly/monthly summaries)
     */
    async getEarningsMilestones(driverId, period = "monthly") {
        try {
            const forecast = await this.forecastEarnings(driverId, { days: 90 });
            const milestones = [];

            if (period === "weekly") {
                for (let week = 1; week <= 12; week++) {
                    const start = (week - 1) * 7;
                    const end = Math.min(week * 7, forecast.data.length);
                    const weekData = forecast.data.slice(start, end);

                    milestones.push({
                        week,
                        startDate: weekData[0]?.date,
                        endDate: weekData[weekData.length - 1]?.date,
                        predicted: Math.round(weekData.reduce((s, d) => s + d.predicted, 0) * 100) / 100,
                        confidence: (weekData.reduce((s, d) => s + d.confidence, 0) / weekData.length).toFixed(2),
                    });
                }
            }

            return milestones;
        } catch (err) {
            logger.error("Earnings milestones failed", { error: err.message });
            throw err;
        }
    }
}

module.exports = new PredictiveEarningsService();
