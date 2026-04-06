#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

failures=0
warnings=0

pass() {
  printf '✅ %s\n' "$1"
}

warn() {
  warnings=$((warnings + 1))
  printf '⚠️  %s\n' "$1"
}

fail() {
  failures=$((failures + 1))
  printf '❌ %s\n' "$1"
}

section() {
  printf '\n==> %s\n' "$1"
}

section "Runtime and workspace guardrails"
if [[ -f .node-version ]]; then
  pass ".node-version present"
else
  fail "Missing .node-version"
fi

if [[ -f pnpm-lock.yaml ]]; then
  pass "pnpm-lock.yaml present"
else
  fail "Missing pnpm-lock.yaml"
fi

if [[ -f pnpm-workspace.yaml ]]; then
  pass "pnpm-workspace.yaml present"
else
  fail "Missing pnpm-workspace.yaml"
fi

if [[ -f package-lock.json ]] || compgen -G "**/package-lock.json" >/dev/null; then
  fail "Found npm lockfile(s); repo requires pnpm lockfile only"
else
  pass "No npm lockfiles found"
fi

section "Tracked artifact hygiene"
if git ls-files | grep -E -q '/node_modules/'; then
  fail "Tracked node_modules directories detected"
else
  pass "No tracked node_modules directories"
fi

if git ls-files | grep -E -q '\.env$|\.env\.[^/]+$'; then
  fail "Tracked .env files detected"
else
  pass "No tracked .env files"
fi

section "Workspace package.json consistency"
workspace_list="$(node -e 'const fs=require("fs");const yaml=fs.readFileSync("pnpm-workspace.yaml","utf8");const matches=[...yaml.matchAll(/-\s+"([^"]+)"/g)].map((m)=>m[1]);process.stdout.write(matches.join("\n"));')"

if [[ -z "$workspace_list" ]]; then
  fail "Could not parse workspace globs from pnpm-workspace.yaml"
else
  pass "Workspace globs parsed"
fi

outside_packages=$(node - <<'NODE'
const { execSync } = require('child_process');
const fs = require('fs');
const yaml = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
const globs = [...yaml.matchAll(/-\s+"([^"]+)"/g)].map((m) => m[1]);
const pkgFiles = execSync('git ls-files "**/package.json"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => f !== 'package.json');

const regexes = globs.map((glob) => {
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');
  return new RegExp(`^${re}/package\\.json$`);
});

const outside = pkgFiles.filter((file) => !regexes.some((re) => re.test(file)));
process.stdout.write(outside.join('\n'));
NODE
)

if [[ -n "$outside_packages" ]]; then
  warn "Package manifests outside workspace globs:\n${outside_packages}"
else
  pass "All tracked package manifests are in workspace globs"
fi

section "Required scripts"
required_scripts=(build typecheck lint test validate check:repo)
for script in "${required_scripts[@]}"; do
  if node -e "const pkg=require('./package.json');process.exit(pkg.scripts && pkg.scripts['$script'] ? 0 : 1)"; then
    pass "root script '$script' exists"
  else
    fail "root script '$script' is missing"
  fi
done

section "Summary"
printf 'Failures: %s\nWarnings: %s\n' "$failures" "$warnings"

if (( failures > 0 )); then
  exit 1
fi
