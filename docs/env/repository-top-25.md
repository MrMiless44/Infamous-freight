# Repository Top 25 Environment Variables

This is the canonical shortlist of 25 environment variables to provision for
Infamous Freight across API, web, mobile, worker, CI/CD, and Fly deployment
flows.

## Top 25

| #   | Variable               | Scope                | Required           | Notes                                              |
| --- | ---------------------- | -------------------- | ------------------ | -------------------------------------------------- |
| 1   | DATABASE_URL           | API, worker          | Yes                | Primary PostgreSQL connection string               |
| 2   | REDIS_URL              | API, worker          | Recommended        | Caching, queueing, and rate limiter backing store  |
| 3   | NODE_ENV               | API, web, worker     | Yes                | `development`, `test`, or `production`             |
| 4   | APP_PORT               | API                  | Yes                | Application runtime port (default 4000)            |
| 5   | API_PORT               | API, root template   | Recommended        | Compatibility override for app port resolution     |
| 6   | JWT_ALGORITHM          | API                  | Yes                | `HS256` or `RS256`                                 |
| 7   | JWT_SECRET             | API                  | Yes for HS256      | Minimum 32 chars when using HS256                  |
| 8   | JWT_ACCESS_EXPIRES_IN  | API                  | Yes                | Access token TTL, default `15m`                    |
| 9   | JWT_REFRESH_EXPIRES_IN | API                  | Yes                | Refresh token TTL, default `7d`                    |
| 10  | JWT_ISSUER             | API                  | Yes                | JWT issuer claim                                   |
| 11  | JWT_AUDIENCE           | API                  | Yes                | JWT audience claim                                 |
| 12  | AUTH_COOKIE_SECURE     | API                  | Yes                | Must be `true` when SameSite is `none`             |
| 13  | AUTH_COOKIE_SAME_SITE  | API                  | Yes                | `strict`, `lax`, or `none`                         |
| 14  | AUTH_COOKIE_DOMAIN     | API                  | Recommended        | Usually `.infamousfreight.com` in production       |
| 15  | COOKIE_SECRET          | API                  | Recommended        | Cookie signing/encryption secret                   |
| 16  | CORS_ORIGIN            | API                  | Yes                | Allowed frontend origin(s)                         |
| 17  | SENTRY_DSN             | API, web, worker     | Recommended        | Error tracking DSN                                 |
| 18  | LOG_LEVEL              | API, worker          | Recommended        | `debug`, `info`, `warn`, `error`                   |
| 19  | AI_PROVIDER            | API                  | Recommended        | `stub`, `openai`, or `anthropic`                   |
| 20  | OPENAI_API_KEY         | API                  | Conditional        | Required if `AI_PROVIDER=openai`                   |
| 21  | ANTHROPIC_API_KEY      | API                  | Conditional        | Required if `AI_PROVIDER=anthropic`                |
| 22  | STRIPE_SECRET_KEY      | API, web server-side | Recommended        | Stripe server API key                              |
| 23  | STRIPE_WEBHOOK_SECRET  | API, web server-side | Recommended        | Stripe webhook signing secret                      |
| 24  | STRIPE_PRICE_STARTER   | API                  | Recommended        | Stripe price ID for starter plan                   |
| 25  | FLY_API_TOKEN          | CI/CD                | Yes for Fly deploy | GitHub Actions secret used by Fly deploy workflows |

## Provisioning Notes

- API schema source of truth: apps/api/src/config/env.ts.
- Local dev templates: .env.example and apps/api/.env.example.
- Production templates: .env.production.example and
  apps/api/.env.production.example.
- For Fly deployment, set FLY_API_TOKEN as a GitHub Actions secret and do not
  store it in committed files.
