/**
 * Response Optimization Middleware
 * Handles compression, caching, and response formatting
 */

const compression = require("compression");

/**
 * Compression middleware with smart thresholds
 */
const compressionMiddleware = compression({
  threshold: 1024, // Only compress responses > 1KB
  level: 6, // Balance between compression ratio and CPU usage
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
});

/**
 * Response standardization middleware
 */
function responseFormattingMiddleware(req, res, next) {
  // Override res.json to include metadata
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    const response = {
      success: res.statusCode < 400,
      statusCode: res.statusCode,
      ...(data instanceof Object ? data : { data }),
    };

    return originalJson(response);
  };

  next();
}

/**
 * Performance tracking middleware
 */
function performanceTrackingMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`[SLOW_REQUEST] ${req.method} ${req.path} took ${duration}ms`);
    }

    // Add timing header
    res.set("X-Response-Time", `${duration}ms`);
  });

  next();
}

module.exports = {
  compressionMiddleware,
  responseFormattingMiddleware,
  performanceTrackingMiddleware,
};
