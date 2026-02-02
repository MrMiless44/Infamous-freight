#!/bin/bash

# Setup uptime monitoring for production health checks
# Run this once to configure automatic uptime monitoring

set -e

echo "⏱️  Uptime Monitoring Setup"
echo "==========================="
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not found. Install with: brew install gh (macOS) or apt install gh (Linux)"
  exit 1
fi

echo "📝 Step 1: Enter your production domain"
read -p "Enter production domain (e.g., app.example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
  echo "❌ Domain cannot be empty"
  exit 1
fi

echo ""

# Test domain accessibility
echo "🧪 Testing domain connectivity..."
if curl -s -I "https://${DOMAIN}/api/health" > /dev/null 2>&1; then
  echo "   ✅ Domain is reachable"
else
  echo "   ⚠️  Domain is not reachable yet (may be normal if not deployed)"
  read -p "Continue anyway? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""

# Get alert email
echo "📝 Step 2: Enter alert email address"
read -p "Alert email (for outage notifications): " ALERT_EMAIL

if [ -z "$ALERT_EMAIL" ]; then
  echo "❌ Email cannot be empty"
  exit 1
fi

echo ""

# Configure GitHub secrets
echo "🔐 Step 3: Configuring GitHub secrets..."
gh secret set UPTIME_DOMAIN --env production "https://${DOMAIN}"
echo "   ✅ UPTIME_DOMAIN configured"

gh secret set UPTIME_ALERT_EMAIL --env production "$ALERT_EMAIL"
echo "   ✅ UPTIME_ALERT_EMAIL configured"

echo ""

# Option 1: GitHub Actions (built-in)
echo "✅ Uptime Monitoring Setup Complete!"
echo ""
echo "📊 Three Options for Uptime Monitoring:"
echo ""
echo "Option 1️⃣  GitHub Actions (FREE, uses CI/CD)"
echo "   - Already configured in .github/workflows/uptime-check.yml"
echo "   - Runs every 5 minutes"
echo "   - Sends Slack notifications on failure"
echo "   Setup: Ensure SLACK_WEBHOOK_URL is configured"
echo ""
echo "Option 2️⃣  Uptimerobot (FREE tier available)"
echo "   - Better uptime history and beautiful dashboards"
echo "   - Manual setup: https://uptimerobot.com"
echo "   Create monitor:"
echo "     - Type: HTTPS"
echo "     - URL: https://${DOMAIN}/api/health"
echo "     - Check interval: 5 minutes"
echo "     - Alert email: ${ALERT_EMAIL}"
echo ""
echo "Option 3️⃣  Vercel Monitoring (if using Vercel)"
echo "   - Built into Vercel dashboard"
echo "   - Setup: Dashboard → Project Settings → Monitoring"
echo "   - Enable uptime checks"
echo ""
echo "📚 Recommended: Use Uptimerobot for best features"
echo ""
echo "🔧 Testing:"
echo "   1. Test health endpoint:"
echo "      curl https://${DOMAIN}/api/health"
echo "   2. Expected response:"
echo '      {"ok":true,"node":"v20.x.x","supabaseUrlPresent":true}'
echo ""
echo "🚀 Uptime monitoring is now enabled!"
echo "   Your production health will be monitored 24/7"
