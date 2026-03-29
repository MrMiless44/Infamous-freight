#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_PATH="${1:-$ROOT_DIR/fly.api.toml}"

if command -v flyctl >/dev/null 2>&1; then
  FLYCTL_BIN="flyctl"
elif [ -x "/home/vscode/.fly/bin/flyctl" ]; then
  FLYCTL_BIN="/home/vscode/.fly/bin/flyctl"
else
  echo "ERROR: flyctl not found."
  exit 1
fi

TARGET_APP="${FLY_APP:-$(awk -F'=' '/^[[:space:]]*app[[:space:]]*=/{gsub(/[[:space:]\047\042]/, "", $2); print $2; exit}' "$CONFIG_PATH")}"

bash "$ROOT_DIR/scripts/fly-preflight.sh" "$CONFIG_PATH"

echo "Deploying API app '$TARGET_APP' using $CONFIG_PATH"
exec "$FLYCTL_BIN" deploy -c "$CONFIG_PATH" --app "$TARGET_APP"
