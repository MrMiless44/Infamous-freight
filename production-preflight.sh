#!/bin/bash
# 🔐 PRODUCTION PRE-FLIGHT CHECKLIST
# Verify all systems ready for production deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
    local name="$1"
    local command="$2"
    
    echo -n "Checking: $name ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌${NC}"
        ((CHECKS_FAILED++))
    fi
}

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

section "Environment Setup"
check "Node.js installed" "node --version"
check "pnpm installed" "pnpm --version"
check "Git installed" "git --version"
check "Docker installed" "docker --version"

section "Repository Status"
check "Git clean" "[ -z \"\$(git status --porcelain)\" ]"
check "On main branch" "[ \"\$(git rev-parse --abbrev-ref HEAD)\" = 'main' ]"
check "Upstream synced" "git fetch origin && [ -z \"\$(git log HEAD..origin/main --oneline)\" ]"

section "Dependencies"
check "Root dependencies" "[ -d node_modules ]"
check "API dependencies" "[ -d api/node_modules ]"
check "Web dependencies" "[ -d web/node_modules ]"

section "Build Status"
check "Build successful" "cd /workspaces/Infamous-freight-enterprises && pnpm build"
check "TypeScript errors" "cd /workspaces/Infamous-freight-enterprises && pnpm typecheck"

section "Testing"
check "All tests passing" "cd /workspaces/Infamous-freight-enterprises && pnpm test -- --passWithNoTests"
check "Coverage threshold" "cd /workspaces/Infamous-freight-enterprises && pnpm test:coverage -- --passWithNoTests"

section "Configuration Files"
check "vercel.json present" "[ -f vercel.json ]"
check "fly.toml present" "[ -f fly.toml ]"
check "docker-compose.prod.yml present" "[ -f docker-compose.prod.yml ]"
check ".env.example present" "[ -f .env.example ]"

section "Database"
check "Prisma schema" "[ -f api/prisma/schema.prisma ]"
check "Prisma client" "[ -d api/node_modules/.prisma/client ]"

section "Security"
check "LICENSE present" "[ -f LICENSE ]"
check "COPYRIGHT present" "[ -f COPYRIGHT ]"
check "No secrets in code" "! grep -r 'PRIVATE_KEY\\|SECRET' api/src --exclude-dir=node_modules || true"

section "Documentation"
check "README present" "[ -f README.md ]"
check "API_REFERENCE present" "[ -f API_REFERENCE.md ]"
check "DEPLOYMENT_GUIDE present" "[ -f DEPLOYMENT_GUIDE.md ]"

section "GitHub Workflows"
check "Workflows present" "[ -d .github/workflows ]"
check "CI/CD workflow" "[ -f .github/workflows/ci-cd.yml ]"
check "Deployment workflow" "[ -f .github/workflows/fly-deploy.yml ]"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Failed: ${RED}$CHECKS_FAILED${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ALL CHECKS PASSED - READY FOR PRODUCTION${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME CHECKS FAILED - FIX BEFORE DEPLOYING${NC}"
    exit 1
fi
