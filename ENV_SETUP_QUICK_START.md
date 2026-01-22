# ⚡ Environment Setup - Quick Start (5 Minutes)

## Copy-Paste Commands

### 1. Generate JWT Secret
```bash
export JWT_SECRET="$(openssl rand -base64 32)"
echo "Generated JWT_SECRET: $JWT_SECRET"
```

### 2. Create .env.local
```bash
cat > /workspaces/Infamous-freight-enterprises/.env.local << 'EOF'
# Authentication
JWT_SECRET="your-strong-random-value-from-step-1"

# Database (update with your connection string)
DATABASE_URL="postgresql://user:password@localhost:5432/infamouz_freight"

# Frontend CORS (update to match your domain)
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

# Performance
SLOW_QUERY_THRESHOLD_MS="1000"
RESPONSE_CACHE_TTL_MINUTES="5"
RESPONSE_CACHE_MAX_ENTRIES="1000"

# API Server
API_PORT="4000"
LOG_LEVEL="info"

# Rate Limiting (optional - defaults are good for most cases)
RATE_LIMIT_GENERAL_MAX="100"
RATE_LIMIT_AUTH_MAX="5"
RATE_LIMIT_AI_MAX="20"
RATE_LIMIT_BILLING_MAX="30"

# Optional: Sentry Error Tracking
# SENTRY_DSN="https://your-key@sentry.io/project"

# Optional: Datadog Monitoring
# DD_TRACE_ENABLED="true"
# DD_ENV="development"
EOF

cat .env.local  # Verify the file was created
```

### 3. Verify Environment Variables
```bash
# Check required vars are present
source .env.local
echo "✅ JWT_SECRET: ${JWT_SECRET:0:10}..."
echo "✅ DATABASE_URL: $DATABASE_URL"
echo "✅ CORS_ORIGINS: $CORS_ORIGINS"
```

---

## For Docker Deployment

### 1. Create .env.docker
```bash
cat > /workspaces/Infamous-freight-enterprises/.env.docker << 'EOF'
# Same as above, but DATABASE_URL points to Docker Postgres
DATABASE_URL="postgresql://postgres:postgres@db:5432/infamouz_freight"
API_PORT="3001"
NODE_ENV="production"
EOF
```

### 2. Update docker-compose.yml
```yaml
services:
  api:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
      - CORS_ORIGINS=${CORS_ORIGINS}
      - SLOW_QUERY_THRESHOLD_MS=${SLOW_QUERY_THRESHOLD_MS}
      - API_PORT=${API_PORT}
```

### 3. Deploy
```bash
docker-compose --env-file .env.docker up -d
docker-compose logs -f api  # Watch logs
```

---

## Verification Checklist

```bash
# 1. API Health
curl http://localhost:4000/api/health

# Expected: 
# {
#   "uptime": 123.45,
#   "timestamp": 1674000000000,
#   "status": "ok",
#   "database": "connected"
# }

# 2. Metrics Endpoint
curl http://localhost:4000/api/metrics | head -5

# Expected: Prometheus text format
# # HELP http_request_duration_seconds HTTP request latency
# # TYPE http_request_duration_seconds histogram
# http_request_duration_seconds_bucket{le="0.1"} 42

# 3. Auth Required
curl -X GET http://localhost:4000/api/shipments

# Expected: 401 Unauthorized
# {"error":"Missing bearer token"}
```

---

## Environment Variables Reference

| Variable | Default | Purpose | Required |
|----------|---------|---------|----------|
| `JWT_SECRET` | (none) | Signing key for JWT tokens | ✅ YES |
| `DATABASE_URL` | (none) | PostgreSQL connection string | ✅ YES |
| `CORS_ORIGINS` | `*` | Allowed CORS origins | ✅ YES |
| `API_PORT` | `4000` | Server port | ❌ No |
| `SLOW_QUERY_THRESHOLD_MS` | `1000` | Log queries slower than this | ❌ No |
| `RESPONSE_CACHE_TTL_MINUTES` | `5` | Cache expiration time | ❌ No |
| `RESPONSE_CACHE_MAX_ENTRIES` | `1000` | Max cache size per path | ❌ No |
| `SENTRY_DSN` | (none) | Error tracking endpoint | ❌ No |
| `LOG_LEVEL` | `info` | Logging verbosity | ❌ No |
| `NODE_ENV` | `development` | Deployment environment | ❌ No |

---

## Troubleshooting

**"JWT_SECRET not found"**
```bash
echo "DEBUG: JWT_SECRET is ${JWT_SECRET:-(NOT SET)}"
source .env.local  # Re-source the file
```

**"Cannot connect to database"**
```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"

# If it fails, check:
# 1. DATABASE_URL format: postgresql://user:pass@host:port/db
# 2. Postgres is running: docker-compose logs db
# 3. Credentials are correct
```

**"CORS errors in browser"**
```bash
# Update CORS_ORIGINS to include your frontend domain
export CORS_ORIGINS="http://localhost:3000,https://myapp.com"

# Verify it's set
echo $CORS_ORIGINS
```

---

## Next Steps

1. ✅ Set environment variables (this file)
2. 🔄 Run verification script: `bash scripts/verify-implementation.sh`
3. 🧪 Run tests: `pnpm --filter api test`
4. 🚀 Start API: `pnpm api:dev` or `npm start --prefix api`
5. 📊 Monitor logs and metrics

---

**Ready to deploy?** → See [DEPLOY_NOW_CHECKLIST.md](DEPLOY_NOW_CHECKLIST.md)
