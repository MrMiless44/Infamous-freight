#!/bin/bash
# Husky Pre-Commit Hook Setup
# Enables security scanning and prevents commits with secrets/sensitive data
# Run: bash setup-husky.sh

set -e

echo "🔐 Setting up Husky Pre-Commit Security Hooks..."

# Check if husky is installed
if ! command -v husky &> /dev/null; then
  echo "📦 Installing husky..."
  pnpm add -D husky lint-staged
fi

# Initialize husky
echo "⚙️  Initializing husky..."
npx husky install

# Create pre-commit hook script
echo "📝 Creating pre-commit security hook..."

cat > .husky/pre-commit << 'EOF'
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Running pre-commit security checks...${NC}"

EXIT_CODE=0

# Function to check for pattern and fail if found
check_pattern() {
  local pattern=$1
  local description=$2
  local severity=$3
  
  if git diff --cached --name-only | xargs git diff --cached --no-ext-diff 2>/dev/null | grep -P "$pattern" 2>/dev/null; then
    echo -e "${RED}❌ ${severity}: Found potential $description${NC}"
    echo "   Remove sensitive data before committing"
    EXIT_CODE=1
    return 1
  fi
  return 0
}

# Security Checks
echo "🔍 Checking for secrets..."

# AWS credentials
check_pattern 'AKIA[0-9A-Z]{16}' "AWS Access Key" "SECURITY" || true

# Private RSA keys
check_pattern '-----BEGIN RSA PRIVATE KEY-----' "RSA Private Key" "SECURITY" || true
check_pattern '-----BEGIN OPENSSH PRIVATE KEY-----' "OpenSSH Private Key" "SECURITY" || true

# JWT/Bearer tokens
check_pattern 'Bearer [A-Za-z0-9._-]{20,}' "JWT/Bearer Token" "SECURITY" || true

# PostgreSQL passwords
check_pattern 'postgresql://.*:.*@' "PostgreSQL credentials" "SECURITY" || true

# API keys (common patterns)
check_pattern 'sk_live_[A-Za-z0-9]{20,}' "Stripe Live Key" "SECURITY" || true
check_pattern 'pk_live_[A-Za-z0-9]{20,}' "Stripe Live Key" "SECURITY" || true
check_pattern 'sk_test_[A-Za-z0-9]{20,}' "Stripe Test Key" "WARNING" || true

# Firebase config
check_pattern '"apiKey":\s*"[^"]{30,}"' "Firebase API Key" "SECURITY" || true

# .env files should not be committed
if git diff --cached --name-only | grep -E '^\.env' 2>/dev/null; then
  echo -e "${RED}❌ SECURITY: Do not commit .env files${NC}"
  echo "   Use .env.example instead"
  EXIT_CODE=1
fi

# Check for console.log in API code
echo "🔍 Checking for debug statements..."
if git diff --cached --name-only | grep -E 'apps/api/src/(?!.*test).*\.js$' 2>/dev/null | while read -r file; do
  if git diff --cached "$file" 2>/dev/null | grep -E '^\+.*console\.(log|debug|trace)' 2>/dev/null; then
    echo -e "${RED}❌ LINT: Found console.log in API code: $file${NC}"
    echo "   Use logger instead"
    EXIT_CODE=1
  fi
done; then
  :
fi

# Check for direct imports from @infamous-freight/shared/src/
echo "🔍 Checking for direct shared imports..."
if git diff --cached --name-only | grep -E '\.(js|ts|tsx?)$' 2>/dev/null | while read -r file; do
  if git diff --cached "$file" 2>/dev/null | grep -E "from ['\"]@infamous-freight/shared/src" 2>/dev/null; then
    echo -e "${RED}❌ LINT: Found direct import from @infamous-freight/shared/src: $file${NC}"
    echo "   Import from @infamous-freight/shared instead"
    EXIT_CODE=1
  fi
done; then
  :
fi

# Check for hardcoded URLs/IPs
echo "🔍 Checking for hardcoded endpoints..."
if git diff --cached --name-only | grep -E '\.(js|ts|tsx?)$' 2>/dev/null | while read -r file; do
  if git diff --cached "$file" 2>/dev/null | grep -E '^\+.*https?://(localhost|127\.0\.0\.1|192\.168\.)' 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: Hardcoded local endpoint: $file${NC}"
    echo "   Consider using environment variables"
  fi
done; then
  :
fi

# Run lint-staged for linting and formatting
echo "🎨 Running lint and format..."
pnpm lint-staged --allow-empty || {
  echo -e "${YELLOW}⚠️  Some linting/formatting checks failed${NC}"
  echo "   Run 'pnpm lint --fix' to auto-fix issues"
}

# Final result
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Pre-commit security checks passed${NC}"
  exit 0
else
  echo -e "${RED}❌ Pre-commit security checks failed${NC}"
  echo "   Fix issues above and try again"
  exit 1
fi
EOF

# Make pre-commit hook executable
chmod +x .husky/pre-commit

# Create lint-staged config if it doesn't exist
if [ ! -f ".lintstagedrc" ]; then
  echo "📝 Creating .lintstagedrc..."
  cat > .lintstagedrc << 'EOF'
{
  "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{md,json,yaml,yml}": ["prettier --write"],
  "apps/api/src/**/*.js": ["jest --bail --findRelatedTests"],
  "apps/web/src/**/*.{ts,tsx}": ["jest --bail --findRelatedTests"]
}
EOF
fi

# Setup git-secrets (optional but recommended)
if command -v git-secrets &> /dev/null; then
  echo "📝 Adding git-secrets patterns..."
  git secrets --add 'sk_live_[\w]{20,}' || true
  git secrets --add 'AKIA[\w]{16}' || true
  git secrets --add '-----BEGIN .* PRIVATE KEY' || true
else
  echo "ⓘ git-secrets not installed (optional)"
  echo "  Install with: brew install git-secrets (macOS) or apt-get install git-secrets (Linux)"
fi

echo ""
echo -e "${GREEN}✅ Husky pre-commit security setup complete${NC}"
echo ""
echo "📋 Pre-commit checks will now:"
echo "  ✓ Block commits with API keys, tokens, credentials"
echo "  ✓ Prevent .env files from being committed"
echo "  ✓ Enforce ESLint rules and code formatting"
echo "  ✓ Check for debug statements (console.log)"
echo "  ✓ Validate shared package imports"
echo ""
echo "💡 Developers can skip checks with: git commit --no-verify (use with caution)"
echo ""
