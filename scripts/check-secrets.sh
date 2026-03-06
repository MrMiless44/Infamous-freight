#!/usr/bin/env bash
set -euo pipefail

echo "Scanning repository for obvious hardcoded secrets..."

PATTERNS=(
  "AKIA[0-9A-Z]{16}"
  "AIza[0-9A-Za-z\-_]{35}"
  "ghp_[0-9A-Za-z]{36,}"
  "github_pat_[0-9A-Za-z_]{20,}"
  "sk_live_[0-9A-Za-z]+"
  "-----BEGIN (RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----"
  "postgres(ql)?:\/\/[A-Za-z0-9._%+-]+:[^[:space:]@]+@"
  "redis:\/\/:[^[:space:]]+@"
  "FLY_API_TOKEN[[:space:]]*=[[:space:]]*[^[:space:]]+"
  "SENTRY_DSN=.*https?:\/\/"
)

EXCLUDES=(
  --exclude-dir=node_modules
  --exclude-dir=.git
  --exclude-dir=dist
  --exclude-dir=coverage
  --exclude=.env.example
  --exclude=package-lock.json
  --exclude=pnpm-lock.yaml
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  if grep -RInE "${pattern}" . "${EXCLUDES[@]}" >/dev/null 2>&1; then
    echo ""
    echo "Potential secret match for pattern: ${pattern}"
    grep -RInE "${pattern}" . "${EXCLUDES[@]}" || true
    FOUND=1
  fi
done

if [ "${FOUND}" -eq 1 ]; then
  echo ""
  echo "Secret scan failed. Remove hardcoded secrets before commit."
  exit 1
fi

echo "Secret scan passed."
