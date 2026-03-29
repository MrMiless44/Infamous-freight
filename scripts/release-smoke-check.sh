#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
API_STATUS_URL="${API_STATUS_URL:-$API_URL/api/status}"
SMOKE_AUTH_URL="${SMOKE_AUTH_URL:-}"
SMOKE_AUTH_BEARER_TOKEN="${SMOKE_AUTH_BEARER_TOKEN:-}"
REQUIRE_WORKER_HEARTBEAT="${REQUIRE_WORKER_HEARTBEAT:-false}"

SMOKE_MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-5}"
SMOKE_RETRY_DELAY="${SMOKE_RETRY_DELAY:-2}"

curl_with_retry() {
  local url="$1"
  local attempt=1

  while true; do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi

    if (( attempt >= SMOKE_MAX_ATTEMPTS )); then
      echo "Request to ${url} failed after ${SMOKE_MAX_ATTEMPTS} attempts." >&2
      return 1
    fi

    echo "Request to ${url} failed (attempt ${attempt}/${SMOKE_MAX_ATTEMPTS}), retrying in ${SMOKE_RETRY_DELAY}s..." >&2
    sleep "${SMOKE_RETRY_DELAY}"
    ((attempt++))
  done
}

fetch_json_with_retry() {
  local url="$1"
  local headers=()

  if [ -n "$SMOKE_AUTH_BEARER_TOKEN" ]; then
    headers=(-H "Authorization: Bearer ${SMOKE_AUTH_BEARER_TOKEN}")
  fi

  local attempt=1
  while true; do
    if response="$(curl -fsS "${headers[@]}" "$url")"; then
      printf '%s' "$response"
      return 0
    fi

    if (( attempt >= SMOKE_MAX_ATTEMPTS )); then
      echo "Request to ${url} failed after ${SMOKE_MAX_ATTEMPTS} attempts." >&2
      return 1
    fi

    echo "Request to ${url} failed (attempt ${attempt}/${SMOKE_MAX_ATTEMPTS}), retrying in ${SMOKE_RETRY_DELAY}s..." >&2
    sleep "${SMOKE_RETRY_DELAY}"
    ((attempt++))
  done
}

printf 'Running release smoke checks\n'
printf 'API_URL=%s\n' "$API_URL"
printf 'API_STATUS_URL=%s\n' "$API_STATUS_URL"
printf 'WEB_URL=%s\n' "$WEB_URL"

curl_with_retry "$API_URL/health"
status_payload="$(fetch_json_with_retry "$API_STATUS_URL")"

printf '%s' "$status_payload" | jq -e '.ok == true' >/dev/null

if [ "$REQUIRE_WORKER_HEARTBEAT" = "true" ]; then
  printf '%s' "$status_payload" | jq -e '.worker.heartbeat != null' >/dev/null
fi

curl_with_retry "$WEB_URL"

if [ -n "$SMOKE_AUTH_URL" ]; then
  if [ -z "$SMOKE_AUTH_BEARER_TOKEN" ]; then
    echo "SMOKE_AUTH_URL was provided but SMOKE_AUTH_BEARER_TOKEN is empty." >&2
    exit 1
  fi

  fetch_json_with_retry "$SMOKE_AUTH_URL" >/dev/null
fi

echo "Smoke checks passed."
