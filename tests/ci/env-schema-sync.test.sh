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
ENV_SCHEMA="$ROOT_DIR/apps/api/src/config/env.ts"
DEV_TEMPLATE="$ROOT_DIR/apps/api/.env.example"
PROD_TEMPLATE="$ROOT_DIR/apps/api/.env.production.example"

if [ ! -f "$ENV_SCHEMA" ]; then
  echo "Missing env schema file: $ENV_SCHEMA"
  exit 1
fi

if [ ! -f "$DEV_TEMPLATE" ]; then
  echo "Missing template file: $DEV_TEMPLATE"
  exit 1
fi

if [ ! -f "$PROD_TEMPLATE" ]; then
  echo "Missing template file: $PROD_TEMPLATE"
  exit 1
fi

echo "=== API env schema/template drift checks ==="

schema_keys=$(sed -n '/\.object({/,/^  })/p' "$ENV_SCHEMA" \
  | grep -E '^[[:space:]]*[A-Z][A-Z0-9_]*:' \
  | sed -E 's/^[[:space:]]*([A-Z][A-Z0-9_]*):.*/\1/' \
  | sort -u)

if [ -z "$schema_keys" ]; then
  echo "Unable to extract schema keys from $ENV_SCHEMA"
  exit 1
fi

template_keys() {
  local file="$1"
  grep -E '^[A-Z][A-Z0-9_]*=' "$file" | sed -E 's/=.*$//' | sort -u
}

dev_keys=$(template_keys "$DEV_TEMPLATE")
prod_keys=$(template_keys "$PROD_TEMPLATE")

missing_in_dev=$(comm -23 <(printf '%s\n' "$schema_keys") <(printf '%s\n' "$dev_keys") || true)
missing_in_prod=$(comm -23 <(printf '%s\n' "$schema_keys") <(printf '%s\n' "$prod_keys") || true)

if [ -n "$missing_in_dev" ]; then
  fail "apps/api/.env.example is missing schema keys"
  printf '%s\n' "$missing_in_dev" | sed 's/^/    - /'
else
  pass "apps/api/.env.example includes all schema keys"
fi

if [ -n "$missing_in_prod" ]; then
  fail "apps/api/.env.production.example is missing schema keys"
  printf '%s\n' "$missing_in_prod" | sed 's/^/    - /'
else
  pass "apps/api/.env.production.example includes all schema keys"
fi

schema_count=$(printf '%s\n' "$schema_keys" | sed '/^$/d' | wc -l | tr -d ' ')
dev_count=$(printf '%s\n' "$dev_keys" | sed '/^$/d' | wc -l | tr -d ' ')
prod_count=$(printf '%s\n' "$prod_keys" | sed '/^$/d' | wc -l | tr -d ' ')

assert_eq "schema key count is non-zero" "true" "$([ "$schema_count" -gt 0 ] && echo true || echo false)"
pass "Schema keys discovered: $schema_count"
pass "Dev template keys discovered: $dev_count"
pass "Prod template keys discovered: $prod_count"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL ($FAIL failed, $PASS passed)"
  exit 1
fi

echo ""
echo "RESULT: PASS ($PASS checks passed)"
