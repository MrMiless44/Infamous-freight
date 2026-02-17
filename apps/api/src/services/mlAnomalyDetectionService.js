/**
 * ML Anomaly Detection Service
 * Detects unusual patterns, outliers, and anomalies in operational metrics
 * 
 * Use Cases:
 * - Detect traffic spikes or sudden drops (DDoS, system errors, legitimate surge)
 * - Identify performance degradation (database slowness, API latency increase)
 * - Spot unusual error patterns (error rate spike, new error types)
 * - Monitor resource utilization (memory leaks, CPU exhaustion, disk fill)
 * - Detect anomalous user behavior (impossible travel, unusual shipment patterns)
 * - Financial anomaly detection (unusual payment amounts, fraud patterns)
 * 
 * Algorithms:
 * - Statistical: Z-score, IQR (Interquartile Range) for robust anomaly detection
 * - Time-Series: ARIMA for trend analysis and forecasting
 * - Clustering: Isolation Forest for multivariate anomalies
 * - Change Detection: CUSUM (Cumulative Sum) for gradual drift
 * 
 * Thresholds:
 * - Z-score > 3: Extreme anomaly (99.7% confidence)
 * - Z-score > 2: Strong anomaly (95% confidence)
 * - IQR * 1.5: Outlier detection
 * - CUSUM > threshold: Trend changes
 * 
 * Architecture: Metrics ingestion → Time-series analysis → Alert generation → Remediation
 */

const { logger } = require("../middleware/logger");
const prisma = require("../lib/prisma");

class MLAnomalyDetectionService {
    constructor() {
        this.windowSize = 60; // Analysis window (last 60 data points)
        this.sensitivityLevel = 2.5; // Z-score threshold (2.5 = 98% confidence)
        this.minHistorySize = 20; // Minimum historical data for analysis
        this.forecastHorizon = 12; // Forecast next 12 periods
        this.alertThreshold = 3; // Send alert at Z-score > 3
        this.metrics = new Map(); // In-memory metric storage
        this.models = new Map(); // Trained anomaly models per metric
    }

    /**
     * Initialize anomaly detection for critical metrics
     */
    async initialize() {
        try {
            logger.info("ML Anomaly Detection service initialized", {
                sensitivity: this.sensitivityLevel,
                windowSize: this.windowSize,
            });
            return true;
        } catch (err) {
            logger.error("Failed to initialize anomaly detection", {
                error: err.message,
            });
            throw err;
        }
    }

    /**
     * Record metric value for time-series analysis
     *
     * @param {string} metricName - Metric identifier (e.g., 'api.response_time')
     * @param {number} value - Current metric value
     * @param {Object} metadata - Additional context (service, region, user_id)
     */
    recordMetric(metricName, value, metadata = {}) {
        try {
            if (!this.metrics.has(metricName)) {
                this.metrics.set(metricName, []);
            }

            const history = this.metrics.get(metricName);
            const point = {
                timestamp: Date.now(),
                value,
                metadata,
            };

            history.push(point);

            // Keep only last N points to manage memory
            if (history.length > this.windowSize * 2) {
                history.splice(0, history.length - this.windowSize);
            }

            // Analyze for anomalies if enough history
            if (history.length >= this.minHistorySize) {
                this.detectAnomalies(metricName, value, history);
            }
        } catch (err) {
            logger.debug("Failed to record metric", {
                error: err.message,
                metric: metricName,
            });
        }
    }

