#!/bin/bash

###############################################################################
# CLOUDFLARE_SETUP.sh - Automated Cloudflare Global LB Configuration
# 
# Purpose: Set up Cloudflare Global Load Balancer with Origins pointing
#          to Fly.io regions (IAD, IAM, ORD, LAS)
#
# Usage: ./cloudflare-setup.sh [setup|verify|cleanup]
# Requirements: curl, jq, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ZONE_ID="${CLOUDFLARE_ZONE_ID}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
BASE_URL="https://api.cloudflare.com/client/v4"

# Validate environment
if [ -z "$ZONE_ID" ] || [ -z "$API_TOKEN" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN not set${NC}"
    echo "Set them with:"
    echo "  export CLOUDFLARE_ZONE_ID='your-zone-id'"
    echo "  export CLOUDFLARE_API_TOKEN='your-api-token'"
    exit 1
fi

# Logging function
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

# Test API connectivity
test_api() {
    log "Testing Cloudflare API connectivity..."
    
    RESPONSE=$(curl -s -X GET "${BASE_URL}/zones/${ZONE_ID}" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        success "Cloudflare API connection successful"
        ZONE_NAME=$(echo "$RESPONSE" | jq -r '.result.name')
        success "Zone: $ZONE_NAME"
    else
        error "Failed to connect to Cloudflare API"
        echo "$RESPONSE" | jq '.errors'
        exit 1
    fi
}

# Create health check
create_health_check() {
    log "Creating health check for origins..."
    
    RESPONSE=$(curl -s -X POST "${BASE_URL}/zones/${ZONE_ID}/health_checks" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{
            "type": "HTTPS",
            "port": 443,
            "method": "GET",
            "path": "/api/health",
            "interval": 30,
            "timeout": 5,
            "retries": 2,
            "expected_codes": "200",
            "description": "Infamous Freight API health check"
        }')
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        HEALTH_CHECK_ID=$(echo "$RESPONSE" | jq -r '.result.id')
        success "Health check created: $HEALTH_CHECK_ID"
        echo "$HEALTH_CHECK_ID"
    else
        error "Failed to create health check"
        echo "$RESPONSE" | jq '.'
        exit 1
    fi
}

# Create load balancer pool
create_pool() {
    local pool_name="$1"
    local region="$2"
    local origins="$3"
    
    log "Creating pool: $pool_name (Region: $region)"
    
    RESPONSE=$(curl -s -X POST "${BASE_URL}/zones/${ZONE_ID}/load_balancers" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "{
            \"name\": \"${pool_name}\",
            \"description\": \"Pool for Fly.io ${region} region\",
            \"origins\": ${origins},
            \"monitor\": \"\"
        }")
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        POOL_ID=$(echo "$RESPONSE" | jq -r '.result.id')
        success "Pool created: $POOL_ID"
        echo "$POOL_ID"
    else
        error "Failed to create pool: $pool_name"
        echo "$RESPONSE" | jq '.'
        exit 1
    fi
}

# Create DNS records for origins
create_dns_records() {
    log "Creating DNS records for origins..."
    
    declare -A origins=(
        ["api-iad"]="api-iad.fly.dev"
        ["api-iam"]="api-iam.fly.dev"
        ["api-ord"]="api-ord.fly.dev"
        ["api-las"]="api-las.fly.dev"
    )
    
    for subdomain in "${!origins[@]}"; do
        target="${origins[$subdomain]}"
        
        log "Creating DNS record: ${subdomain}.infamous-freight.com -> $target"
        
        curl -s -X POST "${BASE_URL}/zones/${ZONE_ID}/dns_records" \
            -H "Authorization: Bearer ${API_TOKEN}" \
            -H "Content-Type: application/json" \
            --data "{
                \"type\": \"CNAME\",
                \"name\": \"${subdomain}\",
                \"content\": \"${target}\",
                \"ttl\": 300,
                \"proxied\": true,
                \"comment\": \"Infamous Freight - Regional origin\"
            }" > /dev/null
        
        success "DNS record created for $subdomain"
    done
}

# Create main API CNAME (Global LB entry point)
create_api_cname() {
    log "Creating main API CNAME record..."
    
    RESPONSE=$(curl -s -X POST "${BASE_URL}/zones/${ZONE_ID}/dns_records" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{
            "type": "CNAME",
            "name": "api",
            "content": "api-iad.fly.dev",
            "ttl": 300,
            "proxied": true,
            "comment": "Infamous Freight API - Cloudflare Global LB"
        }')
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        success "Main API CNAME created"
    else
        warning "CNAME may already exist"
    fi
}

# Setup function
setup() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Cloudflare Global Load Balancer Setup             ║${NC}"
    echo -e "${BLUE}║  Infamous Freight Enterprises                      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    test_api
    
    # Create health check
    HEALTH_CHECK_ID=$(create_health_check)
    
    # Create DNS records
    create_dns_records
    
    # Create main API CNAME
    create_api_cname
    
    # Save configuration
    cat > /tmp/cloudflare-setup.env << EOF
CLOUDFLARE_ZONE_ID=${ZONE_ID}
CLOUDFLARE_HEALTH_CHECK_ID=${HEALTH_CHECK_ID}
CLOUDFLARE_SETUP_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
EOF
    
    success "Configuration saved to /tmp/cloudflare-setup.env"
    
    echo ""
    echo -e "${GREEN}✅ Setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify DNS propagation: dig api.infamous-freight.com"
    echo "2. Test health checks: ./cloudflare-setup.sh test-health"
    echo "3. Monitor in dashboard: https://dash.cloudflare.com/infamous-freight.com"
}

# Verify setup
verify() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Cloudflare Configuration Verification             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log "Fetching load balancers..."
    LBS=$(curl -s -X GET "${BASE_URL}/zones/${ZONE_ID}/load_balancers" \
        -H "Authorization: Bearer ${API_TOKEN}")
    
    echo "$LBS" | jq '.result[] | {id, name, default_pools, fallback_pool}' || {
        error "No load balancers found"
    }
    
    log "Fetching health checks..."
    HCS=$(curl -s -X GET "${BASE_URL}/zones/${ZONE_ID}/health_checks" \
        -H "Authorization: Bearer ${API_TOKEN}")
    
    echo "$HCS" | jq '.result[] | {id, description, type, interval}' || {
        error "No health checks found"
    }
    
    log "Fetching DNS records..."
    DNS=$(curl -s -X GET "${BASE_URL}/zones/${ZONE_ID}/dns_records?type=CNAME" \
        -H "Authorization: Bearer ${API_TOKEN}")
    
    echo "$DNS" | jq '.result[] | {name, content, proxied}' || {
        error "No DNS records found"
    }
    
    echo ""
    success "Configuration verified"
}

# Test health checks
test_health() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Testing Origin Health Checks                      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    declare -a origins=(
        "api-iad.fly.dev"
        "api-iam.fly.dev"
        "api-ord.fly.dev"
        "api-las.fly.dev"
    )
    
    for origin in "${origins[@]}"; do
        log "Testing $origin..."
        
        RESPONSE=$(curl -s -m 10 -X GET "https://${origin}/api/health" \
            -H "User-Agent: Cloudflare-Health-Check" 2>&1)
        
        if echo "$RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
            STATUS=$(echo "$RESPONSE" | jq -r '.status')
            REGION=$(echo "$RESPONSE" | jq -r '.region // "unknown"')
            success "$origin is healthy (status: $STATUS, region: $REGION)"
        else
            error "$origin health check failed"
            echo "Response: $RESPONSE"
        fi
    done
    
    echo ""
    echo "Testing through Cloudflare (api.infamous-freight.com)..."
    
    for i in {1..3}; do
        RESPONSE=$(curl -s -X GET "https://api.infamous-freight.com/api/health" 2>&1)
        if echo "$RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
            REGION=$(echo "$RESPONSE" | jq -r '.region // "unknown"')
            success "Request $i routed to: $REGION"
        else
            error "Request $i failed"
        fi
        sleep 1
    done
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}⚠️  WARNING: This will remove all Cloudflare LB configuration${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Cleanup cancelled"
        return
    fi
    
    log "Removing load balancers..."
    LBS=$(curl -s -X GET "${BASE_URL}/zones/${ZONE_ID}/load_balancers" \
        -H "Authorization: Bearer ${API_TOKEN}")
    
    echo "$LBS" | jq -r '.result[].id' | while read -r lb_id; do
        curl -s -X DELETE "${BASE_URL}/zones/${ZONE_ID}/load_balancers/${lb_id}" \
            -H "Authorization: Bearer ${API_TOKEN}" > /dev/null
        success "Removed load balancer: $lb_id"
    done
    
    log "Removing health checks..."
    HCS=$(curl -s -X GET "${BASE_URL}/zones/${ZONE_ID}/health_checks" \
        -H "Authorization: Bearer ${API_TOKEN}")
    
    echo "$HCS" | jq -r '.result[].id' | while read -r hc_id; do
        curl -s -X DELETE "${BASE_URL}/zones/${ZONE_ID}/health_checks/${hc_id}" \
            -H "Authorization: Bearer ${API_TOKEN}" > /dev/null
        success "Removed health check: $hc_id"
    done
    
    success "Cleanup complete"
}

# Main
case "${1:-setup}" in
    setup)
        setup
        ;;
    verify)
        verify
        ;;
    test-health)
        test_health
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {setup|verify|test-health|cleanup}"
        echo ""
        echo "Commands:"
        echo "  setup       - Create Cloudflare Global LB configuration"
        echo "  verify      - Verify current configuration"
        echo "  test-health - Test health endpoints"
        echo "  cleanup     - Remove all LB configuration"
        exit 1
        ;;
esac
