# Release Discipline

This document defines the standard pre-release validation, environment checks, and deployment procedures for **Infamous Freight**.

---

## Release Checklist

Run through every step in order before cutting a release tag.

### 1. Pre-Release Validation

- [ ] All CI checks are green on `main` (CI, CodeQL, Security Audit).
- [ ] No open high/critical security alerts in the GitHub Security tab.
- [ ] Dependency audit passes: `pnpm audit --audit-level=high`.
- [ ] All tests pass locally: `pnpm test`.
- [ ] Typecheck passes: `pnpm typecheck`.
- [ ] Lint passes: `pnpm lint`.
- [ ] Build succeeds: `pnpm build`.

### 2. Environment Verification

- [ ] `.env.example` is up-to-date — every variable used in code has an entry.
- [ ] No secrets are committed to source control (`git log --all -S 'SECRET'`).
- [ ] Database migrations have been reviewed and a rollback path documented.
- [ ] Feature flags for the release are configured correctly in each target environment.

### 3. Smoke Test

Run the smoke test against staging before promoting to production:

```bash
API_URL=https://staging.api.infamous-freight.com bash scripts/smoke.sh
```

Or locally with Make:

```bash
make smoke
```

A passing smoke test (`HTTP 200` from `/health`) is a hard requirement before production deployment.

### 4. Tagging

Tags follow [Semantic Versioning](https://semver.org/) (`vMAJOR.MINOR.PATCH`).

```bash
# Ensure you are on an up-to-date main branch
git checkout main && git pull

# Create an annotated tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

Pushing the tag triggers the `release.yml` workflow which builds artifacts and publishes the GitHub Release.

### 5. Post-Release Verification

- [ ] GitHub Release page shows the correct version and release notes.
- [ ] Staging deployment completed without errors.
- [ ] Production deployment completed without errors.
- [ ] Smoke test passes against production: `API_URL=https://api.infamous-freight.com bash scripts/smoke.sh`.
- [ ] Error-rate dashboards show no anomalies for 15 minutes post-deploy.

---

## Rollback Procedure

If a deployment must be reverted:

1. Identify the last stable tag: `git tag --sort=-version:refname | head -5`.
2. Re-deploy that tag through the `deploy-api.yml` / `deploy-web.yml` workflows with the target tag.
3. If a database migration was applied, run the rollback migration before re-deploying the old code.
4. Re-run the smoke test to confirm service is healthy.

---

## Environment Tiers

| Tier        | Branch / Tag     | Deployment           | Auto-deploy? |
|-------------|-----------------|----------------------|-------------|
| Development | feature branches | local `docker compose` | No           |
| Staging     | `main`           | Fly.io (staging app) | Yes (CI)    |
| Production  | `v*` tags        | Fly.io (prod app)    | Yes (tag)   |

---

## Related Documents

- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)
- [Security Hardening](./SECURITY_HARDENING.md)
- [API Reference](./API_REFERENCE.md)
