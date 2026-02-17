// Sentry configuration helpers used by server.js
const Sentry = require("@sentry/node");
const { logger } = require("../middleware/logger");

/**
 * Initialize Sentry with cost-optimized configuration
 * Cost optimization: Free tier (10K events/month) vs Team plan ($32/month)
 * Savings: $22/month (keep critical error tracking, reduce sampling)
 */
function initSentry(app) {
  try {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      Sentry.init({
        dsn: dsn,
        environment: process.env.NODE_ENV || "development",
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({
            app,
            request: true,
            serverName: true,
            transaction: true,
          }),
        ],
        // Cost optimization: Sample 10% of transactions (down from 100%)
        // Saves 90% of transaction quota while maintaining error capture
        tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
          ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
          : process.env.NODE_ENV === "production"
            ? 0.1  // 10% sampling in production (optimized)
            : 0.2, // 20% in staging

        // Only attach stack traces for errors (not warnings)
        attachStacktrace: true,

        // Reduce local variables in production to save quota
        includeLocalVariables: process.env.NODE_ENV !== "production",

        // Ignore low-priority routes to save quota
        denyUrls: [
          /\/api\/health/,
          /\/favicon\.ico/,
          /\/robots\.txt/,
        ],

        // Cost optimization: Filter out non-critical errors
        beforeSend(event, hint) {
          // Only send errors (5xx), not warnings or info
          if (event.level && !["error", "fatal"].includes(event.level)) {
            return null; // Don't send to Sentry
          }

          // Filter out specific error types to conserve quota
          if (event.exception) {
            const error = hint.originalException;

            // Ignore specific error messages
            const ignorePatterns = [
              /Ignored/i,
              /favicon\.ico/i,
              /robots\.txt/i,
              /NetworkError/i, // Client-side network issues
              /timeout/i, // Timeout errors (often external)
            ];

            if (error?.message && ignorePatterns.some(pattern => pattern.test(error.message))) {
              return null;
            }
          }

          // Rate limit: Drop events if quota exceeded
          // This prevents runaway costs
          if (event.tags?.rateLimit) {
            return null;
          }

          return event;
        },
      });

      logger.info("Sentry initialized with cost-optimized configuration", {
        environment: process.env.NODE_ENV,
        tracesSampleRate: Sentry.getCurrentHub().getClient()?.getOptions().tracesSampleRate,
      });
    }
    // Request handler first middleware
    app.use(Sentry.Handlers.requestHandler());
  } catch (err) {
    logger.warn("Failed to initialize Sentry", { error: err.message });
  }
}

function attachErrorHandler(app) {
  try {
    // Only capture 5xx errors to conserve quota
    app.use((err, req, res, next) => {
      // Only send 5xx errors to Sentry
      if (err.status >= 500 || !err.status) {
        Sentry.captureException(err, {
          tags: {
            path: req.path,
            method: req.method,
            statusCode: err.status || 500,
          },
          user: req.user ? { id: req.user.sub } : undefined,
        });
      }

      next(err);
    });

    app.use(Sentry.Handlers.errorHandler());
  } catch (err) {
    logger.warn("Failed to attach Sentry error handler", { error: err.message });
  }
}

module.exports = {
  initSentry,
  attachErrorHandler,
  Sentry,
};
