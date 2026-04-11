# Production Release Flow

Owner: DevOps Lead Last Reviewed: 2026-04-11 Next Review Due: 2026-07-11

## Pipeline

developer PR ↓ CI pipeline ↓ release checklist verified ↓ staging deploy ↓
health + metrics check ↓ production deploy ↓ monitoring window

## Release Checklist

1. CI baseline is green (`lint`, `typecheck`, `test`, `build`).
2. Security checks are green (`gitleaks`, dependency audit).
3. Fly config checks pass (`tests/ci/fly-config.test.sh`).
4. Release readiness contract passes (`tests/ci/release-readiness.test.sh`).
5. Env schema and templates are aligned (`tests/ci/env-schema-sync.test.sh`).
6. Toolchain versions are aligned (`tests/ci/toolchain-consistency.test.sh`).
7. Staging deploy succeeds and `/health` is passing.
8. Release smoke checks pass (`scripts/release-smoke-check.sh`).
9. Rollback command is prepared before production deploy.
10. Monitoring window owner is assigned for 30 minutes after deploy.

## Monitoring Window

During the first 30 minutes after production deploy, confirm:

1. Error rate is stable (no significant spike in 5xx).
2. Auth and billing endpoints remain healthy.
3. Queue/worker heartbeat (if required) is healthy.
4. Sentry issues remain within expected baseline.

## Related Runbooks

1. Rollback: `docs/operations/rollback.md`
2. Security governance and secret rotation:
   `docs/operations/security-governance.md`
