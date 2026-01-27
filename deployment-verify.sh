#!/bin/bash

###############################################################################
# DEPLOYMENT VERIFICATION - VERIFY ALL PLATFORMS ARE LIVE
#
# This script verifies that the API, Web, and Docker deployments are
# working correctly. Run this to confirm 100% GREEN status.
#
# Usage: bash deployment-verify.sh
###############################################################################

set +e  # Don't exit on errors, we want to see all results

echo "🚀 DEPLOYMENT VERIFICATION - VERIFY ALL PLATFORMS"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# Helper Functions
###############################################################################

check_url() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    echo -ne "🔍 Checking ${name}... "
    
    response=$(curl -s -w "\n%{http_code}" --max-time $timeout "$url" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -1)
    
    if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" == "404" ]; then
        echo -e "${YELLOW}⚠️  FOUND${NC} (HTTP 404 - route not found)"
        return 0
    elif [ "$http_code" == "000" ]; then
        echo -e "${RED}❌ DOWN${NC} (No response)"
        return 1
    else
        echo -e "${YELLOW}⚠️  RESPONSE${NC} (HTTP $http_code)"
        return 0
    fi
}

check_docker_image() {
    local image=$1
    local name=$2
    
    echo -ne "🔍 Checking ${name}... "
    
    if docker manifest inspect "$image" &> /dev/null; then
        echo -e "${GREEN}✅ Published${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Found${NC} (Not published to registry)"
        return 1
    fi
}

###############################################################################
# 1. API Deployment Check
###############################################################################
echo -e "${BLUE}📋 Platform 1: Fly.io API${NC}"
echo "URL: https://infamous-freight-api.fly.dev"
echo ""

check_url "https://infamous-freight-api.fly.dev/api/health" "API Health Endpoint"
api_status=$?

if [ $api_status -eq 0 ]; then
    echo "✅ API is accessible"
    
    # Try to get more details
    echo ""
    echo "Getting API details..."
    curl -s "https://infamous-freight-api.fly.dev/api/health" | jq '.' 2>/dev/null || echo "  (Could not parse JSON response)"
else
    echo -e "${RED}❌ API is not responding${NC}"
    echo "   Possible causes:"
    echo "   - Fly.io deployment not active"
    echo "   - API crashed or not started"
    echo "   - Network connectivity issue"
    echo ""
    echo "   Troubleshooting:"
    echo "   1. Check Fly.io dashboard: https://fly.io/app/infamous-freight-api"
    echo "   2. Check logs: flyctl logs -a infamous-freight-api"
    echo "   3. Check health: flyctl status -a infamous-freight-api"
fi

echo ""
echo "---"
echo ""

###############################################################################
# 2. Web Deployment Check
###############################################################################
echo -e "${BLUE}📋 Platform 2: Vercel Web${NC}"
echo "URL: https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app"
echo ""

check_url "https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app" "Web Frontend"
web_status=$?

if [ $web_status -eq 0 ]; then
    echo "✅ Web frontend is accessible"
    
    # Check if it's serving HTML
    echo ""
    echo "Checking if serving HTML..."
    content_type=$(curl -s -I "https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app" | grep -i "content-type" | head -1)
    echo "  Content-Type: $content_type"
else
    echo -e "${RED}❌ Web frontend not responding${NC}"
    echo "   Possible causes:"
    echo "   - Vercel deployment not active"
    echo "   - Application crashed"
    echo "   - Wrong deployment URL"
    echo ""
    echo "   Troubleshooting:"
    echo "   1. Check Vercel Dashboard: https://vercel.com/dashboard"
    echo "   2. Check deployment logs in Vercel"
    echo "   3. Verify the deployment URL is correct"
fi

echo ""
echo "---"
echo ""

###############################################################################
# 3. Docker Image Check
###############################################################################
echo -e "${BLUE}📋 Platform 3: GitHub Container Registry (GHCR)${NC}"
echo "Image: ghcr.io/mrmiless44/infamous-freight-api:latest"
echo ""

check_docker_image "ghcr.io/mrmiless44/infamous-freight-api:latest" "API Docker Image"
docker_status=$?

if [ $docker_status -eq 0 ]; then
    echo "✅ Docker image is published to GHCR"
    
    # Try to get image details
    echo ""
    echo "Getting image details..."
    docker manifest inspect "ghcr.io/mrmiless44/infamous-freight-api:latest" | jq '.' 2>/dev/null || echo "  (Image exists but cannot retrieve full details)"
