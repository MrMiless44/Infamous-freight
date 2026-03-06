# Consolidation Plan

## Goal

Reduce top-level ambiguity without breaking active workflows.

## Priority 1 — compliance
Canonical target:
- `@compliance/`

Action:
- move reusable compliance code, schemas, and APIs into `@compliance/`
- leave `compliance/` only for transitional assets that are not yet migrated
- add deprecation notices in `compliance/README.md`

## Priority 2 — AI split
Canonical targets:
- `apps/ai` for TypeScript app-layer runtime
- `ai/` for Python/ML model-serving systems

Action:
- document the boundary clearly
- do not duplicate business logic across both locations
- push shared contracts into `packages/shared` where possible

## Priority 3 — performance testing
Canonical target:
- `k6/`

Action:
- inventory `load-tests/` and `tools/load-tests/`
- migrate active scenarios into `k6/`
- leave wrappers/tooling in `tools/load-tests/` only when necessary

## Priority 4 — observability
Canonical boundary:
- `monitoring/` = dashboards, alerts, probes
- `observability/` = logs, traces, metrics instrumentation

Action:
- move mixed content to the correct side
- create small READMEs in each folder

## Priority 5 — infrastructure
Canonical rule:
- tool-specific roots may remain, but purpose must be documented

Action:
- create READMEs in `deploy/`, `docker/`, `k8s/`, `terraform/`, and `infrastructure/`
- document ownership and intended use
