# Security Governance

Owner: Security Engineer Last Reviewed: 2026-04-11 Next Review Due: 2026-07-11

## Ownership Matrix

| Domain                          | Owner Role       | Backup Role       |
| ------------------------------- | ---------------- | ----------------- |
| JWT and auth secrets            | Backend Lead     | Security Engineer |
| Fly deploy token and CI secrets | DevOps Lead      | Platform Engineer |
| Billing provider secrets        | Payments Lead    | Backend Lead      |
| AI provider API keys            | AI Platform Lead | Backend Lead      |
| Observability credentials       | SRE Lead         | DevOps Lead       |

## Rotation Cadence

1. JWT and cookie secrets: every 90 days.
2. Fly deployment token: every 90 days or after maintainer offboarding.
3. Stripe webhook and secret keys: every 90 days.
4. AI provider keys: every 90 days.
5. Sentry auth tokens: every 180 days.

## Change Control

1. Open a change ticket before rotating production secrets.
2. Rotate in staging first, then production.
3. Validate with smoke checks after rotation.
4. Record rotation date and operator in incident/change log.

## Offboarding Controls

1. Revoke all personal access tokens on offboarding day.
2. Rotate shared deploy and automation tokens within 24 hours.
3. Confirm all CI secrets mapped to service accounts only.

## Quarterly Resilience Drill

1. Run a controlled rollback drill from latest release.
2. Validate rollback with scripts/release-smoke-check.sh.
3. Record mean time to detect, rollback, and recovery.
4. File follow-up actions for any failed step.
