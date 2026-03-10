# Release Checklist

## Pre-Release
- [ ] Pass all CI checks: typecheck, lint, build, audit, test.
- [ ] Verify environment variable changes:
  - `DATABASE_URL`
  - `REDIS_URL`
- [ ] Review workflow and dependency changes for security impact.
- [ ] Verify the rollback target before release.
- [ ] Confirm database migration plan and rollback path.

## Release Process
1. Increment the version in `package.json` using semantic versioning.
2. Tag the release:
   `git tag -a v<version> -m "Release <version>"`
3. Push commits and tags:
   `git push && git push --tags`
4. Generate or update the changelog.
5. Publish the release with migration notes and rollback notes.

## Post-Release
- [ ] Confirm application health at `/health` in staging and production.
- [ ] Monitor logs for errors or regressions.
- [ ] Validate expected metrics and behavior changes.
- [ ] Confirm alerts, dashboards, and error tracking remain healthy.
