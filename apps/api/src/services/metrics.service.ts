import { db } from "../lib/db.js";

export class MetricsService {
  async record(tenantId: string, key: string, value: number) {
    return db.platformMetric.create({
      data: {
        tenantId,
        key,
        value
      }
    });
  }

  async latest(tenantId: string, key: string, minutes = 60) {
    const since = new Date(Date.now() - minutes * 60_000);

    const rows = await db.platformMetric.findMany({
      where: {
        tenantId,
        key,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: "desc" }
    });

    return rows.map((row) => row.value);
  }

  avg(values: number[]) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
