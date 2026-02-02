/**
 * Sentry Server Configuration for Next.js
 * Server-side error tracking and performance monitoring
 */

import * as Sentry from "@sentry/nextjs";

export const initSentryServer = (): void => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    // eslint-disable-next-line no-console
    console.warn("⚠️  Sentry DSN not configured (server). Error tracking disabled.");
    return;
  }

  try {
    Sentry.init({
      // Sentry project configuration
      dsn: dsn,
      environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development",

      // Performance monitoring - sample 10% of transactions in production
      tracesSampleRate: isDevelopment ? 1.0 : 0.1,

      // Release tracking (set by build process)
      release: process.env.SENTRY_RELEASE || "unknown",

      // Integrations for server
      integrations: [
        Sentry.onUncaughtExceptionIntegration(),
        Sentry.onUnhandledRejectionIntegration(),
      ],

      // Default tags added to all events
      initialScope: {
        tags: {
          component: "web",
          runtime: "server",
          deployment: process.env.NEXT_PUBLIC_ENV || "production",
        },
      },

      // Before sending events to Sentry, modify them here
      beforeSend(event, hint) {
        // Filter 404 errors in production
        if (event.contexts?.response?.status_code === 404 && !isDevelopment) {
          return null;
        }

        // Filter harmless errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            // Skip specific meaningless errors
            if (error.message.includes("ECONNREFUSED")) {
              return null;
            }
          }
        }

        return event;
      },

      // Ignore certain errors
      denyUrls: [
        // Ignore health checks and internal errors
        /\/health$/i,
        /\/ready$/i,
      ],

      // Attach stack traces to all events
      attachStacktrace: true,

      // Breadcrumbs config
      maxBreadcrumbs: isDevelopment ? 100 : 50,

      // Ignore errors from specific patterns
      ignoreErrors: [
        // Network errors
        "ECONNREFUSED",
        "ENOTFOUND",
        "ETIMEDOUT",
        "getaddrinfo",
        // Database errors that don't require escalation
        "ConnectionError",
      ],
    });

    if (!isDevelopment) {
      // eslint-disable-next-line no-console
      console.log("✅ Sentry server initialized for", process.env.NEXT_PUBLIC_ENV);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Failed to initialize Sentry (server):", error);
  }
};

export default Sentry;
