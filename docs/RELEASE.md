# Release Checklist

## Pre-Release

- [ ] Pass all CI checks: typecheck, lint, build, audit, test.
- [ ] Verify environment variable changes:
  - `DATABASE_URL`
  - `REDIS_URL`
- [ ] Review changes to workflows or dependencies for security.
- [ ] Verify rollback target before release.

## Release Process

1. Increment the version in `package.json` using semantic versioning.
2. Tag the release: `git tag -a v<version> -m "Release <version>"`.
3. Push changes: `git push && git push --tags`.
4. Publish release and changelog:
   - Generate changelog (e.g. `scripts/changelog.sh` if available, or create one manually).
   - Include full migration and rollback notes.

## Post-Release

- [ ] Confirm application health (`/health`) in staging and production.
- [ ] Monitor logs for errors or regressions.
- [ ] Validate new metrics or changes in behavior.
