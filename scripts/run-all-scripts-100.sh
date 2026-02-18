#!/bin/bash

# =============================================================================
# Run All Scripts 100% - Comprehensive System Verification
# =============================================================================
# Executes all critical verification, validation, and health check scripts
# Run: bash scripts/run-all-scripts-100.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Counters
TOTAL_SCRIPTS=0
PASSED_SCRIPTS=0
FAILED_SCRIPTS=0
SKIPPED_SCRIPTS=0

# Results array
declare -a RESULTS

# Function to run a script and track result
run_script() {
    local script_path=$1
    local script_name=$2
    local required=${3:-true}
    
    TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
    
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Running: ${script_name}${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    
    if [ ! -f "$script_path" ]; then
        echo -e "${YELLOW}⚠️  Script not found: ${script_path}${NC}"
        SKIPPED_SCRIPTS=$((SKIPPED_SCRIPTS + 1))
        RESULTS+=("${YELLOW}⚠️  SKIPPED${NC} - $script_name (not found)")
        return
    fi
    
    if [ ! -x "$script_path" ]; then
        echo -e "${BLUE}📝 Making script executable...${NC}"
        chmod +x "$script_path"
    fi
    
    if bash "$script_path"; then
        echo -e "${GREEN}✅ PASSED: ${script_name}${NC}"
        PASSED_SCRIPTS=$((PASSED_SCRIPTS + 1))
        RESULTS+=("${GREEN}✅ PASSED${NC} - $script_name")
    else
        EXIT_CODE=$?
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ FAILED: ${script_name} (Exit code: ${EXIT_CODE})${NC}"
            FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
            RESULTS+=("${RED}❌ FAILED${NC} - $script_name (Exit code: ${EXIT_CODE})")
        else
            echo -e "${YELLOW}⚠️  WARNING: ${script_name} failed but not required${NC}"
            SKIPPED_SCRIPTS=$((SKIPPED_SCRIPTS + 1))
            RESULTS+=("${YELLOW}⚠️  WARNING${NC} - $script_name (optional failure)")
        fi
    fi
}

# Function to run a command and track result
run_command() {
    local command=$1
    local name=$2
    local required=${3:-true}
    
    TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
    
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Running: ${name}${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ PASSED: ${name}${NC}"
        PASSED_SCRIPTS=$((PASSED_SCRIPTS + 1))
        RESULTS+=("${GREEN}✅ PASSED${NC} - $name")
    else
        EXIT_CODE=$?
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ FAILED: ${name} (Exit code: ${EXIT_CODE})${NC}"
            FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
            RESULTS+=("${RED}❌ FAILED${NC} - $name (Exit code: ${EXIT_CODE})")
        else
            echo -e "${YELLOW}⚠️  WARNING: ${name} failed but not required${NC}"
            SKIPPED_SCRIPTS=$((SKIPPED_SCRIPTS + 1))
            RESULTS+=("${YELLOW}⚠️  WARNING${NC} - $name (optional failure)")
        fi
    fi
}

# Start execution
clear
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║         🚀 RUN ALL SCRIPTS 100% - SYSTEM VERIFICATION      ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${MAGENTA}Starting comprehensive system verification...${NC}"
echo -e "${MAGENTA}Date: $(date)${NC}"
echo ""

# =============================================================================
# PHASE 1: AI FEATURES VERIFICATION
# =============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 1: AI Features Verification                        ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_script "scripts/verify-ai-enabled.sh" "AI Features 100% Verification" true

# =============================================================================
# PHASE 2: HEALTH CHECKS & MONITORING
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 2: Health Checks & Monitoring                      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_script "scripts/health-monitor.sh" "Health Monitor" false

# =============================================================================
# PHASE 3: PRE-DEPLOYMENT CHECKS
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 3: Pre-Deployment Checks                           ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_script "scripts/pre-deployment-check.sh" "Pre-Deployment Check" false

# =============================================================================
# PHASE 4: DEPLOYMENT VALIDATION
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 4: Deployment Validation                           ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_script "scripts/validate-deployment.sh" "Deployment Validation" false
run_script "scripts/verify-deployment-ready.sh" "Deployment Readiness" false

# =============================================================================
# PHASE 5: FIREBASE VERIFICATION
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 5: Firebase Verification                           ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_script "scripts/verify-firebase.sh" "Firebase Configuration" false

# =============================================================================
# PHASE 6: SYSTEM VALIDATION
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 6: System Validation                               ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_script "scripts/validation/run-validation.sh" "System Validation" false

# =============================================================================
# PHASE 7: GIT & REPOSITORY CHECKS
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 7: Git & Repository Status                         ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_command "git status --short" "Git Status Check" true
run_command "git log --oneline -5" "Recent Commits" true

# =============================================================================
# PHASE 8: ENVIRONMENT CHECKS
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 8: Environment Configuration                       ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ PASSED: Root .env file exists${NC}"
    PASSED_SCRIPTS=$((PASSED_SCRIPTS + 1))
    RESULTS+=("${GREEN}✅ PASSED${NC} - Root .env file exists")
else
    echo -e "${RED}❌ FAILED: Root .env file not found${NC}"
    FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
    RESULTS+=("${RED}❌ FAILED${NC} - Root .env file not found")
fi

TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
if [ -f "apps/api/.env" ]; then
    echo -e "${GREEN}✅ PASSED: API .env file exists${NC}"
    PASSED_SCRIPTS=$((PASSED_SCRIPTS + 1))
    RESULTS+=("${GREEN}✅ PASSED${NC} - API .env file exists")
else
    echo -e "${RED}❌ FAILED: API .env file not found${NC}"
    FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
    RESULTS+=("${RED}❌ FAILED${NC} - API .env file not found")
fi

TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
if [ -f "apps/web/.env" ]; then
    echo -e "${GREEN}✅ PASSED: Web .env file exists${NC}"
    PASSED_SCRIPTS=$((PASSED_SCRIPTS + 1))
    RESULTS+=("${GREEN}✅ PASSED${NC} - Web .env file exists")
else
    echo -e "${RED}❌ FAILED: Web .env file not found${NC}"
    FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
    RESULTS+=("${RED}❌ FAILED${NC} - Web .env file not found")
fi

# =============================================================================
# PHASE 9: DOCUMENTATION CHECKS
# =============================================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PHASE 9: Documentation Verification                      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

DOCS=("README.md" "AI_ACTIONS_100_ENABLED.md" "QUICK_REFERENCE.md" "CONTRIBUTING.md")
for doc in "${DOCS[@]}"; do
    TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ PASSED: ${doc} exists${NC}"
        PASSED_SCRIPTS=$((PASSED_SCRIPTS + 1))
        RESULTS+=("${GREEN}✅ PASSED${NC} - ${doc} exists")
    else
        echo -e "${YELLOW}⚠️  WARNING: ${doc} not found${NC}"
        SKIPPED_SCRIPTS=$((SKIPPED_SCRIPTS + 1))
        RESULTS+=("${YELLOW}⚠️  WARNING${NC} - ${doc} not found")
    fi
done

# =============================================================================
# FINAL REPORT
# =============================================================================
echo ""
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║                    📊 EXECUTION REPORT                     ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${MAGENTA}Execution completed at: $(date)${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Summary Statistics                                        ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Total Scripts/Checks: ${TOTAL_SCRIPTS}"
echo -e "  ${GREEN}✅ Passed: ${PASSED_SCRIPTS}${NC}"
echo -e "  ${RED}❌ Failed: ${FAILED_SCRIPTS}${NC}"
echo -e "  ${YELLOW}⚠️  Skipped/Warnings: ${SKIPPED_SCRIPTS}${NC}"
echo ""

# Calculate success percentage
if [ $TOTAL_SCRIPTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_SCRIPTS * 100 / TOTAL_SCRIPTS))
    echo -e "  Success Rate: ${SUCCESS_RATE}%"
else
    SUCCESS_RATE=0
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Detailed Results                                          ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

for result in "${RESULTS[@]}"; do
    echo -e "  ${result}"
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Final status
if [ $FAILED_SCRIPTS -eq 0 ]; then
    if [ $SUCCESS_RATE -eq 100 ]; then
        echo -e "${GREEN}🎉 SUCCESS: All scripts executed successfully at 100%!${NC}"
        echo ""
        exit 0
    else
        echo -e "${YELLOW}✅ SUCCESS: Core scripts passed (${SUCCESS_RATE}% success rate)${NC}"
        echo -e "${YELLOW}Some optional checks were skipped or warned.${NC}"
        echo ""
        exit 0
    fi
else
    echo -e "${RED}❌ FAILURE: ${FAILED_SCRIPTS} required script(s) failed${NC}"
    echo -e "${RED}Success rate: ${SUCCESS_RATE}%${NC}"
    echo ""
    echo -e "${YELLOW}Review the detailed results above and fix failing scripts.${NC}"
    echo ""
    exit 1
fi
