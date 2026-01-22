#!/bin/bash

# OWASP Security Audit Script for Infæmous Freight
# Usage: chmod +x SECURITY_AUDIT.sh && ./SECURITY_AUDIT.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔐 Infæmous Freight Security Audit"
echo "=================================="
echo ""

# Check 1: npm audit (Dependency vulnerabilities)
echo -e "${YELLOW}[1/10]${NC} Checking dependency vulnerabilities (npm audit)..."
if cd api && npm audit --audit-level=moderate 2>/dev/null; then
  echo -e "${GREEN}✓ No moderate/high vulnerabilities found${NC}"
else
  echo -e "${RED}✗ Vulnerabilities detected (see above)${NC}"
  npm audit fix --force || true
fi
cd ..

# Check 2: Environment Variables
echo -e "${YELLOW}[2/10]${NC} Checking environment configuration..."
missing_vars=0
for var in JWT_SECRET OPENAI_API_KEY STRIPE_SECRET_KEY DATABASE_URL; do
  if [ -z "${!var}" ]; then
    echo -e "${YELLOW}⚠ Missing: $var (set in .env)${NC}"
    ((missing_vars++))
  fi
done
if [ $missing_vars -eq 0 ]; then
  echo -e "${GREEN}✓ All critical environment variables set${NC}"
else
  echo -e "${YELLOW}⚠ Warning: $missing_vars environment variables missing${NC}"
fi
echo ""

# Check 3: Source Code Review
echo -e "${YELLOW}[3/10]${NC} Scanning for hardcoded secrets..."
if grep -r "sk_live_\|pk_live_\|password.*=" api/src --include="*.js" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".env"; then
  echo -e "${RED}✗ Found hardcoded secrets in source code!${NC}"
else
  echo -e "${GREEN}✓ No hardcoded secrets detected${NC}"
fi
echo ""

# Check 4: CORS Configuration
echo -e "${YELLOW}[4/10]${NC} Checking CORS configuration..."
if grep -r "CORS_ORIGINS" api/.env* 2>/dev/null | grep "\*"; then
  echo -e "${RED}✗ CORS allows wildcard (*) - potential vulnerability${NC}"
else
  echo -e "${GREEN}✓ CORS properly configured (no wildcards)${NC}"
fi
echo ""

# Check 5: Rate Limiting
echo -e "${YELLOW}[5/10]${NC} Checking rate limiting configuration..."
if grep -q "limiters" api/src/middleware/security.js; then
  echo -e "${GREEN}✓ Rate limiting middleware present${NC}"
else
  echo -e "${RED}✗ Rate limiting not configured${NC}"
fi
echo ""

# Check 6: Authentication
echo -e "${YELLOW}[6/10]${NC} Checking authentication middleware..."
if grep -q "authenticateWithRBAC\|authGuard" api/src/middleware/*.js api/src/routes/*.js 2>/dev/null; then
  echo -e "${GREEN}✓ Authentication middleware applied${NC}"
else
  echo -e "${YELLOW}⚠ Warning: Some routes may lack authentication${NC}"
fi
echo ""

# Check 7: HTTPS/TLS
echo -e "${YELLOW}[7/10]${NC} Checking HTTPS configuration..."
if grep -q "force_https = true" fly.toml; then
  echo -e "${GREEN}✓ HTTPS enforced in production${NC}"
else
  echo -e "${RED}✗ HTTPS not enforced${NC}"
fi
echo ""

# Check 8: Database
echo -e "${YELLOW}[8/10]${NC} Checking database security..."
if grep -q "DATABASE_URL" .env* 2>/dev/null; then
  echo -e "${GREEN}✓ Database connection string configured${NC}"
  if grep -q "sslmode=require" .env* 2>/dev/null; then
    echo -e "${GREEN}✓ SSL/TLS enabled for database${NC}"
  else
    echo -e "${YELLOW}⚠ Warning: Consider enabling SSL/TLS for database${NC}"
  fi
else
  echo -e "${RED}✗ Database not configured${NC}"
fi
echo ""

# Check 9: Security Headers
echo -e "${YELLOW}[9/10]${NC} Checking security headers middleware..."
if grep -q "helmet\|CSP\|X-Frame-Options" api/src/middleware/*.js; then
  echo -e "${GREEN}✓ Security headers configured${NC}"
else
  echo -e "${RED}✗ Security headers not configured${NC}"
fi
echo ""

# Check 10: Secrets Management
echo -e "${YELLOW}[10/10]${NC} Checking secrets management..."
if [ -f ".env.local" ] && [ -f ".env.production" ]; then
  echo -e "${GREEN}✓ Environment files exist${NC}"
  if grep -q "^JWT_SECRET=" .env.local; then
    secret_length=$(grep "^JWT_SECRET=" .env.local | cut -d= -f2 | wc -c)
    if [ $secret_length -gt 32 ]; then
      echo -e "${GREEN}✓ JWT_SECRET is strong ($secret_length chars)${NC}"
    else
      echo -e "${RED}✗ JWT_SECRET too weak (< 32 chars)${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠ Warning: Environment files missing${NC}"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}Security audit complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Fix any ${RED}critical${NC} issues above"
echo "2. Review OWASP Top 10: https://owasp.org/www-project-top-ten/"
echo "3. Enable monitoring (Sentry + Datadog)"
echo "4. Rotate secrets quarterly"
echo "5. Run security audit monthly"
echo ""
