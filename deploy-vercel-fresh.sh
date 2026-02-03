#!/bin/bash
# Fresh Vercel Deployment Helper
# Run this script to get deployment instructions and open Vercel dashboard

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║           🚀 FRESH VERCEL DEPLOYMENT HELPER                  ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if old .vercel directories exist
if [ -d ".vercel" ] || [ -d "apps/web/.vercel" ]; then
    echo "⚠️  Found old Vercel configuration!"
    echo ""
    read -p "Remove old .vercel directories? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .vercel apps/web/.vercel apps/web/.vercel.api
        echo "✅ Removed old configuration"
    fi
    echo ""
fi

echo "✅ PREPARATION COMPLETE"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Open Vercel Dashboard:"
echo "   👉 https://vercel.com/new"
echo ""
echo "2. Import Repository:"
echo "   - Repository: MrMiless44/Infamous-freight"
echo "   - Root Directory: apps/web"
echo ""
echo "3. Add Environment Variables:"
echo "   - NEXT_PUBLIC_API_URL = https://infamous-freight-942.fly.dev"
echo "   - NEXT_PUBLIC_API_BASE_URL = https://infamous-freight-942.fly.dev/api"
echo "   - NODE_ENV = production"
echo "   - NEXT_TELEMETRY_DISABLED = 1"
echo ""
echo "4. Deploy!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📄 Full Instructions: See FRESH_VERCEL_DEPLOY.md"
echo ""
echo "🌍 Opening Vercel Dashboard..."
echo ""

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open "https://vercel.com/new" &
elif command -v open &> /dev/null; then
    open "https://vercel.com/new" &
# Try VS Code's built-in browser
elif [ -n "$BROWSER" ]; then
    "$BROWSER" "https://vercel.com/new" &
else
    echo "⚠️  Could not auto-open browser"
    echo "   Please manually open: https://vercel.com/new"
fi

echo ""
echo "✨ Good luck with your deployment!"
echo ""
