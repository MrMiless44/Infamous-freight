// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9: SENTRY & DATADOG INTEGRATION
// Comprehensive error tracking and APM setup for production
// ═══════════════════════════════════════════════════════════════════════════

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// DataDog RUM is a browser-only package — not imported in the Node.js API.
// See apps/web for client-side RUM instrumentation.
const datadogRum = null as null;

// ═══════════════════════════════════════════════════════════════════════════
// SENTRY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn("⚠️ SENTRY_DSN not configured. Error tracking disabled.");
    return null;
  }

  Sentry.init({
    // Core configuration
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Performance monitoring (Sentry v10 API)
    integrations: [nodeProfilingIntegration() as any, Sentry.httpIntegration()],

    // Ignore known errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Network errors
      "NetworkError",
      "Network request failed",
      // User actions
      "User cancelled",
      "user cancelled",
    ],

    // Before sending hook for filtering
    beforeSend(event, hint) {
      // Filter out low-priority errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
          return event; // Keep connection errors
        }
      }
      return event;
    },

    // Error filtering
    denyUrls: [
      // Browser extensions
      /^moz-extension:\/\//,
      /^chrome:\/\//,
      /^webpack:\/\//,
      /extension\//,
    ],
  });

  console.log("✅ Sentry initialized for error tracking");
  return Sentry;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATADOG RUM CONFIGURATION (Browser)
// ═══════════════════════════════════════════════════════════════════════════

export function initDatadogRUM() {
  // DataDog Browser RUM runs only in the browser (apps/web). This stub
  // prevents accidental server-side imports from breaking the API.
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

export function captureError(error: Error, context: Record<string, any> = {}) {
  // Capture in Sentry
  if (Sentry) {
    Sentry.captureException(error, {
      tags: {
        ...context.tags,
      },
      extra: {
        ...context.extra,
      },
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV !== "production") {
    console.error("Error captured:", error, context);
  }
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context: Record<string, any> = {},
) {
  if (Sentry) {
    Sentry.captureMessage(message, level);
    if (Object.keys(context).length > 0) {
      Sentry.setContext("message", context);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE MONITORING
// ═══════════════════════════════════════════════════════════════════════════

export function startTransaction(name: string, op: string = "http.request") {
  if (!Sentry) return null;

  // Sentry v10 uses startSpan instead of the deprecated startTransaction
  return Sentry.startInactiveSpan({ name, op });
}

export function capturePerformanceMetric(
  name: string,
  duration: number,
  tags: Record<string, string> = {},
) {
  if (Sentry) {
    Sentry.captureMessage(`Performance: ${name}`, "info");
    Sentry.setMeasurement(name, duration, "ms");
    if (Object.keys(tags).length > 0) {
      Sentry.setTags(tags);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USER & CONTEXT TRACKING
// ═══════════════════════════════════════════════════════════════════════════

export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
  organizationId?: string;
}) {
  if (Sentry) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.role,
    });

    Sentry.setContext("user", {
      organizationId: user.organizationId,
      role: user.role,
    });
  }

  if (false) {
    // datadogRum is null in the API (browser-only)
    void datadogRum;
  }
}

export function setRequestContext(request: {
  method: string;
  path: string;
  userId?: string;
  organizationId?: string;
  correlationId?: string;
}) {
  if (Sentry) {
    Sentry.setContext("request", {
      method: request.method,
      path: request.path,
      userId: request.userId,
      organizationId: request.organizationId,
      correlationId: request.correlationId,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT RULES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const SENTRY_ALERT_RULES = {
  // Alert when error count spikes >5%
  errorSpike: {
    name: "Error Spike Alert",
    condition: "error_count_increase_percent >= 5",
    actions: ["notify_on_integration", "resolve_in_slack"],
    enabled: true,
  },

  // Alert on critical 500 errors
  criticalErrors: {
    name: "Critical 500 Error",
    condition: "error.status_code == 500",
    actions: ["create_incident", "notify_team"],
    enabled: true,
  },

  // Alert on performance degradation (>2x baseline)
  performanceDegradation: {
    name: "Performance Degradation",
    condition: "performance_p95 > baseline * 2",
    actions: ["notify_team", "create_incident"],
    enabled: true,
  },

  // Alert on high error rate
  highErrorRate: {
    name: "High Error Rate",
    condition: "error_rate > 0.01", // > 1%
    actions: ["notify_team", "page_on_call"],
    enabled: true,
  },
};

export const DATADOG_ALERT_RULES = {
  // Alert when P95 latency exceeds 500ms
  highLatency: {
    name: "High API Latency",
    query: "avg:trace.web.request.duration{service:infamous-freight-api} > 500",
    threshold: 500,
    enabled: true,
  },

  // Alert on high error rate
  highErrorRate: {
    name: "API Error Rate High",
    query: "sum:trace.web.request.errors{service:infamous-freight-api} > 10",
    threshold: 10,
    enabled: true,
  },

  // Alert on database connection pool exhaustion
  dbPoolExhaustion: {
    name: "Database Pool Connections High",
    query: "avg:postgresql.connections{service:infamous-freight-db} > 90 percentile:0.95",
    threshold: 90,
    enabled: true,
  },

  // Alert on Redis memory usage
  redisMemory: {
    name: "Redis Memory Usage High",
    query: "avg:redis.info.memory.used_mb > 80 percentile:0.95",
    threshold: 80,
    enabled: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// BREADCRUMB TRACKING
// ═══════════════════════════════════════════════════════════════════════════

export function addBreadcrumb(
  message: string,
  category: string = "info",
  level: "info" | "warning" | "error" = "info",
) {
  if (Sentry) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  }
}

// Example breadcrumbs for common operations
export const breadcrumbs = {
  shipmentCreated: (shipmentId: string) =>
    addBreadcrumb(`Shipment created: ${shipmentId}`, "shipment"),

  driverAssigned: (driverId: string, shipmentId: string) =>
    addBreadcrumb(`Driver ${driverId} assigned to shipment ${shipmentId}`, "dispatch"),

  routeOptimized: (routeId: string) => addBreadcrumb(`Route optimized: ${routeId}`, "routing"),

  cacheHit: (key: string) => addBreadcrumb(`Cache hit: ${key}`, "cache"),

  cacheMiss: (key: string) => addBreadcrumb(`Cache miss: ${key}`, "cache", "warning"),

  databaseQuery: (duration: number) =>
    addBreadcrumb(`Database query completed in ${duration}ms`, "database"),

  authenticationFailed: (reason: string) =>
    addBreadcrumb(`Authentication failed: ${reason}`, "auth", "warning"),

  rateLimitExceeded: (endpoint: string) =>
    addBreadcrumb(`Rate limit exceeded on ${endpoint}`, "ratelimit", "warning"),
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  initSentry,
  initDatadogRUM,
  captureError,
  captureMessage,
  startTransaction,
  capturePerformanceMetric,
  setUserContext,
  setRequestContext,
  addBreadcrumb,
  breadcrumbs,
  SENTRY_ALERT_RULES,
  DATADOG_ALERT_RULES,
};
