# AGENTS.md

## Environment setup (required before install/build)
For this repository, always initialize the runtime in each new shell session before running `pnpm install` or any `pnpm ... build` command:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.15.0 --activate
node -v
pnpm -v
```

Expected versions:
- `node -v` => `v24.x`
- `pnpm -v` => `10.x` (currently `10.15.0`)

## Sentry integration conventions (Codex persistence)
- Keep the existing pnpm workspace tooling (`pnpm`, Node 24, pnpm 10) for dependency and script changes; do not switch package managers.
- Preserve repository runtime conventions: TypeScript + ESM in `apps/api` (`.ts` files, `import` syntax).
- Sentry DSN must be environment-configured via `SENTRY_DSN` (fallback in code is acceptable, but environment variable should be the primary source).
- Keep Sentry initialization in `apps/api/src/instrument.ts` and import it as the very first import in `apps/api/src/server.ts`.
- For Express error capture, keep Sentry exception capture middleware after route registration and before custom error middleware.
- Verify Sentry safely in non-production using `GET /debug/sentry`, which calls `Sentry.captureException(...)`.
