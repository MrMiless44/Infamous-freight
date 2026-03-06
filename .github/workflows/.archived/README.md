# Archived Workflows

These workflows were archived during CI/CD normalization to remove duplicate or overlapping responsibilities.

## Canonical active workflows

- `ci.yml`
- `deploy.yml`
- `codeql.yml`
- `security.yml`

## Why archive old workflows?

The repository accumulated multiple files with overlapping responsibilities, including:
- CI/test duplicates
- deploy duplicates
- mixed-purpose security workflows
- environment-specific pipelines that overlapped with canonical workflows

This caused:
- duplicate runs
- confusing branch protection checks
- wasted GitHub Actions minutes
- harder debugging

## Rule of thumb

If a workflow duplicates CI, deploy, or security responsibilities already handled by the canonical set, archive it here instead of reintroducing overlap.
