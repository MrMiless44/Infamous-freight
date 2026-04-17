# Error Handling Patterns

This guide documents the error handling conventions used across the Infæmous
Freight platform. Follow these patterns for consistent API responses, safer
debugging, and better observability.

## Goals

- Return a predictable error shape to API clients.
- Preserve enough context in logs to debug issues in production.
- Avoid leaking internal implementation details or secrets.
- Route unexpected errors to Sentry without losing the original stack.

## Standard Error Response

All HTTP APIs should respond with a consistent JSON shape for failures:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": { "field": "email", "reason": "invalid_format" }
  }
}
```

- `code` — a stable machine-readable string. Do not rename existing codes;
  clients may depend on them.
- `message` — safe to show to end users. Never include stack traces,
  environment values, or database identifiers that were not already public.
- `details` — optional structured context (validation issues, limits,
  retry windows).

Use status codes semantically:

| Code | When                                                  |
| ---- | ----------------------------------------------------- |
| 400  | Client sent invalid or malformed input.               |
| 401  | Missing or invalid authentication.                    |
| 403  | Authenticated but lacks scope or role.                |
| 404  | Resource not found or not visible to the caller.     |
| 409  | Conflict with current state (e.g. duplicate, stale). |
| 422  | Semantic validation failure on otherwise valid input.|
| 429  | Rate limit exceeded.                                  |
| 5xx  | Unexpected server failure.                            |

## Server-side Pattern (Express / API)

1. Throw typed application errors from business logic. Do not return plain
   `res.status(...).json(...)` calls from deep utilities — they are harder
   to reuse and test.
2. Catch at the boundary (route handler or middleware) and translate to a
   response. Use the shared error handler middleware registered in
   `apps/api/src/app.ts`.
3. Always log with structured fields before responding:
   ```ts
   logger.error(
     { err, correlationId: req.correlationId, userId: req.auth?.userId },
     "Failed to process shipment",
   );
   ```
4. Never log the request body or headers verbatim — they may contain
   credentials, tokens, or PII.

## Webhook Pattern

Webhook handlers should distinguish signature/verification failures from
downstream processing errors so that Stripe (or other senders) can retry
appropriately:

```ts
try {
  const event = getStripeClient().webhooks.constructEvent(body, sig, secret);
  await handleStripeEvent(event);
  return NextResponse.json({ received: true });
} catch (error) {
  const errorType = resolveErrorType(error);
  logger.error("[Webhook] Validation failed", { error, type: errorType });

  if (errorType === "StripeSignatureVerificationError") {
    return new NextResponse("Invalid signature", { status: 401 });
  }
  return new NextResponse("Webhook Error", { status: 400 });
}
```

- Return `401` for signature failures so the sender knows the request is
  unauthenticated and should not be retried.
- Return `400` for malformed payloads.
- Return `500` only when an unexpected server-side failure has occurred —
  Stripe and most providers will retry on 5xx responses.

## Client-side Pattern (Next.js / React)

- Treat the API error shape as the contract. Parse `error.code` first,
  fall back to `error.message` for display.
- Use the existing toast / notification primitives; do not introduce a new
  UI pattern for errors.
- Do not render `error.details` directly to users unless the field is known
  to be safe (validation messages, retry windows).

## Logging & Observability

- Use the shared `logger` from `apps/api/src/lib/logger.ts` instead of
  `console.*`. The logger handles redaction and structured output.
- Always include a correlation id when available so requests can be traced
  across services.
- Capture unexpected errors with Sentry via the instrumentation wired up in
  `apps/api/src/instrument.ts`. Do not call `Sentry.init` from other
  modules — it is initialized once at startup.
- Redact secrets: never log values from `process.env` or decoded JWTs.

## Environment & Configuration Errors

- Validate environment variables at startup via `apps/api/src/config/env.ts`.
  Fail fast rather than surfacing `undefined` deep inside a request handler.
- When a feature depends on an optional variable (e.g. `SLACK_WEBHOOK_URL`),
  short-circuit quietly if it is missing and log at `info` level. Do not
  throw — optional features should degrade gracefully.

## Testing

- Assert on the `error.code` and HTTP status in integration tests. Do not
  pin on `error.message` — wording may change.
- Cover the happy path, validation failure, authentication failure, and
  one unexpected error path per endpoint.

## Summary Checklist

- [ ] Response uses the standard `{ error: { code, message, details? } }` shape.
- [ ] Status code matches the failure category.
- [ ] Structured log entry recorded with correlation id.
- [ ] No secrets, tokens, or PII included in logs or responses.
- [ ] Unexpected errors propagate to Sentry via the central handler.
