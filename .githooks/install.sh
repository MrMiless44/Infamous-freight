#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

current_hooks_path="$(git config --get core.hooksPath || true)"
if [ -n "${current_hooks_path}" ] && [ "${current_hooks_path}" != ".githooks" ]; then
  echo "ERROR: git core.hooksPath is already set to '${current_hooks_path}'." >&2
  echo "Refusing to overwrite existing hooksPath. Please update or unset it explicitly if you want to use .githooks." >&2
  echo "Hint: run 'git config --unset core.hooksPath' or 'git config core.hooksPath .githooks' manually if you intend to migrate." >&2
  exit 1
fi
git config core.hooksPath .githooks

chmod +x \
  .githooks/pre-commit \
  .githooks/pre-commit-docs \
  .githooks/pre-push \
  .githooks/commit-msg \
  .githooks/install.sh

echo "✅ Git hooks installed from .githooks"
echo "core.hooksPath=$(git config core.hooksPath)"
