#!/bin/bash

# 🔍 PRE-DEPLOYMENT VALIDATION SCRIPT
# Checks all prerequisites before deployment

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

check() {
    if eval "$1"; then
        echo -e "${GREEN}✅${NC} $2"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌${NC} $2"
        ((CHECKS_FAILED++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️ ${NC} $1"
}

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PRE-DEPLOYMENT VALIDATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Repository checks
echo -e "${BLUE}📁 Repository Structure${NC}"
check "[ -f 'Dockerfile.api' ]" "Dockerfile.api exists"
check "[ -f 'fly.toml' ]" "fly.toml exists"
check "[ -f 'deploy-complete-100.sh' ]" "deploy-complete-100.sh exists"
check "[ -d 'api/src/routes' ]" "api/src/routes directory exists"
check "[ -f 'api/src/routes/billing-payments.js' ]" "billing-payments.js exists"
check "[ -f 'api/src/routes/billing.js' ]" "billing.js exists"
check "[ -d 'packages/shared' ]" "shared package exists"
echo ""

# CLI tools check
echo -e "${BLUE}🔧 Required CLI Tools${NC}"
check "command -v git &> /dev/null" "git is installed"
check "command -v curl &> /dev/null" "curl is installed"
check "command -v flyctl &> /dev/null || [ -f ~/.fly/bin/flyctl ]" "flyctl is installed"
check "command -v openssl &> /dev/null" "openssl is installed"
echo ""

# Documentation check
echo -e "${BLUE}📚 Documentation${NC}"
check "[ -f 'DEPLOYMENT_EXECUTION_100.sh' ]" "DEPLOYMENT_EXECUTION_100.sh exists"
check "[ -f 'DEPLOYMENT_READY_100.md' ]" "DEPLOYMENT_READY_100.md exists"
check "[ -f 'DEPLOYMENT_QUICK_REFERENCE.md' ]" "DEPLOYMENT_QUICK_REFERENCE.md exists"
check "[ -f 'GET_PAID_TODAY_100.md' ]" "GET_PAID_TODAY_100.md exists"
echo ""

# Git status
echo -e "${BLUE}🔐 Git Status${NC}"
check "git rev-parse --is-inside-work-tree &> /dev/null" "Inside git repository"
check "git remote get-url origin &> /dev/null" "Git remote origin exists"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$CURRENT_BRANCH" == "main" ]; then
    echo -e "${GREEN}✅${NC} On main branch"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC} On branch: $CURRENT_BRANCH (should be main)"
fi

check "git status --porcelain | grep -q '.' && echo 1 || echo 0" "No uncommitted changes" || true
echo ""

# API configuration check
echo -e "${BLUE}⚙️  API Configuration${NC}"
check "grep -q 'billingPaymentsRoutes' api/src/server.js 2>/dev/null" "Billing routes integrated in server"
check "[ -f 'api/src/data/subscriptionPlans.js' ]" "Subscription plans configured"
echo ""

# Credentials check
echo -e "${BLUE}🔑 Required Credentials (for deployment)${NC}"
warn "Before running deployment, ensure you have:"
echo "  ☐ Fly.io account (https://fly.io)"
echo "  ☐ Stripe API keys (https://dashboard.stripe.com/apikeys)"
echo "  ☐ Stripe Webhook Secret (https://dashboard.stripe.com/webhooks)"
echo "  ☐ PayPal Client ID & Secret (https://developer.paypal.com/dashboard/)"
echo "  ☐ PostgreSQL database connection string"
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VALIDATION SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! You're ready to deploy.${NC}"
    echo ""
    echo "Run deployment with:"
    echo "  bash deploy-complete-100.sh"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️ ${CHECKS_PASSED} checks passed, ${CHECKS_FAILED} checks failed${NC}"
    echo ""
    echo "Please fix the failed checks above before deploying."
    echo ""
    exit 1
fi
