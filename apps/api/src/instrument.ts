import * as Sentry from "@sentry/node";

const dsn =
  process.env.SENTRY_DSN ||
  "https://6bfe6c333544c976cbba3633aad08ad4@o4511126931963904.ingest.us.sentry.io/4511126932226048";

if (!Sentry.getClient()) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    environment: process.env.NODE_ENV || "development",
  });
}

export { Sentry };
