/**
 * Metrics Collection Service
 * 
 * Collects and aggregates application metrics for monitoring and analysis
 * - HTTP request duration and count
 * - Database query performance
 * - Cache hit rates
 * - Error rates and types
 * - Job queue depth
 * - Active user count
 * 
 * Features:
 * - Time-series metric storage
 * - Automatic aggregation (min, max, avg, p95, p99)
 * - Tags and dimensions support
 * - Periodic export to monitoring systems
 * - Alert threshold support
 * 
 * Usage:
 *   const MetricsCollector = require('./metrics');
 *   MetricsCollector.recordMetric('api.request.duration', 125, {
 *     method: 'GET',
 *     path: '/api/shipments',
 *     status: 200
 *   });
 */

const logger = require("../../middleware/logger");

class MetricsCollector {
    constructor() {
        this.metrics = new Map(); // key -> { name, values[], tags }
        this.histograms = new Map(); // For percentiles
        this.gauges = new Map(); // Current values
        this.counters = new Map(); // Cumulative counts

        this.exportInterval = null;
        this.metricsHistory = [];
        this.maxHistorySize = 10000;
    }

    /**
     * Record a numeric metric
     */
    recordMetric(name, value, tags = {}) {
        if (typeof value !== "number") {
            logger.warn("Invalid metric value", { name, value });
            return;
        }

        const key = this.buildKey(name, tags);

        if (!this.metrics.has(key)) {
            this.metrics.set(key, {
                name,
                values: [],
                tags,
                updates: 0,
            });
        }

        const metric = this.metrics.get(key);
        metric.values.push(value);
        metric.updates++;

        // Keep sliding window (last 1000 values)
        if (metric.values.length > 1000) {
            metric.values.shift();
        }

        this.addToHistory(name, value, tags);
    }

    /**
     * Record a histogram (for percentile tracking)
     */
    recordHistogram(name, value, tags = {}) {
        const key = this.buildKey(name, tags);

        if (!this.histograms.has(key)) {
            this.histograms.set(key, {
                name,
                values: [],
                tags,
            });
        }

        this.histograms.get(key).values.push({
            value,
            timestamp: Date.now(),
        });
    }

    /**
     * Record a gauge (point-in-time value)
     */
    recordGauge(name, value, tags = {}) {
        const key = this.buildKey(name, tags);
        this.gauges.set(key, {
            name,
            value,
            tags,
            timestamp: Date.now(),
        });
    }

    /**
     * Increment a counter
     */
    incrementCounter(name, amount = 1, tags = {}) {
        const key = this.buildKey(name, tags);

        if (!this.counters.has(key)) {
            this.counters.set(key, {
                name,
                value: 0,
                tags,
            });
        }

        this.counters.get(key).value += amount;
    }

    /**
     * Get statistics for a metric
     */
    getStats(name) {
        const entries = Array.from(this.metrics.values()).filter(
            (m) => m.name === name
        );

        if (entries.length === 0) {
            return null;
        }

        const allValues = entries.flatMap((m) => m.values);
        if (allValues.length === 0) return null;

        const sorted = allValues.sort((a, b) => a - b);

        return {
            name,
            count: allValues.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: allValues.reduce((a, b) => a + b) / allValues.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            stdDev: this.calculateStdDev(allValues),
        };
    }

    /**
     * HTTP request metrics middleware
     */
    requestMetricsMiddleware() {
        return (req, res, next) => {
            const start = Date.now();
            const method = req.method;
            const path = req.path;

            res.on("finish", () => {
                const duration = Date.now() - start;
                const status = res.statusCode;

                // Record request duration
                this.recordMetric("http.request.duration", duration, {
                    method,
                    path,
                    status,
                });

                // Record request count
                this.incrementCounter("http.requests.total", 1, {
                    method,
                    path,
                    status,
                });

                // Alert on slow requests
                if (duration > 1000) {
                    logger.warn("Slow request detected", {
                        method,
                        path,
                        duration,
                        status,
                    });

                    this.incrementCounter("http.slow_requests", 1, {
                        method,
                        path,
                    });
                }

                // Alert on errors
                if (status >= 500) {
                    this.incrementCounter("http.errors.5xx", 1, {
                        method,
                        path,
                    });
                }
            });

            next();
        };
    }

