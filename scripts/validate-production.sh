#!/usr/bin/env bash
set -euo pipefail

APP="${FLY_APP:-infamous-freight}"
HOST="${HOST:-www.infamousfreight.com}"

log_section() {
  printf '\n== %s ==\n' "$1"
}

log_section "Runtime"
node -v
pnpm -v

log_section "Required CLIs"
command -v flyctl >/dev/null || { echo "flyctl missing" >&2; exit 127; }
command -v curl >/dev/null || { echo "curl missing" >&2; exit 127; }
if ! command -v dig >/dev/null 2>&1; then
  echo "dig missing; DNS detail check skipped"
fi

log_section "Repo checks"
pnpm install --frozen-lockfile
pnpm run build
pnpm -C apps/api run test -- production-smoke-test-script.test.ts

log_section "Fly checks"
flyctl status -a "$APP"
flyctl logs -a "$APP" --no-tail | tail -100
flyctl certs check "$HOST" -a "$APP"
flyctl checks list -a "$APP" || echo "flyctl checks list unavailable; continuing"
flyctl ips list -a "$APP" || echo "flyctl ips list unavailable; continuing"

log_section "DNS checks"
if command -v dig >/dev/null 2>&1; then
  dig +short "$HOST" || true
  dig +short "$APP.fly.dev" || true
fi

log_section "HTTP health"
curl --fail --show-error --silent --max-time 15 "https://$HOST/health"
printf '\n'
curl --fail --show-error --silent --max-time 15 "https://$HOST/api/health"
printf '\n'
curl --fail --show-error --silent --max-time 15 "https://$APP.fly.dev/health"
printf '\n'
curl --fail --show-error --silent --max-time 15 "https://$APP.fly.dev/api/health"
printf '\n'

echo "PASS: production validation complete"
