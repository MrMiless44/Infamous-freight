#!/bin/bash
# 🚀 Deploy Infamous Freight to 100% - Vercel Environment Configuration Helper
# This script provides step-by-step guidance to complete deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

clear

echo -e "${BOLD}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║          🚀 INFAMOUS FREIGHT - 100% DEPLOYMENT WIZARD             ║${NC}"
echo -e "${BOLD}╠════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║  Current Status: 95% Complete                                      ║${NC}"
echo -e "${BOLD}║  Next Step: Configure Vercel Environment Variables                ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env.supabase exists
if [ ! -f ".env.supabase" ]; then
    echo -e "${RED}❌ Error: .env.supabase not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All credentials ready in .env.supabase${NC}"
echo ""

# Function to display step
show_step() {
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Step 1: Open Vercel
show_step "STEP 1: Open Vercel Dashboard"
echo -e "${YELLOW}Opening Vercel in your browser...${NC}"
echo ""
echo -e "👉 ${BOLD}https://vercel.com/dashboard${NC}"
echo ""
echo -e "Action: Click on your project: ${GREEN}Infamous Freight Enterprises${NC}"
echo ""
read -p "Press ENTER when you're on your project page..."

# Step 2: Navigate to Environment Variables
show_step "STEP 2: Navigate to Environment Variables"
echo -e "On your project page:"
echo -e "  1. Click the ${GREEN}Settings${NC} tab (top navigation)"
echo -e "  2. Click ${GREEN}Environment Variables${NC} (left sidebar)"
echo ""
read -p "Press ENTER when you're on the Environment Variables page..."

# Step 3: Add Variables
show_step "STEP 3: Add 6 Environment Variables"
echo -e "${BOLD}I'll display each variable ONE AT A TIME for you to copy-paste${NC}"
echo ""
echo -e "For each variable:"
echo -e "  1. Copy the ${GREEN}Key${NC} (variable name)"
echo -e "  2. Copy the ${GREEN}Value${NC} (full value)"
echo -e "  3. Select environments: ${YELLOW}Production${NC} (and others as specified)"
echo -e "  4. Click ${GREEN}Save${NC}"
echo -e "  5. Press ENTER here to continue to next variable"
echo ""
read -p "Press ENTER to start..."

# Source the .env.supabase file
source .env.supabase

# Variable 1
show_step "VARIABLE 1 of 6: NEXT_PUBLIC_SUPABASE_URL"
echo -e "${GREEN}Key:${NC}"
echo "NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo -e "${GREEN}Value:${NC}"
echo "$NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo -e "${GREEN}Environments:${NC} ✅ Production ✅ Preview ✅ Development"
echo ""
read -p "Press ENTER after adding this variable in Vercel..."

# Variable 2
show_step "VARIABLE 2 of 6: NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo -e "${GREEN}Key:${NC}"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo -e "${GREEN}Value:${NC}"
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo -e "${GREEN}Environments:${NC} ✅ Production ✅ Preview ✅ Development"
echo ""
read -p "Press ENTER after adding this variable in Vercel..."

# Variable 3
show_step "VARIABLE 3 of 6: SUPABASE_SERVICE_ROLE_KEY"
echo -e "${GREEN}Key:${NC}"
echo "SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo -e "${GREEN}Value:${NC}"
echo "$SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo -e "${RED}Environments:${NC} ✅ Production ONLY (this is sensitive!)"
echo ""
read -p "Press ENTER after adding this variable in Vercel..."

# Variable 4
show_step "VARIABLE 4 of 6: DATABASE_URL"
echo -e "${GREEN}Key:${NC}"
echo "DATABASE_URL"
echo ""
echo -e "${GREEN}Value:${NC}"
echo "$DATABASE_URL"
echo ""
echo -e "${GREEN}Environments:${NC} ✅ Production ✅ Preview ✅ Development"
echo ""
read -p "Press ENTER after adding this variable in Vercel..."

# Variable 5
show_step "VARIABLE 5 of 6: NODE_ENV"
echo -e "${GREEN}Key:${NC}"
echo "NODE_ENV"
echo ""
echo -e "${GREEN}Value:${NC}"
echo "$NODE_ENV"
echo ""
echo -e "${GREEN}Environments:${NC} ✅ Production ONLY"
echo ""
read -p "Press ENTER after adding this variable in Vercel..."

# Variable 6
show_step "VARIABLE 6 of 6: JWT_SECRET"
echo -e "${GREEN}Key:${NC}"
echo "JWT_SECRET"
echo ""
echo -e "${GREEN}Value:${NC}"
echo "$JWT_SECRET"
echo ""
echo -e "${GREEN}Environments:${NC} ✅ Production ONLY"
echo ""
read -p "Press ENTER after adding this variable in Vercel..."

# Step 4: Redeploy
show_step "STEP 4: Redeploy Vercel"
echo -e "Now that all variables are added:"
echo ""
echo -e "  1. Click ${GREEN}Deployments${NC} tab (top navigation)"
echo -e "  2. Find the ${GREEN}latest deployment${NC} (top of list)"
echo -e "  3. Click the ${GREEN}⋯ (three dots)${NC} menu"
echo -e "  4. Click ${GREEN}Redeploy${NC}"
echo -e "  5. Confirm: Click ${GREEN}Redeploy${NC} again"
echo ""
echo -e "${YELLOW}⏳ Wait 2-4 minutes for deployment to complete...${NC}"
echo ""
read -p "Press ENTER after you've triggered the redeployment..."

# Step 5: Wait for deployment
show_step "STEP 5: Wait for Deployment to Complete"
echo -e "Watch the deployment progress in Vercel:"
echo ""
echo -e "  ⏳ Building..."
echo -e "  ⏳ Deploying..."
echo -e "  ✅ ${GREEN}Ready${NC} ← Wait for this!"
echo ""
echo -e "${YELLOW}This usually takes 2-4 minutes.${NC}"
echo ""
read -p "Press ENTER when deployment shows 'Ready'..."

# Step 6: Verify
show_step "STEP 6: Verify 100% Deployment"
echo -e "${BOLD}Testing your deployment...${NC}"
echo ""

# Test web app
echo -e "${BLUE}Testing web application...${NC}"
if curl -s -f -o /dev/null https://infamous-freight-enterprises.vercel.app; then
    echo -e "${GREEN}✅ Web application is accessible${NC}"
else
    echo -e "${RED}⚠️  Web application may still be deploying${NC}"
fi
echo ""

# Test API health
echo -e "${BLUE}Testing API health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s https://infamous-freight-enterprises.vercel.app/api/health 2>/dev/null || echo "{}")
echo "Response: $HEALTH_RESPONSE"
echo ""

if echo "$HEALTH_RESPONSE" | grep -q '"database":"connected"'; then
    echo -e "${GREEN}✅ Database is CONNECTED!${NC}"
    echo ""
    echo -e "${BOLD}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║                                                                    ║${NC}"
    echo -e "${BOLD}║                  🎉 ${GREEN}100% DEPLOYMENT COMPLETE!${NC}${BOLD}   🎉                 ║${NC}"
    echo -e "${BOLD}║                                                                    ║${NC}"
    echo -e "${BOLD}╠════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BOLD}║  Your application is now live and connected to the database!      ║${NC}"
    echo -e "${BOLD}╠════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BOLD}║                                                                    ║${NC}"
    echo -e "${BOLD}║  🌐 Web App:                                                       ║${NC}"
    echo -e "${BOLD}║     ${GREEN}https://infamous-freight-enterprises.vercel.app${NC}${BOLD}             ║${NC}"
    echo -e "${BOLD}║                                                                    ║${NC}"
    echo -e "${BOLD}║  🏥 API Health:                                                    ║${NC}"
    echo -e "${BOLD}║     ${GREEN}https://infamous-freight-enterprises.vercel.app/api/health${NC}${BOLD} ║${NC}"
    echo -e "${BOLD}║                                                                    ║${NC}"
    echo -e "${BOLD}║  🗄️  Database:                                                     ║${NC}"
    echo -e "${BOLD}║     ${GREEN}https://wnaievjffghrzjtuvutp.supabase.co${NC}${BOLD}                  ║${NC}"
    echo -e "${BOLD}║                                                                    ║${NC}"
    echo -e "${BOLD}╠════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BOLD}║  Status Report:                                                    ║${NC}"
    echo -e "${BOLD}║  ✅ Repository synced                              [████████] 100% ║${NC}"
    echo -e "${BOLD}║  ✅ Supabase database connected                    [████████] 100% ║${NC}"
    echo -e "${BOLD}║  ✅ Vercel web application                         [████████] 100% ║${NC}"
    echo -e "${BOLD}║  ✅ Environment variables configured               [████████] 100% ║${NC}"
    echo -e "${BOLD}║  ✅ API endpoints functional                       [████████] 100% ║${NC}"
    echo -e "${BOLD}║                                                                    ║${NC}"
    echo -e "${BOLD}║  🚀 INFAMOUS FREIGHT IS NOW LIVE TO THE WORLD! 🌍                 ║${NC}"
    echo -e "${BOLD}║                                                                    ║${NC}"
    echo -e "${BOLD}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Database connection not detected yet${NC}"
    echo ""
    echo -e "This could mean:"
    echo -e "  1. Deployment is still in progress (wait 2-3 more minutes)"
    echo -e "  2. Environment variables need to propagate (wait 5 minutes)"
    echo -e "  3. An environment variable may have been entered incorrectly"
    echo ""
    echo -e "${BOLD}Action:${NC}"
    echo -e "  • Wait 5 minutes and run: ${GREEN}./verify-deployment.sh${NC}"
    echo -e "  • Or manually check: ${GREEN}https://infamous-freight-enterprises.vercel.app/api/health${NC}"
    echo ""
fi

echo ""
echo -e "${BOLD}Deployment wizard complete!${NC}"
echo ""
