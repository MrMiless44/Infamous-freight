import * as Sentry from "@sentry/node";
import type { ErrorRequestHandler } from "express";

const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
}

export function captureException(error: unknown, extras?: Record<string, unknown>): void {
  if (!sentryDsn) {
    return;
  }

  const normalizedError = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(normalizedError, extras ? { extra: extras } : undefined);
}

export const sentryErrorHandler: ErrorRequestHandler = (err, req, _res, next) => {
  captureException(err, {
    method: req.method,
    path: req.path,
    requestId: req.headers["x-request-id"],
  });
  next(err);
};

export function verifySentryCapture(): void {
  captureException(new Error("Sentry integration verification event"), {
    source: "manual-verification",
  });
}
