import { MetricsService } from "../services/metrics.service.js";

const metrics = new MetricsService();

export function metricsMiddleware(getTenantId: (req: any) => string | undefined) {
  return async (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on("finish", async () => {
      const tenantId = getTenantId(req);
      if (!tenantId) return;

      const latency = Date.now() - start;

      await metrics.record(tenantId, "latency_ms", latency);
      await metrics.record(tenantId, "error_rate", res.statusCode >= 500 ? 1 : 0);
      await metrics.record(tenantId, "uptime", 100);
    });

    next();
  };
}
