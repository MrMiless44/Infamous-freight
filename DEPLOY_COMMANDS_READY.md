# ⚡ DEPLOYMENT COMMANDS - Copy & Paste Ready

## 🎯 ONE-LINE DEPLOYMENT (Choose Your Platform)

### ✅ Docker (Local/Staging)
```bash
# Full deployment in one command
export JWT_SECRET="$(openssl rand -base64 32)" && \
echo "JWT_SECRET=$JWT_SECRET" >> .env.local && \
docker-compose up -d && \
sleep 10 && \
curl http://localhost:3001/api/health
```

### ✅ Kubernetes (Production)
```bash
# Set secrets, deploy, verify
kubectl create secret generic infamouz-freight-secrets \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" && \
kubectl apply -f k8s/deployment.yaml && \
kubectl rollout status deployment/infamouz-freight-api
```

### ✅ Heroku
```bash
# Deploy and set config
heroku create infamouz-freight-api && \
heroku config:set JWT_SECRET="$(openssl rand -base64 32)" && \
heroku config:set DATABASE_URL="<your-db-url>" && \
git push heroku main
```

### ✅ Vercel (Next.js only)
```bash
cd web && \
vercel env add JWT_SECRET "$(openssl rand -base64 32)" && \
vercel deploy --prod
```

---

## 📋 STEP-BY-STEP DEPLOYMENT SEQUENCE

### Phase 1: Verification (5 min)
```bash
# 1. Verify all implementations
bash scripts/verify-implementation.sh

# Expected output: All ✅ marks, 0 ❌ marks
```

### Phase 2: Environment Setup (5 min)
```bash
# 2. Create .env.local file
cat > .env.local << 'EOF'
JWT_SECRET="$(openssl rand -base64 32)"
DATABASE_URL="postgresql://user:pass@host:5432/db"
CORS_ORIGINS="https://frontend.domain.com"
SLOW_QUERY_THRESHOLD_MS="1000"
API_PORT="4000"
LOG_LEVEL="info"
EOF

# 3. Verify environment variables
source .env.local
echo "✅ JWT_SECRET: ${JWT_SECRET:0:10}..."
echo "✅ DATABASE_URL: $DATABASE_URL"
echo "✅ CORS_ORIGINS: $CORS_ORIGINS"
```

### Phase 3: Build & Migrate (10 min)
```bash
# 4. Install dependencies
pnpm install

# 5. Build shared package
pnpm --filter @infamous-freight/shared build

# 6. Generate Prisma client
cd api && pnpm prisma:generate

# 7. Run database migrations
pnpm prisma:migrate:deploy

# 8. Verify database connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Phase 4: Test (10 min)
```bash
# 9. Run all tests
pnpm --filter api test

# Expected: All tests passing ✅

# 10. Run integration tests
pnpm --filter api test -- security-performance.integration.test.js

# Expected: 20+ test cases passing
```

### Phase 5: Start Locally (5 min)
```bash
# 11. Start API server (development)
pnpm api:dev

# 12. In another terminal, verify endpoints
curl http://localhost:4000/api/health
curl http://localhost:4000/api/metrics | head -10
```

### Phase 6: Deploy to Production (15 min - Choose ONE)

#### Option A: Docker (Most Common)
```bash
# Build image
docker build -f api/Dockerfile -t infamouz-freight-api:latest .

# Start containers
docker-compose --env-file .env.docker up -d

# Monitor logs
docker-compose logs -f api

# Verify deployment
curl http://localhost:3001/api/health
```

#### Option B: Kubernetes
```bash
# Create namespace
kubectl create namespace infamouz-freight

# Create secrets
kubectl create secret generic infamouz-freight-secrets \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  -n infamouz-freight

# Apply deployment
kubectl apply -f k8s/deployment.yaml -n infamouz-freight

# Monitor rollout
kubectl rollout status deployment/infamouz-freight-api -n infamouz-freight

# Get pod status
kubectl get pods -n infamouz-freight
```

#### Option C: Heroku
```bash
# Login to Heroku
heroku login

