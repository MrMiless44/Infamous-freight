#!/bin/bash

# Setup Sentry for production error tracking
# Run this once to configure Sentry integration

set -e

echo "🔍 Sentry Error Tracking Setup"
echo "=============================="
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not found. Install with: brew install gh (macOS) or apt install gh (Linux)"
  exit 1
fi

# 1. Prompt for Sentry DSN
echo "📝 Step 1: Get your Sentry DSN"
echo "   1. Go to https://sentry.io"
echo "   2. Create organization: 'Infamous Freight'"
echo "   3. Create project: 'infamous-freight' (Select 'Next.js')"
echo "   4. Copy the DSN from Project Settings → Client Keys"
echo ""

read -p "Enter your Sentry DSN (format: https://...@sentry.io/...): " SENTRY_DSN

# Validate DSN format
if [[ ! $SENTRY_DSN =~ ^https://.*@sentry\.io ]]; then
  echo "❌ Invalid DSN format. Must start with https:// and contain @sentry.io"
  exit 1
fi

echo "✅ DSN validated"
echo ""

# 2. Get Auth Token for release management
echo "📝 Step 2: Get Sentry Auth Token"
echo "   1. Go to https://sentry.io/settings/account/tokens/"
echo "   2. Create new token with scopes: 'project:read', 'project:write', 'release:read', 'release:write'"
echo ""

read -p "Enter your Sentry Auth Token: " SENTRY_AUTH_TOKEN

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "⚠️  Skipping auth token (optional, needed for release tracking)"
  SENTRY_AUTH_TOKEN="skipped"
fi

echo ""

# 3. Configure GitHub secrets
echo "🔐 Step 3: Configuring GitHub secrets..."
gh secret set SENTRY_DSN --env production "$SENTRY_DSN"
echo "   ✅ SENTRY_DSN configured"

if [ "$SENTRY_AUTH_TOKEN" != "skipped" ]; then
  gh secret set SENTRY_AUTH_TOKEN --env production "$SENTRY_AUTH_TOKEN"
  echo "   ✅ SENTRY_AUTH_TOKEN configured"
fi

echo ""

# 4. Test error capture
echo "🧪 Step 4: Testing error capture..."
echo "   (This requires your app to be running)"
echo ""

read -p "Enter your production domain (e.g., app.example.com): " DOMAIN

# Test endpoint (if exists)
if curl -s "https://${DOMAIN}/api/health" > /dev/null 2>&1; then
  echo "   ✅ Production domain reachable"
  
  # Try to create a test error
  RESPONSE=$(curl -s -X POST "https://${DOMAIN}/api/test-error" \
    -H "Content-Type: application/json" \
    -d '{"message":"Test error from Sentry setup"}' 2>&1)
  echo "   ℹ️  Test error sent to Sentry"
else
  echo "   ⚠️  Production domain not reachable yet"
fi

echo ""

# 5. Provide instructions for verification
echo "✅ Sentry Setup Complete!"
echo ""
echo "📊 Verification Steps:"
echo "   1. Go to https://sentry.io/organizations/your-org/issues/"
echo "   2. Wait 30-60 seconds for errors to appear"
echo "   3. Look for 'Test error from Sentry setup' message"
echo ""
echo "📚 Next Steps:"
echo "   1. Configure Sentry alerts: https://sentry.io/settings/.../alerts/"
echo "   2. Set alert email to: devops@infamousfreight.com"
echo "   3. Create alert for error spike (10+ errors in 10 minutes)"
echo "   4. Create alert for 5xx errors"
echo ""
echo "🚀 Your error tracking is now live!"
echo "   Every error in production will be captured and reported."
