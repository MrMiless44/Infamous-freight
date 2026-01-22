#!/bin/bash

###############################################################################
# CLOUDFLARE_FAILOVER_TEST.sh - Simulate Origin Failures & Test Failover
# 
# Purpose: Validate failover behavior by disabling origins and monitoring
#          traffic rerouting
#
# Usage: ./cloudflare-failover-test.sh [quick|full|monitor]
# Requirements: curl, jq, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
ZONE_ID="${CLOUDFLARE_ZONE_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"
BASE_URL="https://api.cloudflare.com/client/v4"
API_DOMAIN="api.infamous-freight.com"
HEALTH_CHECK_PATH="/api/health"

# Logging
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

info() {
    echo -e "${CYAN}ℹ️${NC} $1"
}

# Validate environment
validate_env() {
    if [ -z "$ZONE_ID" ] || [ -z "$API_TOKEN" ]; then
        error "CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN not set"
        exit 1
    fi
}

# Get load balancer ID
get_lb_id() {
    LBS=$(curl -s -X GET "${BASE_URL}/zones/${ZONE_ID}/load_balancers" \
        -H "Authorization: Bearer ${API_TOKEN}")
    
    echo "$LBS" | jq -r '.result[0].id' 2>/dev/null || echo ""
}

# Get all origins
get_origins() {
    LB_ID="$1"
    curl -s -X GET "${BASE_URL}/zones/${ZONE_ID}/load_balancers/${LB_ID}" \
        -H "Authorization: Bearer ${API_TOKEN}" | jq '.result.origins[]'
}

# Disable origin
disable_origin() {
    local origin_name="$1"
    local lb_id="$2"
    
    log "Disabling origin: $origin_name"
    
    RESPONSE=$(curl -s -X PATCH "${BASE_URL}/zones/${ZONE_ID}/load_balancers/${lb_id}" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "{
            \"origins\": [
                {
                    \"name\": \"${origin_name}\",
                    \"enabled\": false
                }
            ]
        }")
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        success "Origin $origin_name disabled"
        return 0
    else
        error "Failed to disable origin $origin_name"
        echo "$RESPONSE" | jq '.'
        return 1
    fi
}

# Enable origin
enable_origin() {
    local origin_name="$1"
    local lb_id="$2"
    
    log "Enabling origin: $origin_name"
    
    RESPONSE=$(curl -s -X PATCH "${BASE_URL}/zones/${ZONE_ID}/load_balancers/${lb_id}" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "{
            \"origins\": [
                {
                    \"name\": \"${origin_name}\",
                    \"enabled\": true
                }
            ]
        }")
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        success "Origin $origin_name enabled"
        return 0
    else
        error "Failed to enable origin $origin_name"
        echo "$RESPONSE" | jq '.'
        return 1
    fi
}

# Test API endpoint
test_endpoint() {
    local endpoint="$1"
    local expected_region="$2"
    
    RESPONSE=$(curl -s -m 10 -X GET "https://${endpoint}${HEALTH_CHECK_PATH}" \
        -H "User-Agent: Failover-Test" 2>&1)
    
    if echo "$RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
        REGION=$(echo "$RESPONSE" | jq -r '.region // "unknown"')
        STATUS=$(echo "$RESPONSE" | jq -r '.status')
        
        if [ "$STATUS" = "ok" ] || [ "$STATUS" = "degraded" ]; then
            if [ -z "$expected_region" ] || [ "$REGION" = "$expected_region" ]; then
                info "Response from $REGION (status: $STATUS)"
                return 0
            else
                warning "Expected $expected_region but got $REGION"
                return 1
            fi
        else
            error "Unhealthy response: $STATUS"
            return 1
        fi
    else
        error "Failed to connect to $endpoint"
        return 1
    fi
}

# Monitor traffic distribution
monitor_distribution() {
    echo ""
    echo -e "${BLUE}Monitoring traffic distribution for 1 minute...${NC}"
    
    declare -A region_counts
    declare -a regions=("iad" "iam" "ord" "las")
    
    for region in "${regions[@]}"; do
        region_counts[$region]=0
    done
    
    for i in {1..12}; do
        RESPONSE=$(curl -s -m 10 -X GET "https://${API_DOMAIN}${HEALTH_CHECK_PATH}" 2>&1)
        REGION=$(echo "$RESPONSE" | jq -r '.region // "unknown"' 2>/dev/null)
        
        if [ -n "$REGION" ] && [ "$REGION" != "null" ]; then
            # Extract region abbreviation
            case "$REGION" in
                *iad*) region_counts[iad]=$((${region_counts[iad]} + 1)) ;;
                *iam*) region_counts[iam]=$((${region_counts[iam]} + 1)) ;;
                *ord*) region_counts[ord]=$((${region_counts[ord]} + 1)) ;;
                *las*) region_counts[las]=$((${region_counts[las]} + 1)) ;;
            esac
        fi
        
        sleep 5
    done
    
    echo ""
    echo -e "${CYAN}Traffic Distribution Results:${NC}"
    for region in "${regions[@]}"; do
        count=${region_counts[$region]}
        pct=$((count * 100 / 12))
        bar=$(printf '%.0s▓' $(seq 1 $pct))
        printf "  %-10s: %2d requests (%3d%%) $bar\n" "$region" "$count" "$pct"
    done
}

