#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

printf 'Running release smoke checks\n'
printf 'API_URL=%s\n' "$API_URL"
printf 'WEB_URL=%s\n' "$WEB_URL"

curl -fsS "$API_URL/health" >/dev/null
curl -fsS "$WEB_URL" >/dev/null

echo "Smoke checks passed."
