#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

bash scripts/bootstrap-runtime.sh

if [[ -f ".env.example" && ! -f ".env" ]]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
fi

echo "==> Installing dependencies (frozen lockfile)"
pnpm install --frozen-lockfile

echo "==> Running workspace hygiene checks"
pnpm run check:repo

echo "==> Building shared package and workspaces"
pnpm run build

echo
cat <<'MSG'
Bootstrap complete.

Next commands:
  pnpm run lint
  pnpm run typecheck
  pnpm run test
MSG
