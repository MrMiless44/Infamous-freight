#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════════"
echo "🐳 INSTANT PRODUCTION DEPLOYMENT via Docker Compose"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "This will deploy:"
echo "  ✅ PostgreSQL Database"
echo "  ✅ API Server (Express.js)"
echo "  ✅ Nginx Reverse Proxy"
echo ""
echo "Prerequisites:"
echo "  • Docker & Docker Compose installed"
echo "  • Ports 80, 443, 3001, 5432 available"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    echo "Install: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✅ Docker $(docker --version | cut -d' ' -f3)${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose available${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Generate Production Secrets${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✅ Generated JWT_SECRET${NC}"

# Generate DB password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
echo -e "${GREEN}✅ Generated DB_PASSWORD${NC}"

# Create .env file
cat > .env.production.docker << EOF
# Generated on $(date)
# Infamous Freight - Production Environment Variables

# Database
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=infamous_freight
DB_PORT=5432

# API
API_PORT=3001
JWT_SECRET=$JWT_SECRET
NODE_ENV=production

# CORS (Update with your web app URL)
CORS_ORIGINS=https://infamous-freight-enterprises.vercel.app,http://localhost:3000

# AI & Storage
AI_PROVIDER=synthetic
AVATAR_STORAGE=local
LOG_LEVEL=info

# Optional: Add your API keys
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
SENTRY_DSN=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
EOF

echo -e "${GREEN}✅ Created .env.production.docker${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Build Docker Images${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Build images
docker-compose -f docker-compose.full-production.yml --env-file .env.production.docker build

echo -e "${GREEN}✅ Docker images built${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Start Services${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Start services
docker-compose -f docker-compose.full-production.yml --env-file .env.production.docker up -d

echo -e "${GREEN}✅ Services starting...${NC}"
echo ""

# Wait for health checks
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 10

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 4: Run Database Migrations${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Run migrations
docker-compose -f docker-compose.full-production.yml --env-file .env.production.docker \
  exec -T api sh -c "cd api && npx prisma migrate deploy"

echo -e "${GREEN}✅ Database migrations applied${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 5: Verify Health${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Check API health
sleep 3
HEALTH_STATUS=$(curl -s http://localhost:3001/api/health || echo '{"status":"error"}')
echo "API Health: $HEALTH_STATUS"

if echo "$HEALTH_STATUS" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  API health check returned unexpected response${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "  API:      http://localhost:3001"
echo "  Health:   http://localhost:3001/api/health"
echo "  Database: postgresql://localhost:5432/infamous_freight"
echo ""
echo -e "${BLUE}🔐 Credentials (saved in .env.production.docker):${NC}"
echo "  DB Password: $DB_PASSWORD"
echo "  JWT Secret:  [hidden - see .env.production.docker]"
echo ""
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "  View logs:      ${GREEN}docker-compose -f docker-compose.full-production.yml logs -f${NC}"
echo "  Stop services:  ${GREEN}docker-compose -f docker-compose.full-production.yml down${NC}"
echo "  Restart:        ${GREEN}docker-compose -f docker-compose.full-production.yml restart${NC}"
echo "  View status:    ${GREEN}docker-compose -f docker-compose.full-production.yml ps${NC}"
echo ""
echo -e "${YELLOW}⚠️  SECURITY REMINDERS:${NC}"
echo "  1. Change default credentials in .env.production.docker"
echo "  2. Setup SSL/TLS with Nginx (see nginx.conf)"
echo "  3. Configure firewall rules"
echo "  4. Enable automatic backups for postgres_data_prod volume"
echo "  5. Update CORS_ORIGINS with your actual web app URL"
echo ""
echo -e "${BLUE}🌐 Next: Update Vercel environment variable:${NC}"
echo "  NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
