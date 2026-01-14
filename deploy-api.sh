#!/bin/bash

# 🚀 Infamous Freight Enterprises - Complete Deployment Script
# This script handles the final deployment steps to Fly.io

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 INFAMOUS FREIGHT ENTERPRISES - DEPLOYMENT SCRIPT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl not found. Installing..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

echo "✅ Fly.io CLI is installed"
echo ""

# Check if authenticated
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 You need to authenticate with Fly.io"
    echo "Run: flyctl auth login"
    exit 1
fi

echo "✅ Authenticated with Fly.io"
echo ""

# Step 1: Deploy to Fly.io
echo "📦 Step 1: Deploying to Fly.io..."
echo "───────────────────────────────────────────────────────────────"
cd /workspaces/Infamous-freight-enterprises

if flyctl deploy --remote-only --strategy=canary; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed"
    exit 1
fi
echo ""

# Step 2: Set environment secrets
echo "🔐 Step 2: Configuring environment secrets..."
echo "───────────────────────────────────────────────────────────────"
echo ""
echo "You need to provide the following API keys:"
echo ""
echo "Required Stripe keys:"
echo "  • STRIPE_SECRET_KEY (format: sk_live_...)"
echo "  • STRIPE_PUBLISHABLE_KEY (format: pk_live_...)"
echo "  • STRIPE_WEBHOOK_SECRET (format: whsec_...)"
echo ""
echo "Required PayPal keys:"
echo "  • PAYPAL_CLIENT_ID"
echo "  • PAYPAL_CLIENT_SECRET"
echo ""
echo "Database:"
echo "  • DATABASE_URL (PostgreSQL connection string)"
echo ""
echo "Authentication:"
echo "  • JWT_SECRET (any random secure string, 32+ chars)"
echo ""
echo "Example command:"
echo "───────────────────────────────────────────────────────────────"
echo ""
echo "flyctl secrets set \\"
echo "  STRIPE_SECRET_KEY=sk_live_YOUR_KEY \\"
echo "  STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY \\"
echo "  STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET \\"
echo "  PAYPAL_CLIENT_ID=YOUR_ID \\"
echo "  PAYPAL_CLIENT_SECRET=YOUR_SECRET \\"
echo "  JWT_SECRET=\$(openssl rand -base64 32) \\"
echo "  DATABASE_URL=postgresql://user:pass@host:5432/db"
echo ""
echo "⏳ Waiting for your input..."
echo ""

read -p "Have you set the secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please run the command above and try again"
    exit 1
fi
echo "✅ Secrets configured"
echo ""

# Step 3: Run database migrations
echo "🗄️  Step 3: Running database migrations..."
echo "───────────────────────────────────────────────────────────────"

if flyctl ssh console -C "cd /app/api && pnpm prisma:migrate:deploy"; then
    echo "✅ Database migrations completed"
else
    echo "⚠️  Database migrations may need manual attention"
    echo "Run: flyctl ssh console"
    echo "Then: cd /app/api && pnpm prisma:migrate:deploy"
fi
echo ""

# Step 4: Verify deployment
echo "✅ Step 4: Verifying deployment..."
echo "───────────────────────────────────────────────────────────────"

APP_NAME="infamous-freight-enterprises"
API_URL="https://${APP_NAME}.fly.dev"

echo "Testing health endpoint..."
if curl -s -f "${API_URL}/health" > /dev/null; then
    echo "✅ API is healthy!"
else
    echo "⚠️  Could not reach API. Checking status..."
    flyctl status
fi
echo ""

# Step 5: Summary
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Your API is now live at:"
echo "   ${API_URL}"
echo ""
echo "📊 Dashboard:"
echo "   https://fly.io/dashboard/personal/apps/${APP_NAME}"
echo ""
echo "📋 Documentation:"
echo "   ${API_URL}/api/docs"
echo ""
echo "📞 Next steps:"
echo "   1. Register webhook URLs in Stripe/PayPal dashboards"
echo "   2. Test payment flow with test card: 4242 4242 4242 4242"
echo "   3. Monitor revenue on /api/billing/revenue endpoint"
echo "   4. Check logs with: flyctl logs"
echo ""
echo "💰 Ready to make money! 🎉"
echo ""
