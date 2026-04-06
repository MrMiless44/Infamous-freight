#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

bash scripts/bootstrap-runtime.sh

echo "==> Repository hygiene"
pnpm run check:repo

echo "==> Building"
pnpm run build

echo "==> Typechecking"
pnpm run typecheck

echo "==> Linting"
pnpm run lint

echo "==> Testing"
pnpm run test

echo "All local validation checks passed."
