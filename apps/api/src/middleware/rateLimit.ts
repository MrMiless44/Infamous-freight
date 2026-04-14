import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

function buildLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message,
      },
    },
    skip: (req) => req.method === "OPTIONS",
  });
}

export const authLimiter = buildLimiter(
  15 * 60 * 1000,
  env.rateLimitAuthMax,
  "Too many authentication attempts. Try again later.",
);

export const generalLimiter = buildLimiter(
  15 * 60 * 1000,
  env.rateLimitGeneralMax,
  "Too many requests. Please try again later.",
);

export const trackingLimiter = generalLimiter;