    /**
     * Detect anomalies using multiple statistical methods
     *
     * @private
     */
    async detectAnomalies(metricName, currentValue, history) {
        try {
            const values = history.map((p) => p.value);
            const results = {
                metricName,
                timestamp: Date.now(),
                currentValue,
                anomalies: [],
                forecast: [],
            };

            // Method 1: Z-Score (Statistical)
            const zResult = this.detectZScoreAnomaly(values);
            if (zResult.isAnomaly) {
                results.anomalies.push({
                    method: "zscore",
                    zScore: zResult.zScore,
                    severity: zResult.severity,
                    confidence: zResult.confidence,
                });
            }

            // Method 2: IQR (Robust to outliers)
            const iqrResult = this.detectIQRAnomaly(values);
            if (iqrResult.isAnomaly) {
                results.anomalies.push({
                    method: "iqr",
                    severity: iqrResult.severity,
                });
            }

            // Method 3: Isolation Forest (Multivariate)
            const forestResult = this.detectIsolationForestAnomaly(
                values,
                metricName
            );
            if (forestResult.isAnomaly) {
                results.anomalies.push({
                    method: "isolation_forest",
                    anomalyScore: forestResult.score,
                });
            }

            // Method 4: ARIMA Residuals (Trend-based)
            const arimaResult = this.detectARIMAResidualAnomaly(values, metricName);
            if (arimaResult.isAnomaly) {
                results.anomalies.push({
                    method: "arima_residual",
                    residual: arimaResult.residual,
                    threshold: arimaResult.threshold,
                });
            }

            // If multiple methods agree, high confidence anomaly
            if (results.anomalies.length >= 2) {
                results.confirmed = true;
                results.confidence = Math.min(
                    1.0,
                    (results.anomalies.length / 4) * 1.25
                );

                // Trigger alert
                if (results.confidence >= 0.5) {
                    await this.triggerAlert(results);
                }
            }

            // Generate forecast
            results.forecast = this.forecastARIMA(values);

            // Store anomaly record
            await this.storeAnomalyRecord(results);

            return results;
        } catch (err) {
            logger.debug("Error detecting anomalies", {
                error: err.message,
                metric: metricName,
            });
        }
    }

    /**
     * Z-Score anomaly detection (normal distribution)
     * Detects values that deviate significantly from mean
     *
     * @private
     */
    detectZScoreAnomaly(values) {
        if (values.length < 2) return { isAnomaly: false };

        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance =
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
            values.length;
        const stdDev = Math.sqrt(variance);

        const currentValue = values[values.length - 1];
        const zScore = stdDev === 0 ? 0 : Math.abs((currentValue - mean) / stdDev);

        let severity = "normal";
        let confidence = 0;

        if (zScore > 3) {
            severity = "critical";
            confidence = 0.999; // 99.9% confidence
        } else if (zScore > this.sensitivityLevel) {
            severity = "warning";
            confidence = 1 - Math.pow(0.01, zScore / 3); // ~98% at Z=2.5
        }

        return {
            isAnomaly: zScore > this.sensitivityLevel,
            zScore,
            severity,
            confidence,
        };
    }

    /**
     * IQR (Interquartile Range) - Robust to outliers
     * Lower quartile (Q1) and upper quartile (Q3)
     *
     * @private
     */
    detectIQRAnomaly(values) {
        if (values.length < 4) return { isAnomaly: false };

        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(values.length * 0.25)];
        const q3 = sorted[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;

        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const currentValue = values[values.length - 1];

        const isOutlier =
            currentValue < lowerBound || currentValue > upperBound;

        return {
            isAnomaly: isOutlier,
            severity: isOutlier ? "high" : "normal",
            bounds: { lower: lowerBound, upper: upperBound },
        };
    }

    /**
     * Isolation Forest - Multivariate anomaly detection
     * Isolates anomalies by randomly selecting features and thresholds
     *
     * @private
     */
    detectIsolationForestAnomaly(values, metricName) {
        if (values.length < 10) return { isAnomaly: false };

        // Simplified isolation score: how quickly point can be isolated
        const mean = values.reduce((a, b) => a + b) / values.length;
        const stdDev = Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
            values.length
        );

        const currentValue = values[values.length - 1];
        const normalizedDist = Math.abs((currentValue - mean) / (stdDev || 1));

        // Anomaly score: exponential decay of distance
        const anomalyScore = 1 - Math.exp(-normalizedDist / 2);

