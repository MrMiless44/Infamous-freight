import { Router } from "express";
import { db } from "../lib/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      service: "infamous-freight-api",
      database: "connected",
      uptime: process.uptime(),
    });
  } catch (error) {
    // Log full error details server-side for observability.
    console.error("Health check database connectivity failed", error);

    const isProduction = process.env.NODE_ENV === "production";
    const publicErrorMessage =
      !isProduction && error instanceof Error
        ? error.message
        : "Database connectivity check failed";

    res.status(503).json({
      ok: false,
      service: "infamous-freight-api",
      database: "disconnected",
      error: publicErrorMessage,
    });
  }
});

export default router;
export { router as health };
