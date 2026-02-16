// monitoring/datadog-setup.js

/**
 * Datadog Monitoring Setup for Phase 9
 * Enables APM, logs, and custom metrics
 */

const tracer = require("dd-trace").init({
  hostname: process.env.DD_AGENT_HOST || "localhost",
  port: process.env.DD_TRACE_AGENT_PORT || 8126,
  service: "infamous-freight-api",
  version: process.env.APP_VERSION || "1.0.0",
  env: process.env.DD_ENV || process.env.NODE_ENV || "development",
});

const StatsD = require("node-dogstatsd").StatsD;

class MonitoringService {
  constructor() {
    this.dogstatsd = new StatsD({
      host: process.env.DD_AGENT_HOST || "localhost",
      port: process.env.DD_DOGSTATSD_PORT || 8125,
    });

    this.setupMetrics();
  }

  setupMetrics() {
    // Payment metrics
    this.registerMetric("payment.processing.latency", "histogram", "ms");
    this.registerMetric("payment.success.rate", "gauge", "percent");
    this.registerMetric("payment.crypto.value", "gauge", "usd");
    this.registerMetric("payment.bnpl.count", "count", "number");

    // Search metrics
    this.registerMetric("search.query.latency", "histogram", "ms");
    this.registerMetric("search.results.count", "histogram", "items");
    this.registerMetric("search.index.size", "gauge", "bytes");

    // Notification metrics
    this.registerMetric("notification.delivery.latency", "histogram", "ms");
    this.registerMetric("notification.delivery.rate", "gauge", "percent");
    this.registerMetric("notification.queue.size", "gauge", "items");

    // Authentication metrics
    this.registerMetric("auth.mfa.success.rate", "gauge", "percent");
    this.registerMetric("auth.device.risk.score", "histogram", "score");
    this.registerMetric("auth.bruteforce.attempts", "count", "attempts");

    // System metrics
    this.registerMetric("api.request.latency", "histogram", "ms");
    this.registerMetric("api.error.rate", "gauge", "percent");
    this.registerMetric("database.connection.pool", "gauge", "connections");
  }

  registerMetric(name, type, unit) {
    // Metrics automatically registered with Datadog
    console.log(`📊 Metric registered: ${name} (${type}, ${unit})`);
  }

  recordPaymentMetric(method, amount, duration) {
    this.dogstatsd.histogram("payment.processing.latency", duration, {
      tags: [`method:${method}`, `amount:${amount}`],
    });

    this.dogstatsd.increment("payment.count", 1, {
      tags: [`method:${method}`],
    });
  }

  recordSearchMetric(query, resultCount, duration) {
    this.dogstatsd.histogram("search.query.latency", duration, {
      tags: [`query:${query.substring(0, 50)}`],
    });

    this.dogstatsd.histogram("search.results.count", resultCount);
  }

  recordNotificationMetric(type, status, duration) {
    this.dogstatsd.histogram("notification.delivery.latency", duration, {
      tags: [`type:${type}`, `status:${status}`],
    });
  }

  recordAuthMetric(method, success, riskScore) {
    this.dogstatsd.increment("auth.attempt", 1, {
      tags: [`method:${method}`, `success:${success}`],
    });

    if (riskScore !== undefined) {
      this.dogstatsd.histogram("auth.device.risk.score", riskScore);
    }
  }

  recordAPIMetric(method, path, statusCode, duration) {
    this.dogstatsd.histogram("api.request.latency", duration, {
      tags: [`method:${method}`, `endpoint:${path}`, `status:${statusCode}`],
    });

    if (statusCode >= 400) {
      this.dogstatsd.increment("api.error.count", 1, {
        tags: [`status:${statusCode}`],
      });
    }
  }

  recordDatabaseMetric(poolSize, activeConnections) {
    this.dogstatsd.gauge("database.connection.pool", poolSize);
    this.dogstatsd.gauge("database.connection.active", activeConnections);
  }

  getTracer() {
    return tracer;
  }
}

module.exports = new MonitoringService();
