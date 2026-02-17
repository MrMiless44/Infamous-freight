#!/bin/bash
# Kong API Gateway Configuration Script
# Sets up services, routes, and plugins

set -e

KONG_ADMIN_URL=${KONG_ADMIN_URL:-"http://localhost:8001"}

echo "Configuring Kong API Gateway..."

# Function to create service
create_service() {
    local name=$1
    local url=$2
    
    curl -s -X POST "$KONG_ADMIN_URL/services" \
        -d "name=$name" \
        -d "url=$url" \
        -d "retries=5" \
        -d "connect_timeout=10000" \
        -d "read_timeout=60000" \
        -d "write_timeout=60000" \
        --header "Content-Type: application/x-www-form-urlencoded"
    
    echo "✓ Service '$name' created"
}

# Function to create route
create_route() {
    local service=$1
    local paths=$2
    local methods=${3:-"GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"}
    
    curl -s -X POST "$KONG_ADMIN_URL/services/$service/routes" \
        -d "paths=$paths" \
        -d "methods=$methods" \
        -d "strip_path=true" \
        --header "Content-Type: application/x-www-form-urlencoded"
    
    echo "✓ Route '$paths' created for service '$service'"
}

# Function to enable plugin on route
enable_plugin() {
    local service=$1
    local plugin=$2
    shift 2
    local config=("$@")
    
    local config_str=""
    for cfg in "${config[@]}"; do
        config_str="$config_str -d \"$cfg\""
    done
    
    eval "curl -s -X POST \"$KONG_ADMIN_URL/services/$service/plugins\" \
        -d \"name=$plugin\" \
        $config_str \
        --header \"Content-Type: application/x-www-form-urlencoded\""
    
    echo "✓ Plugin '$plugin' enabled for service '$service'"
}

# Wait for Kong to be ready
echo "Waiting for Kong to be ready..."
for i in {1..30}; do
    if curl -s "$KONG_ADMIN_URL/status" > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

# 1. Create Upstream API Service
create_service "api-upstream" "http://api:4000"

# 2. Create routes for API
create_route "api-upstream" "~/api/.*" "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"

# 3. Enable rate limiting
enable_plugin "api-upstream" "rate-limiting" \
    "config.minute=1000" \
    "config.hour=10000" \
    "config.policy=redis" \
    "config.redis_host=redis" \
    "config.redis_port=6379"

# 4. Enable authentication (API Key)
enable_plugin "api-upstream" "key-auth" \
    "config.key_names=apikey" \
    "config.run_on_preflight=true"

# 5. Enable request validation
enable_plugin "api-upstream" "request-validator" \
    "config.body_schema={\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}}}"

# 6. Enable response transformation
enable_plugin "api-upstream" "response-transformer" \
    "config.add.headers=X-API-Gateway:Kong/3.0"

# 7. Enable logging
enable_plugin "api-upstream" "file-log" \
    "config.path=/var/log/kong/api.log"

# 8. Enable request size limiting
enable_plugin "api-upstream" "request-size-limiting" \
    "config.allowed_payload_size=10"

# 9. Enable ACL (Access Control List)
enable_plugin "api-upstream" "acl" \
    "config.whitelist=admin,api-users"

# 10. Enable correlation ID
enable_plugin "api-upstream" "correlation-id" \
    "config.header_name=X-Correlation-ID" \
    "config.generator=uuid#counter"

# 11. Create consumers
echo ""
echo "Creating Kong consumers..."

create_consumer() {
    local username=$1
    local custom_id=$2
    
    curl -s -X POST "$KONG_ADMIN_URL/consumers" \
        -d "username=$username" \
        -d "custom_id=$custom_id" \
        --header "Content-Type: application/x-www-form-urlencoded" > /dev/null
    
    echo "✓ Consumer '$username' created"
}

create_consumer "api-admin" "admin-user-1"
create_consumer "api-user" "regular-user-1"

# 12. Create API keys for consumers
echo ""
echo "Creating API keys..."

create_api_key() {
    local consumer=$1
    local key=${2:-$(openssl rand -base64 32)}
    
    curl -s -X POST "$KONG_ADMIN_URL/consumers/$consumer/key-auth" \
        -d "key=$key" \
        --header "Content-Type: application/x-www-form-urlencoded" > /dev/null
    
    echo "✓ API key created for '$consumer': $key"
}

create_api_key "api-admin"
create_api_key "api-user"

# 13. Add ACL groups
echo ""
echo "Setting up ACL groups..."

add_acl() {
    local consumer=$1
    local group=$2
    
    curl -s -X POST "$KONG_ADMIN_URL/consumers/$consumer/acls" \
        -d "group=$group" \
        --header "Content-Type: application/x-www-form-urlencoded" > /dev/null
    
    echo "✓ Consumer '$consumer' added to group '$group'"
}

add_acl "api-admin" "admin"
add_acl "api-user" "api-users"

echo ""
echo "Kong configuration completed!"
echo ""
echo "Admin UI: http://localhost:1337"
echo "API Proxy: http://localhost:8000"
echo "Admin API: http://localhost:8001"
echo ""
echo "Test API call:"
echo "curl http://localhost:8000/api/shipments -H \"apikey: <your-api-key>\""
