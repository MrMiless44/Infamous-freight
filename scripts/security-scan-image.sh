#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE="${IMAGE:-dhi.io/github-mcp:0}"
REGISTRY="${REGISTRY:-dhi.io}"
VEX_FILE="${VEX_FILE:-vex.json}"

echo "==> Target image: ${IMAGE}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found, skipping Docker-based scans."
  exit 0
fi

if [ -n "${DOCKER_USERNAME:-}" ] && [ -n "${DOCKER_PASSWORD:-}" ]; then
  echo "==> Logging into registry (${REGISTRY}) with provided credentials"
  printf '%s' "${DOCKER_PASSWORD}" | docker login "${REGISTRY}" --username "${DOCKER_USERNAME}" --password-stdin
else
  echo "==> No Docker credentials provided; skipping registry login and continuing"
fi

echo "==> Pulling image"
docker pull "${IMAGE}"

echo "==> Docker Scout scan"
docker scout cves "${IMAGE}"

echo "==> Trivy scan"
if command -v trivy >/dev/null 2>&1; then
  trivy image --scanners vuln --vex repo "${IMAGE}"
else
  echo "Trivy not installed, skipping"
fi

echo "==> Grype scan"
if command -v grype >/dev/null 2>&1; then
  if [ -f "${VEX_FILE}" ]; then
    grype "${IMAGE}" --vex "${VEX_FILE}"
  else
    echo "${VEX_FILE} not found, running Grype without VEX file"
    grype "${IMAGE}"
  fi
else
  echo "Grype not installed, skipping"
fi

echo "==> Done"