# Create app
heroku create infamouz-freight-api

# Set config variables
heroku config:set \
  JWT_SECRET="$JWT_SECRET" \
  DATABASE_URL="$DATABASE_URL" \
  CORS_ORIGINS="https://app.domain.com"

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Option D: AWS (ECS)
```bash
# Push image to ECR
aws ecr get-login-password --region us-east-1 | \
docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

docker tag infamouz-freight-api:latest \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/infamouz-freight-api:latest

docker push \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/infamouz-freight-api:latest

# Update ECS service
aws ecs update-service \
  --cluster infamouz-freight \
  --service infamouz-freight-api \
  --force-new-deployment
```

### Phase 7: Post-Deployment Validation (10 min)
```bash
# 13. Health check
curl -v https://api.domain.com/api/health

# Expected response:
# {
#   "uptime": 123.45,
#   "timestamp": 1674000000000,
#   "status": "ok",
#   "database": "connected"
# }

# 14. Verify metrics endpoint
curl https://api.domain.com/api/metrics | head -10

# Expected: Prometheus text format with http_request_duration_seconds

# 15. Test authentication
curl https://api.domain.com/api/shipments

# Expected: 401 Unauthorized
# {"error":"Missing bearer token"}

# 16. Test rate limiting
for i in {1..150}; do curl -s https://api.domain.com/api/health; done | \
  grep -c "429"

# Expected: Some 429 responses after 100+ requests in 15 min window

# 17. Monitor logs for slow queries
tail -f /var/log/api.log | grep "SLOW_QUERY"

# Expected: Queries >1000ms logged as warnings
```

---

## 🔧 TROUBLESHOOTING COMMANDS

### Environment Issues
```bash
# Check if all required vars are set
echo "JWT_SECRET: ${JWT_SECRET:-(NOT SET)}"
echo "DATABASE_URL: ${DATABASE_URL:-(NOT SET)}"
echo "CORS_ORIGINS: ${CORS_ORIGINS:-(NOT SET)}"

# Test database connection
psql "$DATABASE_URL" -c "SELECT 1"

# Generate strong JWT secret
openssl rand -base64 32
```

### Deployment Issues
```bash
# Docker: Check logs
docker-compose logs api | tail -50

# Kubernetes: Check pod logs
kubectl logs -n infamouz-freight deployment/infamouz-freight-api -f

# Heroku: Check logs
heroku logs --tail --app infamouz-freight-api
```

### Performance Issues
```bash
# Check slow queries
grep "SLOW_QUERY" api.log | tail -20

# Check metrics export
curl http://localhost:4000/api/metrics | grep http_request_duration

# Monitor cache effectiveness
curl http://localhost:4000/api/shipments -H "Authorization: Bearer $TOKEN" | \
  grep -i "x-cache"
```

### Rollback Commands
```bash
# Docker: Stop and revert
docker-compose down
git checkout HEAD~1
docker-compose up -d

# Kubernetes: Rollback deployment
kubectl rollout undo deployment/infamouz-freight-api -n infamouz-freight
kubectl rollout status deployment/infamouz-freight-api -n infamouz-freight

# Heroku: Rollback release
heroku releases --app infamouz-freight-api
heroku rollback v123 --app infamouz-freight-api

# Database: Rollback migration
cd api && pnpm prisma:migrate:resolve --rolled-back <migration-name>
```

---

## 📊 MONITORING COMMANDS

```bash
# Real-time metrics
watch -n 5 "curl -s http://localhost:4000/api/metrics | grep http_request_duration"

# Check request latencies
curl -s http://localhost:4000/api/metrics | grep http_request_duration_seconds | head -20

# Monitor rate limit metrics
curl -s http://localhost:4000/api/metrics | grep rate_limit

# Check slow query rate
tail -f api.log | grep -c "SLOW_QUERY" | xargs -I {} echo "Slow queries: {}"

# Monitor error rate
tail -f api.log | grep "error" | wc -l
```

