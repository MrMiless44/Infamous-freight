# Rollback Procedure

Owner: Platform Engineer Last Reviewed: 2026-04-11 Next Review Due: 2026-07-11

If a production deployment fails:

1. Freeze further deployments and announce incident channel.

2. Identify the last stable release tag.

Example:

```bash
git tag
```

3. Redeploy the previous version.

Example:

```bash
git checkout v1.2.3
flyctl deploy -c fly.toml -a infamous-freight-db --remote-only --depot=false
```

4. Restore database snapshot only if schema migration caused the failure.

5. Verify:

- API health endpoint
- load board functionality
- shipment tracking
- auth system

6. Run smoke check after rollback:

```bash
bash scripts/release-smoke-check.sh
```

7. Monitor logs and error rates for at least 30 minutes before closing incident.
