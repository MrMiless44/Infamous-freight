#!/bin/bash

# =============================================================================
# AI Features Verification Script
# =============================================================================
# Verifies that all AI features are enabled at 100%
# Run: bash scripts/verify-ai-enabled.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🤖 AI FEATURES VERIFICATION - 100% ENABLED CHECK         ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Counter for enabled features
TOTAL=0
ENABLED=0
FAILED=0

# Function to check feature flag
check_feature() {
    local file=$1
    local flag=$2
    local description=$3
    
    TOTAL=$((TOTAL + 1))
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  $description - File not found: $file${NC}"
        return
    fi
    
    if grep -q "^${flag}=true" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ $description${NC}"
        ENABLED=$((ENABLED + 1))
    else
        echo -e "${RED}❌ $description - NOT ENABLED${NC}"
        FAILED=$((FAILED + 1))
    fi
}

echo -e "${BLUE}Checking Root Environment (.env)...${NC}"
check_feature ".env" "ENABLE_AI_COMMANDS" "AI Commands"
check_feature ".env" "ENABLE_AI_EXPERIMENTS" "AI Experiments"
check_feature ".env" "ENABLE_AI_ASSISTANT" "AI Assistant"
check_feature ".env" "ENABLE_AI_AUTOMATION" "AI Automation"
check_feature ".env" "ENABLE_VOICE_PROCESSING" "Voice Processing"
check_feature ".env" "ENABLE_A_B_TESTING" "A/B Testing"
echo ""

echo -e "${BLUE}Checking API Environment (apps/api/.env)...${NC}"
check_feature "apps/api/.env" "ENABLE_AI_COMMANDS" "API: AI Commands"
check_feature "apps/api/.env" "ENABLE_AI_EXPERIMENTS" "API: AI Experiments"
check_feature "apps/api/.env" "ENABLE_AI_ASSISTANT" "API: AI Assistant"
check_feature "apps/api/.env" "ENABLE_AI_AUTOMATION" "API: AI Automation"
check_feature "apps/api/.env" "ENABLE_VOICE_PROCESSING" "API: Voice Processing"
echo ""

echo -e "${BLUE}Checking Web Environment (apps/web/.env)...${NC}"
check_feature "apps/web/.env" "NEXT_PUBLIC_ENABLE_AI_ASSISTANT" "Web: AI Assistant"
check_feature "apps/web/.env" "NEXT_PUBLIC_ENABLE_AI_EXPERIMENTS" "Web: AI Experiments"
check_feature "apps/web/.env" "NEXT_PUBLIC_ENABLE_A_B_TESTING" "Web: A/B Testing"
echo ""

echo -e "${BLUE}Checking Mobile Environment (apps/mobile/.env)...${NC}"
check_feature "apps/mobile/.env" "ENABLE_AI_COMMANDS" "Mobile: AI Commands"
check_feature "apps/mobile/.env" "ENABLE_AI_ASSISTANT" "Mobile: AI Assistant"
check_feature "apps/mobile/.env" "ENABLE_AI_EXPERIMENTS" "Mobile: AI Experiments"
check_feature "apps/mobile/.env" "ENABLE_VOICE_COMMANDS" "Mobile: Voice Commands"
echo ""

echo -e "${BLUE}Checking Edge Config (apps/web/lib/edge-config.ts)...${NC}"
TOTAL=$((TOTAL + 2))
if grep -q "enabled: true" "apps/web/lib/edge-config.ts" 2>/dev/null; then
    if grep -A 5 "aiAssistant:" "apps/web/lib/edge-config.ts" | grep -q "enabled: true"; then
        echo -e "${GREEN}✅ Edge Config: AI Assistant Experiment${NC}"
        ENABLED=$((ENABLED + 1))
    else
        echo -e "${RED}❌ Edge Config: AI Assistant Experiment - NOT ENABLED${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${RED}❌ Edge Config: Could not verify${NC}"
    FAILED=$((FAILED + 1))
fi

if grep -q "rolloutPercentage: 100" "apps/web/lib/edge-config.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Edge Config: AI Assistant Rollout at 100%${NC}"
    ENABLED=$((ENABLED + 1))
else
    echo -e "${RED}❌ Edge Config: AI Assistant Rollout - NOT AT 100%${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

echo -e "${BLUE}Checking AI Provider Configuration...${NC}"
TOTAL=$((TOTAL + 1))
if [ -f ".env" ] && grep -q "^AI_PROVIDER=" ".env" 2>/dev/null; then
    AI_PROVIDER=$(grep "^AI_PROVIDER=" ".env" | cut -d'=' -f2)
    echo -e "${GREEN}✅ AI Provider: ${AI_PROVIDER}${NC}"
    ENABLED=$((ENABLED + 1))
else
    echo -e "${RED}❌ AI Provider: NOT CONFIGURED${NC}"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   VERIFICATION SUMMARY                                     ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Features Checked: ${TOTAL}"
echo -e "${GREEN}✅ Enabled: ${ENABLED}${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Not Enabled: ${FAILED}${NC}"
fi

echo ""

# Calculate percentage
PERCENTAGE=$((ENABLED * 100 / TOTAL))

if [ $PERCENTAGE -eq 100 ]; then
    echo -e "${GREEN}🎉 SUCCESS: All AI features are enabled at 100%!${NC}"
    echo ""
    exit 0
elif [ $PERCENTAGE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  WARNING: AI features are ${PERCENTAGE}% enabled${NC}"
    echo -e "${YELLOW}Some features may not be fully functional.${NC}"
    echo ""
    exit 1
else
    echo -e "${RED}❌ FAILURE: Only ${PERCENTAGE}% of AI features are enabled${NC}"
    echo -e "${RED}Please check your configuration files.${NC}"
    echo ""
    exit 1
fi
