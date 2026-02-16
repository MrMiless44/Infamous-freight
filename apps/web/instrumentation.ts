/**
 * Next.js Instrumentation Hook
 * Runs once when the Next.js server starts (before any requests)
 * Initialize Sentry server-side functionality here
 *
 * This hook is called:
 * - On server startup
 * - Before the first request
 * - In both development and production
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize Sentry for Node.js runtime (server-side)
    try {
      const { initSentryServer } = await import("./sentry.server.config");
      initSentryServer();
       
      console.debug("✅ Sentry server-side initialized for Node.js runtime");
    } catch (error) {
       
      console.debug("❌ Failed to initialize Sentry for Node.js runtime:", error);
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Initialize Sentry for Edge runtime (Vercel Edge Functions, etc.)
    try {
      await import("./sentry.edge.config");
       
      console.debug("✅ Sentry edge runtime initialized");
    } catch (error) {
       
      console.debug("❌ Failed to initialize Sentry for edge runtime:", error);
    }
  }

  // If no runtime specified, assume Node.js (development)
  if (!process.env.NEXT_RUNTIME) {
    try {
      const { initSentryServer } = await import("./sentry.server.config");
      initSentryServer();
       
      console.debug("✅ Sentry server-side initialized (default Node.js)");
    } catch (error) {
       
      console.debug("❌ Failed to initialize Sentry (default):", error);
    }
  }

  // Initialize shared utilities
  initializePerformanceMonitoring();
}

/**
 * Initialize performance monitoring utilities
 */
function initializePerformanceMonitoring(): void {
  // Performance monitoring will be initialized when needed
  // This is called on server startup for setup
  if (typeof window === "undefined") {
    // Server-side performance tracking setup
    if (process.env.NODE_ENV !== "development") {
      // In production, set up any necessary server-side performance monitoring
    }
  }
}
