# Infamous Freight Release Control Board — 2026-05-14

## Decision

**Private beta only. Do not approve paid beta or public launch until every release gate below is closed and verified.**

This board converts the launch-readiness recommendations into executable GitHub blockers.

## Current blocker issues

| Issue | Gate | Status |
|---|---|---|
| #1 | Verify Fly direct API health before paid beta | Open |
| #2 | Confirm production database migration status | Open |
| #3 | Confirm Stripe mode and webhook verification | Open |
| #4 | Complete manual auth, freight workflow, backup, and security tests | Open |
| #5 | Verify deployment workflow file and CI evidence mismatch | Open |

## Release gates

### Gate 1 — API health

Required proof:

```bash
flyctl status
flyctl logs
curl --fail --show-error --silent --max-time 15 https://infamous-freight.fly.dev/health
curl --fail --show-error --silent --max-time 15 https://infamous-freight.fly.dev/api/health
pnpm run production:smoke-test
```

Pass condition:

- Direct Fly health passes.
- Proxied API health passes.
- Smoke test passes from a machine with working DNS.

### Gate 2 — Database / Prisma

Required proof:

```bash
pnpm run prisma:generate
pnpm -C apps/api exec prisma migrate status --schema prisma/schema.prisma
```

Pass condition:

- Production database target is confirmed.
- No pending or failed migrations remain.
- Migration status is recorded in `docs/LAUNCH_EVIDENCE_LOG.md`.

### Gate 3 — Stripe / billing

Required proof:

```bash
flyctl secrets list
```

Then verify in Stripe Dashboard and run the project webhook verification matrix.

Pass condition:

- Intended Stripe mode is confirmed.
- Webhook signing secret is configured in production runtime.
- Duplicate webhook replay is idempotent.
- Failed payment does not grant access.
- App payment state matches Stripe state.

### Gate 4 — Manual user and freight workflows

Required proof:

- Signup.
- Login.
- Logout.
- Password reset.
- Unauthorized API rejection.
- Create test load or shipment.
- Assign test operator/driver.
- Update status lifecycle.
- Upload/download test document.
- Close test shipment/load.
- Delete or clean up test data.

Pass condition:

- Full test completed with disposable test data only.
- Evidence recorded in `docs/LAUNCH_EVIDENCE_LOG.md`.

### Gate 5 — Backup and security

Required proof:

- Automated backup exists.
- Latest backup restored to non-production database.
- Restore time recorded.
- Basic row-count or app sanity proof recorded.
- No secrets visible in frontend bundle/network responses.
- Role-based access manually verified.
- Rate limits verified or explicitly accepted as a private-beta risk.

Pass condition:

- Restore proof exists before any paid beta.
- Manual security checks are recorded.

### Gate 6 — Deployment workflow evidence

Required proof:

- Confirm actual Fly deploy workflow path.
- If `.github/workflows/deploy-fly.yml` is missing or renamed, update docs/runbooks.
- Confirm successful deploy run.
- Confirm smoke test runs after successful deploy.

Pass condition:

- Repo docs match actual CI/CD workflow paths.
- No stale launch-evidence claims remain.

## Daily execution loop

Run this until all gates close:

```bash
git fetch origin
git status
pnpm install --frozen-lockfile
pnpm run production:preflight
pnpm run production:smoke-test
pnpm run validate
pnpm run build
pnpm run test
```

## Paid beta approval rule

Paid beta is approved only when:

- Issues #1 through #5 are closed with proof.
- `docs/LAUNCH_EVIDENCE_LOG.md` contains fresh evidence.
- Smoke test passes.
- Stripe mode and webhooks are verified.
- Database migration status is verified.
- Manual user/freight workflows are verified.
- Backup restore proof exists.

## Fallback path

If direct Fly health remains unstable, choose one path and update the smoke tests accordingly:

1. Make Fly public direct health pass; or
2. Officially declare proxy-only architecture and remove direct Fly checks from smoke tests; or
3. Temporarily move API to another verified host and update all production env references.

Do not leave the repo in a mixed state where users rely on one API path while CI checks another.
