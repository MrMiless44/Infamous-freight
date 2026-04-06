#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "NVM is required but was not found at $NVM_DIR/nvm.sh" >&2
  exit 1
fi

# shellcheck disable=SC1090
. "$NVM_DIR/nvm.sh"

nvm install >/dev/null
nvm use >/dev/null

corepack enable >/dev/null 2>&1
corepack prepare pnpm@10.15.0 --activate >/dev/null 2>&1

node_version="$(node -v)"
pnpm_version="$(pnpm -v)"

echo "Runtime ready: node ${node_version}, pnpm ${pnpm_version}"
