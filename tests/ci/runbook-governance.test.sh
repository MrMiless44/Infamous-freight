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

assert_regex() {
  local description="$1"
  local haystack="$2"
  local regex="$3"
  if printf '%s' "$haystack" | grep -Eq -- "$regex"; then
    pass "$description"
  else
    fail "$description (expected regex '$regex')"
  fi
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RELEASE_FLOW_DOC="$ROOT_DIR/docs/operations/release-flow.md"
ROLLBACK_DOC="$ROOT_DIR/docs/operations/rollback.md"
SECURITY_GOVERNANCE_DOC="$ROOT_DIR/docs/operations/security-governance.md"

echo "=== Runbook governance checks ==="

for file in "$RELEASE_FLOW_DOC" "$ROLLBACK_DOC" "$SECURITY_GOVERNANCE_DOC"; do
  if [ -f "$file" ]; then
    pass "runbook exists: $file"
  else
    fail "runbook exists: $file"
  fi
done

RELEASE_CONTENT="$(cat "$RELEASE_FLOW_DOC")"
ROLLBACK_CONTENT="$(cat "$ROLLBACK_DOC")"
SECURITY_CONTENT="$(cat "$SECURITY_GOVERNANCE_DOC")"

for content_name in RELEASE_CONTENT ROLLBACK_CONTENT SECURITY_CONTENT; do
  content_value="${!content_name}"
  assert_regex "$content_name includes Owner" "$content_value" 'Owner: .+'
  assert_regex "$content_name includes Last Reviewed" "$content_value" 'Last Reviewed: [0-9]{4}-[0-9]{2}-[0-9]{2}'
  assert_regex "$content_name includes Next Review Due" "$content_value" 'Next Review Due: [0-9]{4}-[0-9]{2}-[0-9]{2}'
done

assert_contains "release flow has Release Checklist" "$RELEASE_CONTENT" '## Release Checklist'
assert_contains "release flow has Monitoring Window" "$RELEASE_CONTENT" '## Monitoring Window'
assert_contains "rollback runbook includes smoke check" "$ROLLBACK_CONTENT" 'scripts/release-smoke-check.sh'
assert_contains "security governance has Rotation Cadence" "$SECURITY_CONTENT" '## Rotation Cadence'
assert_contains "security governance has Offboarding Controls" "$SECURITY_CONTENT" '## Offboarding Controls'

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL ($FAIL failed, $PASS passed)"
  exit 1
fi

echo ""
echo "RESULT: PASS ($PASS checks passed)"
