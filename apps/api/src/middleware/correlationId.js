/**
 * Correlation ID Middleware - Traces requests through system
 * Attaches unique ID to req.correlationId for logging & debugging
 */

const { v4: uuidv4 } = require("uuid");
const { logger } = require("./logger");

/**
 * Middleware: Generate or extract correlation ID
 *
 * Checks for existing correlation ID in headers:
 * - X-Correlation-ID (preferred)
 * - X-Request-ID (fallback)
 * - X-Trace-ID (fallback)
 *
 * If none found, generates new UUID v4
 */
function correlationIdMiddleware(req, res, next) {
  try {
    // Check for existing correlation ID in headers
    const correlationId =
      req.headers["x-correlation-id"] ||
      req.headers["x-request-id"] ||
      req.headers["x-trace-id"] ||
      req.headers["traceid"] || // AWS X-Ray
      `${Date.now()}-${uuidv4()}`;

    // Attach to request object
    req.correlationId = correlationId;

    // Add to response headers for client
    res.setHeader("X-Correlation-ID", correlationId);

    // Attach to logs via Winston context
    logger.defaultMeta = { correlationId, ...logger.defaultMeta };

    // Pass to next middleware
    next();
  } catch (err) {
    logger.error("Correlation ID middleware error", {
      error: err.message,
      path: req.path,
    });
    next(err);
  }
}

/**
 * Add correlation ID to all outbound HTTP requests
 * Used for service-to-service tracing
 */
function addCorrelationIdToOutbound(client, correlationId) {
  // For axios
  if (client.interceptors) {
    client.interceptors.request.use((config) => {
      config.headers["X-Correlation-ID"] = correlationId;
      return config;
    });
  }

  // For fetch
  if (typeof client === "function") {
    return (url, options = {}) => {
      const headers = { ...options.headers, "X-Correlation-ID": correlationId };
      return fetch(url, { ...options, headers });
    };
  }

  return client;
}

/**
 * Middleware: Track request performance with correlation ID
 * Logs request start/end with duration
 */
function correlationIdPerformanceMiddleware(req, res, next) {
  const startTime = Date.now();
  const correlationId = req.correlationId;

  // Log request start
  logger.debug("Request started", {
    correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Override res.end to capture completion
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // Log request completion
    logger.info("Request completed", {
      correlationId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userId: req.user?.sub,
      organizationId: req.auth?.organizationId,
    });

    // Alert on slow requests
    if (duration > 3000) {
      logger.warn("Slow request detected", {
        correlationId,
        path: req.path,
        durationMs: duration,
      });
    }

    originalEnd.apply(res, args);
  };

  next();
}

module.exports = {
  correlationIdMiddleware,
  addCorrelationIdToOutbound,
  correlationIdPerformanceMiddleware,
};
