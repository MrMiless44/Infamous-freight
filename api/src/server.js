// IMPORTANT: Initialize Sentry instrumentation first, before requiring any other modules
require("./instrument.js");

// Initialize Datadog APM early, before requiring Express internals
if (process.env.DD_TRACE_ENABLED === "true") {
  try {
    require("dd-trace").init({
      service: process.env.DD_SERVICE || "infamous-freight-api",
      env: process.env.DD_ENV || process.env.NODE_ENV || "development",
      runtimeMetrics: process.env.DD_RUNTIME_METRICS_ENABLED === "true",
    });
  } catch (e) {
    // Fail open if dd-trace is not installed
  }
}
const express = require("express");
const { corsMiddleware } = require("./middleware/cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const {
  httpLogger,
  logger,
  correlationMiddleware,
  performanceMiddleware,
} = require("./middleware/logger");
const { rateLimit } = require("./middleware/security");
const errorHandler = require("./middleware/errorHandler");
const {
  securityHeaders,
  handleCSPViolation,
} = require("./middleware/securityHeaders");
const { initSentry, attachErrorHandler } = require("./config/sentry");
const config = require("./config");
const { compressionMiddleware } = require("./middleware/performance");
const healthRoutes = require("./routes/health");
const healthDetailedRoutes = require("./routes/health-detailed");
const aiRoutes = require("./routes/ai.commands");
const billingRoutes = require("./routes/billing");
const billingPaymentsRoutes = require("./routes/billing-payments");
const voiceRoutes = require("./routes/voice");
const aiSimRoutes = require("./routes/aiSim.internal");
const usersRoutes = require("./routes/users");
const shipmentsRoutes = require("./routes/shipments");
const analyticsRoutes = require("./routes/analytics");
const avatarsRouter = require("./avatars/routes");
const genesisRouter = require("./genesis/routes");
const satelliteRouter = require("./satellite/routes");
const billingRouter = require("./billing/routes");
const authRouter = require("./auth/routes");
const { validateRuntimeEnv } = require("./config/validate");

const app = express();

// Validate critical runtime env early
validateRuntimeEnv();

// Initialize Sentry for error tracking (must be early)
initSentry(app);

app.set("trust proxy", 1);

// Apply enhanced security headers
securityHeaders(app);

// CORS allowlist (server-to-server allowed when Origin is absent)
app.use(corsMiddleware());
app.use(correlationMiddleware);
app.use(performanceMiddleware);
app.use(httpLogger);
app.use(compressionMiddleware); // Add compression for all responses
app.use(rateLimit);
app.use(express.json({ limit: "12mb" }));

// Swagger API Documentation
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Infamous Freight API Docs",
  }),
);

// Routes
app.use("/api", healthRoutes);
app.use("/api", healthDetailedRoutes);
app.use("/api", aiRoutes);
app.use("/api", billingRoutes);
app.use("/api", billingPaymentsRoutes);
app.use("/api", voiceRoutes);
app.use("/api", usersRoutes);
app.use("/api", shipmentsRoutes);
app.use("/api", analyticsRoutes);
app.use("/v1/auth", authRouter);

// Serve static avatar files (Phase 1 & Phase 2)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use("/avatars/main", express.static(path.join(__dirname, "../../web/public/avatars/main")));

// Avatar routes (Phase 1 & Phase 2)
app.use("/v1/avatars", avatarsRouter);
app.use("/api/avatars", avatarsRouter);  // Legacy path support
app.use("/v1/genesis", genesisRouter);
app.use("/v1/satellite", satelliteRouter);
app.use("/v1/billing", billingRouter);
app.get("/health", (_req, res) => res.status(200).send("ok"));

// CSP Violation Report Handler
app.post("/api/csp-violation", handleCSPViolation);

// Internal synthetic engine simulator
app.use("/internal", aiSimRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler (must be last, after Sentry)
app.use(errorHandler);

// Attach Sentry error handler (must be after all other middleware)
attachErrorHandler(app);

const apiConfig = config.getApiConfig();
const port = Number(process.env.PORT ?? apiConfig.port ?? 4000);
const host = "0.0.0.0";

if (require.main === module) {
  const httpServer = app.listen(port, host, async () => {
    logger.info(`Infamous Freight API listening on ${host}:${port}`);

    // Initialize Real-Time WebSocket server
    try {
      const realtimeService = require("./services/realtime");
      realtimeService.initialize(httpServer);
      logger.info("Real-Time WebSocket server initialized");
    } catch (error) {
      logger.warn("Real-Time WebSocket initialization failed", {
        error: error.message,
      });
    }

    // Initialize WebSocket server
    try {
      const { initializeWebSocket } = require("./services/websocket");
      initializeWebSocket(httpServer);
      logger.info("WebSocket server initialized");
    } catch (error) {
      logger.warn("WebSocket initialization failed", { error: error.message });
    }

    // Initialize Redis cache (optional)
    try {
      const { initializeRedis } = require("./services/cache");
      await initializeRedis();
    } catch (error) {
      logger.warn("Redis initialization failed, using memory cache", {
        error: error.message,
      });
    }
  });
}

module.exports = app;
