# Release Checklist

## Pre-Release

- [ ] All CI checks pass: typecheck, lint, build, audit, test.
- [ ] Verify environment variable changes are documented:
  - `DATABASE_URL`
  - `REDIS_URL`
- [ ] Review changes to workflows or dependencies for security impact.
- [ ] Verify rollback target before release (identify the last known-good tag).
- [ ] Run smoke test against staging: `make smoke` (or `SMOKE_BASE_URL=<staging-url> bash scripts/smoke.sh`).


## Governance Gates

- [ ] `main` is protected with required status checks and linear history.
- [ ] CODEOWNERS review requirement is active for `.github/`, `docs/`, and app surfaces.
- [ ] Release PR includes a rollback owner and on-call contact.

## Release Process

1. Increment the version in the root `package.json` using semantic versioning.
2. Update `CHANGELOG.md` if applicable.
3. Tag the release: `git tag -a v<version> -m "Release <version>"`.
4. Verify release tag signature/trust settings if signing is enabled.
5. Push changes and tag: `git push && git push --tags`.
6. Create and publish the GitHub release with changelog notes.

## Post-Release

- [ ] Confirm application health (`/health`) responds with `ok: true` in staging and production.
- [ ] Monitor logs for errors or unexpected regressions.
- [ ] Validate any new metrics, feature flags, or behaviour changes.

## Rollback Procedure

1. Identify the last stable release tag (e.g. `v1.2.3`).
2. Revert the deployment to that tag via the platform or CI pipeline.
3. Confirm health endpoint returns `ok: true` after rollback.
4. Open a post-mortem issue to capture root cause and prevention steps.
