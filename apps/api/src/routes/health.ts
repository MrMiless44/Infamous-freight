import { Router } from "express";

export const health = Router();

health.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "infamous-freight-api",
    timestamp: new Date().toISOString(),
  });
});