    /**
     * Database query metrics wrapper
     */
    measureDatabaseQuery(name, query) {
        return async (...args) => {
            const start = Date.now();

            try {
                const result = await query(...args);
                const duration = Date.now() - start;

                this.recordMetric("db.query.duration", duration, {
                    query: name,
                    success: true,
                });

                return result;
            } catch (error) {
                const duration = Date.now() - start;

                this.recordMetric("db.query.duration", duration, {
                    query: name,
                    success: false,
                    error: error.code,
                });

                throw error;
            }
        };
    }

    /**
     * Cache metrics helper
     */
    recordCacheHit(key) {
        this.incrementCounter("cache.hits", 1, { key });
    }

    recordCacheMiss(key) {
        this.incrementCounter("cache.misses", 1, { key });
    }

    getCacheHitRate() {
        const hits = this.counters.get(this.buildKey("cache.hits", {}))?.value || 0;
        const misses =
            this.counters.get(this.buildKey("cache.misses", {}))?.value || 0;
        const total = hits + misses;

        return total > 0 ? (hits / total) * 100 : 0;
    }

    /**
     * Export metrics in Prometheus format
     */
    exportPrometheus() {
        let output = "";

        // Export gauges
        for (const [key, metric] of this.gauges) {
            output += `${metric.name}${this.formatTags(metric.tags)} ${metric.value}\n`;
        }

        // Export counters
        for (const [key, metric] of this.counters) {
            output += `${metric.name}_total${this.formatTags(metric.tags)} ${metric.value}\n`;
        }

        // Export histogram stats
        for (const [key, histogram] of this.histograms) {
            if (histogram.values.length === 0) continue;

            const sorted = histogram.values
                .map((v) => v.value)
                .sort((a, b) => a - b);
            const avg =
                sorted.reduce((a, b) => a + b, 0) / sorted.length;

            output += `${histogram.name}_sum${this.formatTags(histogram.tags)} ${sorted.reduce((a, b) => a + b, 0)}\n`;
            output += `${histogram.name}_count${this.formatTags(histogram.tags)} ${sorted.length}\n`;
            output += `${histogram.name}_bucket{${this.formatTags(histogram.tags)},le="0.1"} ${sorted.filter((v) => v <= 0.1).length}\n`;
            output += `${histogram.name}_bucket{${this.formatTags(histogram.tags)},le="0.5"} ${sorted.filter((v) => v <= 0.5).length}\n`;
            output += `${histogram.name}_bucket{${this.formatTags(histogram.tags)},le="1"} ${sorted.filter((v) => v <= 1).length}\n`;
            output += `${histogram.name}_bucket{${this.formatTags(histogram.tags)},le="5"} ${sorted.filter((v) => v <= 5).length}\n`;
        }

        return output;
    }

    /**
     * Get all metrics summary
     */
    getSummary() {
        return {
            timestamp: new Date().toISOString(),
            metrics: Array.from(this.metrics.values()).map((m) => ({
                name: m.name,
                updates: m.updates,
                tags: m.tags,
                stats: this.getStats(m.name),
            })),
            cacheHitRate: this.getCacheHitRate(),
            totalCounters: this.counters.size,
            totalGauges: this.gauges.size,
        };
    }

    // Private helper methods
    buildKey(name, tags) {
        return `${name}:${JSON.stringify(tags)}`;
    }

    formatTags(tags) {
        const entries = Object.entries(tags);
        if (entries.length === 0) return "";
        return `{${entries.map(([k, v]) => `${k}="${v}"`).join(",")}}`;
    }

    calculateStdDev(values) {
        const avg = values.reduce((a, b) => a + b) / values.length;
        const variance =
            values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
            values.length;
        return Math.sqrt(variance);
    }

    addToHistory(name, value, tags) {
        this.metricsHistory.push({
            name,
            value,
            tags,
            timestamp: Date.now(),
        });

        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory.shift();
        }
    }

    /**
     * Start periodic export to monitoring system
     */
    startExport(interval = 60000) {
        this.exportInterval = setInterval(() => {
            const summary = this.getSummary();
            logger.info("Metrics export", summary);

            // TODO: Send to Datadog/Prometheus/CloudWatch
        }, interval);
    }

    /**
     * Stop exporting metrics
     */
    stopExport() {
        if (this.exportInterval) {
            clearInterval(this.exportInterval);
            this.exportInterval = null;
        }
    }

    /**
     * Clear all metrics
     */
    clear() {
        this.metrics.clear();
        this.histograms.clear();
        this.gauges.clear();
        this.counters.clear();
        this.metricsHistory = [];
    }
}

module.exports = new MetricsCollector();
