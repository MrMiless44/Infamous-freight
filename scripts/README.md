# Scripts

This folder contains operational and tooling automation. For day-to-day local engineering, use the scripts below.

## Core local scripts

- `scripts/bootstrap-runtime.sh`
  - Initializes Node/pnpm exactly as the repo expects (`nvm install`, `nvm use`, `pnpm@10.15.0`).
- `scripts/setup.sh`
  - Deterministic bootstrap: runtime setup, frozen-lockfile install, repository audit, then build.
- `scripts/repo-audit.sh`
  - Fast repo hygiene checks (workspace guardrails, lockfile policy, tracked artifacts, required scripts).
- `scripts/validate-local.sh`
  - Full validation sequence: build, typecheck, lint, test.

## Deployment and release scripts

- `scripts/fly-preflight.sh`
- `scripts/fly-deploy-api.sh`
- `scripts/release-smoke-check.sh`
- `scripts/deploy-work-branch.sh`

These are environment-specific and should be run only when deployment prerequisites are configured.

## Recommended usage

From repository root:

```bash
pnpm run bootstrap   # Full deterministic setup
pnpm run check:repo  # Fast hygiene checks
pnpm run validate    # Strong local validation
```
