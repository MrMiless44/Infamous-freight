#!/usr/bin/env bash
set -Eeuo pipefail

REGISTRY="${1:-dhi.io}"
IMAGE="${2:-dhi.io/github-mcp:0}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for registry login, pull, and scout CVE scan." >&2
  echo "Install Docker on Ubuntu with: bash scripts/install-docker-ubuntu.sh" >&2
  exit 1
fi

if ! docker scout --help >/dev/null 2>&1; then
  echo "Docker Scout is required but not available in this Docker installation." >&2
  echo "Reinstall Docker with Docker's official packages (includes Scout plugin)." >&2
  exit 1
fi

echo "==> Logging into ${REGISTRY}"
docker login "${REGISTRY}"

echo "==> Pulling ${IMAGE}"
docker pull "${IMAGE}"

echo "==> Running Docker Scout CVE scan for ${IMAGE}"
docker scout cves "${IMAGE}"