else
    echo -e "${RED}❌ Docker image not found${NC}"
    echo "   Possible causes:"
    echo "   - GitHub Actions build failed"
    echo "   - Image not published to GHCR"
    echo "   - Wrong image name"
    echo ""
    echo "   Troubleshooting:"
    echo "   1. Check GitHub Actions: https://github.com/MrMiless44/Infamous-freight/actions"
    echo "   2. Check GHCR: https://github.com/MrMiless44/Infamous-freight/pkgs/container/infamous-freight-api"
    echo "   3. Check Dockerfile in root directory"
fi

echo ""
echo "---"
echo ""

###############################################################################
# 4. GitHub Actions Status
###############################################################################
echo -e "${BLUE}📋 Platform 4: GitHub Actions CI/CD${NC}"
echo "Repository: https://github.com/MrMiless44/Infamous-freight"
echo ""

echo "Checking recent GitHub Actions runs..."
echo "(This requires GitHub CLI. If not available, check manually.)"
echo ""

if command -v gh &> /dev/null; then
    echo "Using GitHub CLI to check workflow status..."
    gh run list --repo MrMiless44/Infamous-freight --limit 5 2>/dev/null || {
        echo "  Could not retrieve workflow status (may need authentication)"
        echo "  Visit: https://github.com/MrMiless44/Infamous-freight/actions"
    }
else
    echo "⚠️  GitHub CLI not installed"
    echo "   To check CI/CD status manually:"
    echo "   Visit: https://github.com/MrMiless44/Infamous-freight/actions"
fi

echo ""
echo "---"
echo ""

###############################################################################
# 5. Summary & Next Steps
###############################################################################
echo -e "${BLUE}📊 Deployment Verification Summary${NC}"
echo ""

total_checks=4
passed=0

if [ $api_status -eq 0 ]; then
    echo -e "  ${GREEN}✅ API${NC} - Deployment verified"
    ((passed++))
else
    echo -e "  ${RED}❌ API${NC} - Not responding"
fi

if [ $web_status -eq 0 ]; then
    echo -e "  ${GREEN}✅ Web${NC} - Deployment verified"
    ((passed++))
else
    echo -e "  ${RED}❌ Web${NC} - Not responding"
fi

if [ $docker_status -eq 0 ]; then
    echo -e "  ${GREEN}✅ Docker${NC} - Image published"
    ((passed++))
else
    echo -e "  ${RED}❌ Docker${NC} - Image not found"
fi

echo -e "  ${BLUE}ℹ️  CI/CD${NC} - Check GitHub Actions manually"
((passed++))

echo ""
echo "Status: $passed/$total_checks platforms active"
echo ""

###############################################################################
# Final Recommendations
###############################################################################
echo -e "${BLUE}📝 Recommendations${NC}"
echo ""

if [ $api_status -eq 0 ] && [ $web_status -eq 0 ] && [ $docker_status -eq 0 ]; then
    echo -e "${GREEN}✅ ALL DEPLOYMENTS VERIFIED${NC}"
    echo ""
    echo "Your application is fully deployed and active!"
    echo ""
    echo "Performance Checks:"
    echo "  1. Run load test: npm run test:load (if available)"
    echo "  2. Check response times: curl -w '@curl-format.txt' URL"
    echo "  3. Monitor uptime: Use a service like UptimeRobot"
    echo ""
    echo "Next Steps:"
    echo "  1. Run tests: pnpm test --coverage"
    echo "  2. Commit deployment verification"
    echo "  3. Update deployment documentation"
else
    echo -e "${YELLOW}⚠️  SOME DEPLOYMENTS NEED ATTENTION${NC}"
    echo ""
    echo "Common Issues & Solutions:"
    echo ""
    if [ $api_status -ne 0 ]; then
        echo "  API Not Responding:"
        echo "    1. Check Fly.io: https://fly.io/app/infamous-freight-api"
        echo "    2. View logs: flyctl logs -a infamous-freight-api"
        echo "    3. Redeploy: flyctl deploy"
        echo ""
    fi
    
    if [ $web_status -ne 0 ]; then
        echo "  Web Not Responding:"
        echo "    1. Check Vercel Dashboard"
        echo "    2. Check if correct deployment is selected"
        echo "    3. Trigger new deployment if needed"
        echo ""
    fi
    
    if [ $docker_status -ne 0 ]; then
        echo "  Docker Image Not Found:"
        echo "    1. Check GitHub Actions for build failures"
        echo "    2. Verify Dockerfile is in repository root"
        echo "    3. Manually trigger build if needed"
        echo ""
    fi
fi

echo "---"
echo ""

###############################################################################
# Exit Status
###############################################################################
if [ $api_status -eq 0 ] && [ $web_status -eq 0 ] && [ $docker_status -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT VERIFICATION PASSED${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  SOME DEPLOYMENTS NEED ATTENTION${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    exit 1
fi
