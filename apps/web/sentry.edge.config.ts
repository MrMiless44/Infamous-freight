/**
 * Sentry Edge Configuration for Next.js
 * Edge runtime and middleware error tracking
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn: dsn,
    environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0, // Always sample on edge for visibility
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || "unknown",

    initialScope: {
      tags: {
        component: "web",
        runtime: "edge",
      },
    },
  });
}
