#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0

pass() {
  echo "  PASS: $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "  FAIL: $1"
  FAIL=$((FAIL + 1))
}

assert_eq() {
  local description="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    pass "$description"
  else
    fail "$description (expected='$expected', got='$actual')"
  fi
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ROOT_PACKAGE_JSON="$ROOT_DIR/package.json"
FLY_DEPLOY_YML="$ROOT_DIR/.github/workflows/fly-deploy.yml"

echo "=== Toolchain consistency checks ==="

if [ ! -f "$ROOT_PACKAGE_JSON" ]; then
  echo "Missing root package.json"
  exit 1
fi

if [ ! -f "$FLY_DEPLOY_YML" ]; then
  echo "Missing .github/workflows/fly-deploy.yml"
  exit 1
fi

package_manager=$(jq -r '.packageManager // ""' "$ROOT_PACKAGE_JSON")
if [ -z "$package_manager" ] || [ "$package_manager" = "null" ]; then
  echo "packageManager is missing in root package.json"
  exit 1
fi

pnpm_expected=$(printf '%s\n' "$package_manager" | sed -n 's/^pnpm@\([0-9][0-9.]*\)$/\1/p')
if [ -z "$pnpm_expected" ]; then
  echo "Expected packageManager to be pnpm@<version>, got '$package_manager'"
  exit 1
fi

pnpm_declared=$(awk '
  /uses:[[:space:]]*pnpm\/action-setup@/ { in_setup=1; next }
  in_setup && /version:/ {
    gsub(/"/, "", $2)
    print $2
    exit
  }
' "$FLY_DEPLOY_YML")

if [ -z "$pnpm_declared" ]; then
  echo "Unable to find pnpm/action-setup version in fly-deploy.yml"
  exit 1
fi

assert_eq "root packageManager uses pnpm" "true" "$([ -n "$pnpm_expected" ] && echo true || echo false)"
assert_eq "fly-deploy pnpm version matches root packageManager" "$pnpm_expected" "$pnpm_declared"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL ($FAIL failed, $PASS passed)"
  exit 1
fi

echo ""
echo "RESULT: PASS ($PASS checks passed)"
