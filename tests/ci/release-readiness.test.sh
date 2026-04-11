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

assert_contains() {
  local description="$1"
  local haystack="$2"
  local needle="$3"
  if printf '%s' "$haystack" | grep -qF -- "$needle"; then
    pass "$description"
  else
    fail "$description (expected to contain '$needle')"
  fi
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CI_WORKFLOW="$ROOT_DIR/.github/workflows/ci.yml"
SECURITY_WORKFLOW="$ROOT_DIR/.github/workflows/security.yml"
RELEASE_FLOW_DOC="$ROOT_DIR/docs/operations/release-flow.md"
ROLLBACK_DOC="$ROOT_DIR/docs/operations/rollback.md"
SMOKE_SCRIPT="$ROOT_DIR/scripts/release-smoke-check.sh"
ENV_SYNC_SCRIPT="$ROOT_DIR/tests/ci/env-schema-sync.test.sh"
TOOLCHAIN_SCRIPT="$ROOT_DIR/tests/ci/toolchain-consistency.test.sh"
RUNBOOK_GOVERNANCE_SCRIPT="$ROOT_DIR/tests/ci/runbook-governance.test.sh"

echo "=== Release readiness checks ==="

for required_file in \
  "$CI_WORKFLOW" \
  "$SECURITY_WORKFLOW" \
  "$RELEASE_FLOW_DOC" \
  "$ROLLBACK_DOC" \
  "$SMOKE_SCRIPT" \
  "$ENV_SYNC_SCRIPT" \
  "$TOOLCHAIN_SCRIPT" \
  "$RUNBOOK_GOVERNANCE_SCRIPT"; do
  assert_eq "required file exists: $required_file" "true" "$([ -f "$required_file" ] && echo true || echo false)"
done

CI_CONTENT="$(cat "$CI_WORKFLOW")"
SECURITY_CONTENT="$(cat "$SECURITY_WORKFLOW")"
RELEASE_FLOW_CONTENT="$(cat "$RELEASE_FLOW_DOC")"
ROLLBACK_CONTENT="$(cat "$ROLLBACK_DOC")"

assert_contains "ci workflow has lint job" "$CI_CONTENT" 'name: lint'
assert_contains "ci workflow has typecheck job" "$CI_CONTENT" 'name: typecheck'
assert_contains "ci workflow has test job" "$CI_CONTENT" 'name: test'
assert_contains "ci workflow has build job" "$CI_CONTENT" 'name: build'
assert_contains "ci workflow runs fly config test" "$CI_CONTENT" 'tests/ci/fly-config.test.sh'
assert_contains "ci workflow runs release readiness test" "$CI_CONTENT" 'tests/ci/release-readiness.test.sh'

assert_contains "security workflow has gitleaks scan" "$SECURITY_CONTENT" 'gitleaks/gitleaks-action@v2'
assert_contains "security workflow has dependency audit" "$SECURITY_CONTENT" 'Dependency Audit'

assert_contains "release flow documents staging" "$RELEASE_FLOW_CONTENT" 'staging deploy'
assert_contains "release flow documents monitoring window" "$RELEASE_FLOW_CONTENT" 'monitoring window'
assert_contains "rollback doc references fly deploy" "$ROLLBACK_CONTENT" 'flyctl deploy -c fly.toml'
assert_contains "rollback doc contains verification checklist" "$ROLLBACK_CONTENT" 'Verify'

if bash "$ENV_SYNC_SCRIPT" >/dev/null; then
  pass "env schema sync script passes"
else
  fail "env schema sync script should pass"
fi

if bash "$TOOLCHAIN_SCRIPT" >/dev/null; then
  pass "toolchain consistency script passes"
else
  fail "toolchain consistency script should pass"
fi

if bash "$RUNBOOK_GOVERNANCE_SCRIPT" >/dev/null; then
  pass "runbook governance script passes"
else
  fail "runbook governance script should pass"
fi

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL ($FAIL failed, $PASS passed)"
  exit 1
fi

echo ""
echo "RESULT: PASS ($PASS checks passed)"