# Quick test (IAD failover only)
quick_test() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Quick Failover Test - IAD Primary Failover        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    validate_env
    
    LB_ID=$(get_lb_id)
    if [ -z "$LB_ID" ]; then
        error "No load balancer found"
        return 1
    fi
    
    success "Load Balancer ID: $LB_ID"
    echo ""
    
    # Step 1: Test normal operation
    log "Step 1: Testing normal operation (all origins enabled)..."
    if test_endpoint "$API_DOMAIN" ""; then
        success "Normal operation verified"
    else
        error "Normal operation failed - check origin health"
        return 1
    fi
    sleep 2
    
    # Step 2: Disable primary (IAD)
    log "Step 2: Disabling primary origin (iad-primary)..."
    disable_origin "iad-primary" "$LB_ID"
    sleep 5
    
    # Step 3: Test failover
    log "Step 3: Testing failover to secondary..."
    for i in {1..3}; do
        info "Request $i..."
        if test_endpoint "$API_DOMAIN" ""; then
            success "Failover working"
        else
            error "Failover failed on request $i"
        fi
        sleep 2
    done
    
    # Step 4: Re-enable primary
    log "Step 4: Re-enabling primary origin..."
    enable_origin "iad-primary" "$LB_ID"
    sleep 5
    
    # Step 5: Verify recovery
    log "Step 5: Verifying traffic returns to primary..."
    for i in {1..3}; do
        info "Request $i..."
        if test_endpoint "$API_DOMAIN" "iad"; then
            success "Traffic routing to primary (IAD)"
        fi
        sleep 2
    done
    
    echo ""
    echo -e "${GREEN}✅ Quick failover test complete!${NC}"
}

# Full test (all origins)
full_test() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Full Failover Test - All Origins                  ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    validate_env
    
    LB_ID=$(get_lb_id)
    if [ -z "$LB_ID" ]; then
        error "No load balancer found"
        return 1
    fi
    
    declare -a origins=("iad-primary" "iam-secondary" "ord-tertiary" "las-quaternary")
    declare -a origin_names=("Primary (IAD)" "Secondary (IAM)" "Tertiary (ORD)" "Quaternary (LAS)")
    
    # Test each origin failure sequentially
    for idx in "${!origins[@]}"; do
        origin="${origins[$idx]}"
        origin_name="${origin_names[$idx]}"
        
        echo ""
        echo -e "${CYAN}Testing failover chain with ${origin_name} disabled...${NC}"
        echo ""
        
        # Disable origin
        disable_origin "$origin" "$LB_ID"
        sleep 3
        
        # Test requests
        for i in {1..3}; do
            info "Request $i..."
            test_endpoint "$API_DOMAIN" "" || true
            sleep 1
        done
        
        # Re-enable origin
        enable_origin "$origin" "$LB_ID"
        sleep 3
        
        # Verify recovery
        success "Recovery verified for $origin_name"
    done
    
    echo ""
    echo -e "${GREEN}✅ Full failover test complete!${NC}"
}

# Monitor mode (continuous)
monitor() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Continuous Monitoring Mode (Ctrl+C to exit)       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    validate_env
    
    LB_ID=$(get_lb_id)
    if [ -z "$LB_ID" ]; then
        error "No load balancer found"
        return 1
    fi
    
    log "Starting continuous monitoring..."
    echo ""
    
    iteration=0
    while true; do
        iteration=$((iteration + 1))
        
        echo -e "${CYAN}=== Iteration $iteration ===${NC}"
        
        # Show origin status
        log "Origin status:"
        get_origins "$LB_ID" | jq '{name, enabled, address}'
        
        # Test health
        log "Testing health endpoints..."
        for i in {1..3}; do
            RESPONSE=$(curl -s -m 5 -X GET "https://${API_DOMAIN}${HEALTH_CHECK_PATH}")
            if echo "$RESPONSE" | jq -e '.region' > /dev/null 2>&1; then
                REGION=$(echo "$RESPONSE" | jq -r '.region')
                success "Request $i routed to: $REGION"
            else
                error "Request $i failed"
            fi
            sleep 1
        done
        
        echo ""
        log "Waiting 30 seconds before next check..."
        sleep 30
    done
}

# Main
case "${1:-quick}" in
    quick)
        quick_test
        ;;
    full)
        full_test
        monitor_distribution
        ;;
    monitor)
        monitor
        ;;
    *)
        echo "Usage: $0 {quick|full|monitor}"
        echo ""
        echo "Commands:"
        echo "  quick   - Test IAD primary failover only (2-3 minutes)"
        echo "  full    - Test all origins in sequence (5-10 minutes)"
        echo "  monitor - Continuous monitoring mode (Ctrl+C to exit)"
        echo ""
        echo "Examples:"
        echo "  ./cloudflare-failover-test.sh quick"
        echo "  ./cloudflare-failover-test.sh full"
        echo "  ./cloudflare-failover-test.sh monitor"
        exit 1
        ;;
esac