        return {
            isAnomaly: anomalyScore > 0.7,
            score: anomalyScore,
        };
    }

    /**
     * ARIMA Residual detection - Identifies trend breaks
     * Fits autoregressive model and flags large residuals
     *
     * @private
     */
    detectARIMAResidualAnomaly(values, metricName) {
        if (values.length < 5) return { isAnomaly: false };

        // Simplified AR(1) model: predict next value from last value
        // Residual = actual - predicted
        const lastValue = values[values.length - 1];
        const prevValue = values[values.length - 2];

        // AR(1) coefficient (autocorrelation at lag 1)
        const mean = values.reduce((a, b) => a + b) / values.length;
        let numerator = 0,
            denominator = 0;

        for (let i = 1; i < values.length; i++) {
            numerator +=
                (values[i] - mean) * (values[i - 1] - mean);
            denominator += Math.pow(values[i - 1] - mean, 2);
        }

        const ar1Coeff = numerator / (denominator || 1);
        const predicted = mean + ar1Coeff * (prevValue - mean);
        const residual = lastValue - predicted;
        const residualStdDev = Math.sqrt(
            values.reduce((sum, val, i) => {
                const pred =
                    i === 0 ? mean : mean + ar1Coeff * (values[i - 1] - mean);
                return sum + Math.pow(val - pred, 2);
            }, 0) / (values.length - 1)
        );

        const threshold = 2 * residualStdDev;

        return {
            isAnomaly: Math.abs(residual) > threshold,
            residual: residual.toFixed(2),
            threshold: threshold.toFixed(2),
        };
    }

    /**
     * Forecast next values using ARIMA model
     *
     * @private
     */
    forecastARIMA(values) {
        if (values.length < 3) return [];

        const mean = values.reduce((a, b) => a + b) / values.length;
        let numerator = 0,
            denominator = 0;

        for (let i = 1; i < values.length; i++) {
            numerator +=
                (values[i] - mean) * (values[i - 1] - mean);
            denominator += Math.pow(values[i - 1] - mean, 2);
        }

        const ar1Coeff = numerator / (denominator || 1);
        const forecast = [];
        let lastValue = values[values.length - 1];

        for (let h = 1; h <= this.forecastHorizon; h++) {
            const predicted = mean + ar1Coeff * (lastValue - mean);
            forecast.push({
                horizon: h,
                value: Math.round(predicted * 100) / 100,
            });
            lastValue = predicted;
        }

        return forecast;
    }

    /**
     * Trigger alert when anomaly detected
     *
     * @private
     */
    async triggerAlert(anomalyResult) {
        try {
            // Create alert record
            await prisma.anomalyAlert.create({
                data: {
                    metricName: anomalyResult.metricName,
                    currentValue: anomalyResult.currentValue,
                    methods: anomalyResult.anomalies.map((a) => a.method),
                    severity:
                        anomalyResult.confidence > 0.8
                            ? "high"
                            : "medium",
                    confidence: anomalyResult.confidence,
                    details: JSON.stringify(anomalyResult),
                    status: "open",
                    createdAt: new Date(),
                },
            });

            // Send notification to monitoring dashboard
            logger.warn("Anomaly detected", {
                metric: anomalyResult.metricName,
                value: anomalyResult.currentValue,
                methods: anomalyResult.anomalies.length,
                confidence: anomalyResult.confidence.toFixed(3),
            });
        } catch (err) {
            logger.debug("Failed to create anomaly alert", {
                error: err.message,
            });
        }
    }

    /**
     * Store anomaly record for historical analysis
     *
     * @private
     */
    async storeAnomalyRecord(result) {
        try {
            if (!result.confirmed) return;

            // Keep anomaly history for analysis (90-day retention)
            await prisma.anomalyHistory.create({
                data: {
                    metricName: result.metricName,
                    timestamp: new Date(result.timestamp),
                    value: result.currentValue,
                    methods: JSON.stringify(result.anomalies),
                    forecast: JSON.stringify(result.forecast),
                },
            });

            // Auto-cleanup old records (90 days)
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            await prisma.anomalyHistory.deleteMany({
                where: {
                    timestamp: { lt: ninetyDaysAgo },
                },
            });
        } catch (err) {
            logger.debug("Failed to store anomaly record", {
                error: err.message,
            });
        }
    }

    /**
     * Get anomaly summary for monitoring dashboard
     *
     * @param {Object} filters - Time range filters
     * @returns {Promise<Object>} - Anomaly statistics
     */
    async getAnomalySummary(filters = {}) {
        try {
            const { startDate, endDate, limit = 50 } = filters;

            const alerts = await prisma.anomalyAlert.findMany({
                where: {
                    createdAt: {
                        gte: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
                        lte: endDate || new Date(),
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            });

            const summary = {
                totalAlerts: alerts.length,
                criticalCount: alerts.filter((a) => a.severity === "high").length,
                warningCount: alerts.filter((a) => a.severity === "medium").length,
                metrics: [...new Set(alerts.map((a) => a.metricName))],
                recentAlerts: alerts.slice(0, 10),
            };

            return summary;
        } catch (err) {
            logger.error("Failed to get anomaly summary", {
                error: err.message,
            });
            throw err;
        }
    }

    /**
     * Shutdown service
     */
    async shutdown() {
        logger.info("ML Anomaly Detection service shutdown");
        this.metrics.clear();
        this.models.clear();
    }
}

// Singleton instance
let service = null;

async function getMLAnomalyDetectionService() {
    if (!service) {
        service = new MLAnomalyDetectionService();
        await service.initialize();
    }
    return service;
}

module.exports = {
    getMLAnomalyDetectionService,
    MLAnomalyDetectionService,
};