---

## 🔐 SECURITY VERIFICATION COMMANDS

```bash
# Verify CORS headers
curl -i -X OPTIONS http://localhost:4000/api/shipments \
  -H "Origin: http://localhost:3000" | grep -i "access-control"

# Verify CSP header
curl -i http://localhost:4000/api/health | grep -i "content-security-policy"

# Verify HSTS header
curl -i https://api.domain.com/api/health | grep -i "strict-transport-security"

# Test auth enforcement
curl -X GET http://localhost:4000/api/shipments -H "Content-Type: application/json"

# Test org boundary enforcement (need valid JWT without org_id)
EXPIRED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X GET http://localhost:4000/api/shipments \
  -H "Authorization: Bearer $EXPIRED_TOKEN"
```

---

## 📈 PERFORMANCE VERIFICATION COMMANDS

```bash
# Measure request latency (P50)
for i in {1..100}; do \
  time curl -s http://localhost:4000/api/health > /dev/null; \
done

# Test response cache effectiveness
# First request (cache miss)
time curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/shipments > /dev/null

# Second request (cache hit - should be faster)
time curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/shipments > /dev/null

# Monitor cache header
curl -i -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/shipments | grep -i "x-cache"
```

---

## 🎯 QUICK HEALTH CHECK (After Deployment)

```bash
#!/bin/bash
# Save as health-check.sh and run: bash health-check.sh

API_URL="${1:-http://localhost:4000}"
echo "🔍 Running health checks against: $API_URL"

# 1. Health endpoint
echo -n "Health endpoint... "
HEALTH=$(curl -s "$API_URL/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅"
else
  echo "❌ Response: $HEALTH"
fi

# 2. Metrics endpoint
echo -n "Metrics endpoint... "
METRICS=$(curl -s "$API_URL/api/metrics")
if echo "$METRICS" | grep -q "http_request_duration"; then
  echo "✅"
else
  echo "❌"
fi

# 3. Auth enforcement
echo -n "Auth enforcement... "
AUTH=$(curl -s "$API_URL/api/shipments")
if echo "$AUTH" | grep -q "Missing bearer token"; then
  echo "✅"
else
  echo "❌ Response: $AUTH"
fi

# 4. CORS headers
echo -n "CORS headers... "
CORS=$(curl -s -I "$API_URL/api/health" | grep -i "access-control-allow")
if [ ! -z "$CORS" ]; then
  echo "✅"
else
  echo "⚠️  No CORS headers detected"
fi

echo "✅ All critical checks passed!"
```

---

## 📝 DEPLOYMENT CHECKLIST

```bash
# Pre-deployment
[ ] bash scripts/verify-implementation.sh → 100% ✅
[ ] source .env.local
[ ] psql "$DATABASE_URL" -c "SELECT 1" → Works ✅

# Build & migrate
[ ] pnpm install → Completes ✅
[ ] pnpm --filter @infamous-freight/shared build → Success ✅
[ ] cd api && pnpm prisma:migrate:deploy → Success ✅

# Testing
[ ] pnpm --filter api test → All passing ✅
[ ] pnpm api:dev → Server starts ✅
[ ] curl http://localhost:4000/api/health → 200 OK ✅

# Deployment
[ ] Choose platform (Docker/K8s/Heroku/etc)
[ ] Execute deployment command
[ ] Verify health endpoint → 200 OK ✅
[ ] Verify metrics endpoint → Prometheus format ✅
[ ] Verify auth → 401 without token ✅

# Post-deployment
[ ] Monitor logs for 10 minutes
[ ] Check error rate (should be ~0%)
[ ] Verify slow query detection working
[ ] Confirm cache hit rate increasing
[ ] All success criteria met → Ready! ✅
```

---

**Ready to deploy?** Copy commands from above and execute in order.

**Need help?** See [DEPLOY_NOW_CHECKLIST.md](DEPLOY_NOW_CHECKLIST.md)

**Generated**: January 21, 2026
