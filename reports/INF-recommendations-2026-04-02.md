# Infamous Freight Recommendations (Production Stability)

Date: 2026-04-02 (UTC)

## Executive Summary

These recommendations are ordered to match platform architecture priorities and production risk.

1. Enforce auth + tenant isolation invariants at API boundaries.
2. Centralize RBAC checks with route-level middleware coverage tracking.
3. Stabilize runtime/config and workspace execution in CI/CD.
4. Harden shared contracts and schema validation paths.
5. Make AI and billing workflows auditable/idempotent by default.

---

## 1) Authentication hardening (Priority 1)

- Standardize a single `requireAuth()` middleware used by every protected route.
- Add a startup assertion that fails fast if auth secrets/providers are unset.
- Add integration tests for:
  - missing auth token -> `401`
  - invalid token -> `401`
  - valid token without permission -> `403`

**Why now:** auth regressions cascade into tenant and billing risk.

---

## 2) Tenant isolation enforcement (Priority 2)

- Introduce a Prisma guard utility that requires `tenantId` in all tenant-scoped queries.
- Add lint/check pattern to flag direct Prisma calls in route handlers that omit tenant constraints.
- Add test matrix for cross-tenant access attempts on all critical entities.

**Guardrail target:** no route should query mutable business data without `tenantId` + authenticated principal.

---

## 3) RBAC + permission enforcement (Priority 3)

- Define a route permission registry (`route -> required permission`) and validate at boot.
- Add middleware-level unit tests ensuring RBAC executes before controller logic.
- Log authorization denials with actor, organization, and permission key (without sensitive payload leakage).

**Outcome:** deterministic permission model and easier auditability.

---

## 4) Environment/config reliability (Priority 4)

- Add a typed config module with strict parsing for required env vars.
- Block app boot for invalid DB/Stripe/auth config.
- Ensure CI explicitly runs `prisma generate` before typecheck/build/test.
- Resolve runtime/tooling drift by pinning Node and pnpm versions in CI and contributor docs.

**Outcome:** fewer "works locally, fails in CI/deploy" incidents.

---

## 5) Shared contracts and API correctness (Priority 5)

- Centralize request/response schemas in shared package and consume from API + web.
- Add contract tests for high-value APIs (auth, org membership, billing events, AI actions).
- Enforce no breaking contract changes without versioned migration notes.

**Outcome:** lower frontend/backend drift and safer deploy cadence.

---

## 6) Audit logging for AI decisions (Priority 6)

- Implement a single AI action wrapper that always writes `AiDecisionLog`.
- Require request correlation IDs so every AI action is traceable to actor and tenant.
- Add tests verifying AI paths fail if audit-log write fails (or are retried via queue policy).

**Outcome:** compliance-grade traceability for automated actions.

---

## 7) Billing idempotency and integrity (Priority 7)

- Enforce idempotency keys for all Stripe webhook and mutation handlers.
- Require `BillingEvent` upsert/check before side effects.
- Add replay tests for duplicate webhook delivery and out-of-order events.

**Outcome:** prevents double charges and inconsistent account state.

---

## 8) Immediate 2-week execution plan

1. **Week 1:** auth middleware unification, tenant Prisma guard, route permission registry.
2. **Week 2:** config strictness, AI decision logging wrapper, billing idempotency replay tests.

### Exit Criteria

- Jest suite passes with `--runInBand`.
- No protected route bypasses auth/RBAC middleware.
- No tenant-scoped writes without `tenantId`.
- AI actions produce `AiDecisionLog` rows in integration tests.
- Duplicate billing events are no-ops.

---

## Suggested CI gate order

1. `pnpm prisma generate`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test -- --runInBand`
5. app builds (`apps/api`, `apps/web`)

This order catches config/schema breakage before expensive build steps.
