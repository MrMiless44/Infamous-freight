# Repository Architecture

## Purpose

This document defines the canonical structure of the Infamous Freight monorepo.

The goal is to prevent overlapping top-level domains from becoming ambiguous,
duplicative, or operationally fragile.

## System layers

### 1. Product runtime layer
Primary home:
- `apps/`

This layer contains runnable product applications and user-facing runtime entrypoints.

Examples:
- API
- Web
- Mobile
- Worker
- App-layer AI runtime

### 2. Shared library layer
Primary home:
- `packages/`

This layer contains reusable internal packages:
- shared contracts
- shared UI
- shared schemas
- shared utilities
- Genesis assistant/avatar package

### 3. Standalone service layer
Primary homes:
- `services/`
- `ai/`

Use `services/` for standalone service domains.
Use `ai/` specifically for Python/ML-serving systems or other non-app AI runtimes.

Rule:
- do not create both `apps/<domain>` and top-level `<domain>` without documenting why.

### 4. Compliance and security layer
Primary homes:
- `@compliance/`
- `.security/`

Rule:
- `@compliance/` owns compliance code, schemas, and domain logic
- `.security/` owns policy, reporting, and incident-response docs
- `compliance/` should be treated as legacy unless documented otherwise

### 5. Infrastructure layer
Primary homes:
- `docker/`
- `k8s/`
- `terraform/`
- `deploy/`
- `infrastructure/`
- `nginx/`
- `supabase/`

Rule:
- infra may remain tool-split
- all infra directories must be referenced in `REPO_MAP.md`
- new infra roots are discouraged unless tooling genuinely requires them

### 6. Testing and verification layer
Primary homes:
- `tests/`
- `e2e/`
- `k6/`

Rule:
- `k6/` is the canonical home for load/performance tests
- `load-tests/` and `tools/load-tests/` should be consolidated or explicitly documented

### 7. Ops and observability layer
Primary homes:
- `monitoring/`
- `observability/`
- `ops/`

Rule:
- `monitoring/` should focus on dashboards/alerts/checks
- `observability/` should focus on logs/traces/metrics instrumentation
- `ops/` should focus on procedures, runbooks, and human operations

## Canonical decisions

### AI split
- `apps/ai` = app-layer AI runtime if needed by the TypeScript monorepo
- `ai/` = standalone ML/Python inference systems

### Compliance split
- `@compliance/` = canonical code domain
- `compliance/` = transitional/legacy until merged or explicitly separated

### Performance split
- `k6/` = canonical performance test home
- other load-test directories should migrate toward `k6/` or be justified

### Infra split
Infra is allowed to remain multi-root because tool ecosystems differ,
but the repository must document ownership and purpose clearly.

## Architectural guardrails

1. Avoid duplicate top-level concepts.
2. Prefer moving code into an existing canonical root over creating a new root.
3. Require a README for every top-level domain that is not self-evident.
4. Every top-level domain should have an owner in `OWNERSHIP.md`.
5. Every ambiguous domain must have a consolidation decision tracked in `CONSOLIDATION_PLAN.md`.
