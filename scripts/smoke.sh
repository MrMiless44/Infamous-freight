#!/usr/bin/env bash
# scripts/smoke.sh — Validate the API /health endpoint.
# Usage: bash scripts/smoke.sh [BASE_URL]
# Defaults to http://localhost:4000 when BASE_URL is not supplied.

set -euo pipefail

BASE_URL="${1:-${API_URL:-http://localhost:4000}}"
ENDPOINT="${BASE_URL}/health"
MAX_RETRIES=5
RETRY_DELAY=3

echo "Smoke test: GET ${ENDPOINT}"

for attempt in $(seq 1 "${MAX_RETRIES}"); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${ENDPOINT}" || true)

  if [ "${HTTP_CODE}" = "200" ]; then
    echo "✅  /health returned HTTP ${HTTP_CODE} (attempt ${attempt}/${MAX_RETRIES})"
    exit 0
  fi

  echo "⚠️  Attempt ${attempt}/${MAX_RETRIES}: HTTP ${HTTP_CODE} — retrying in ${RETRY_DELAY}s..."
  sleep "${RETRY_DELAY}"
done

echo "❌  Smoke test FAILED: /health did not return 200 after ${MAX_RETRIES} attempts."
exit 1
