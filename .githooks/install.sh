#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

git config core.hooksPath .githooks

chmod +x \
  .githooks/pre-commit \
  .githooks/pre-commit-docs \
  .githooks/pre-push \
  .githooks/commit-msg \
  .githooks/install.sh

echo "✅ Git hooks installed from .githooks"
echo "core.hooksPath=$(git config core.hooksPath)"
