#!/bin/bash

# Quick Start Guide

# Get everything running in 30 minutes

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════╗
║ 🚀 QUICK START GUIDE 🚀 ║
║ Infamous Freight Enterprises - 30 Minute Setup ║
╚════════════════════════════════════════════════════════════════════╝

⏱️ Total Time: ~30 minutes
💼 What you'll have: Production-ready platform deployed

📋 PREREQUISITES (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Required:
✓ Fly.io account (https://fly.io/app/sign-up)
✓ GitHub account (already have it)
✓ flyctl installed (curl -L https://fly.io/install.sh | sh)
✓ gh CLI installed (optional, for automation)

Recommended:
✓ Sentry account (https://sentry.io/signup/)
✓ Uptime Robot account (https://uptimerobot.com/)

🎯 STEP-BY-STEP (25 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️ PHASE 1: GitHub Secrets (5 minutes)
─────────────────────────────────────────

This enables auto-deployment on every git push.

Option A: Interactive Script
$ ./scripts/setup-github-secrets.sh

Option B: Manual Setup

1. Get Fly.io token:
   $ flyctl auth token

2. Add to GitHub Secrets:
   https://github.com/MrMiless44/Infamous-freight-enterprises/settings/secrets/actions

   Name: FLY_API_TOKEN
   Value: <paste-token>

Status: ✅ CI/CD now automated

⏱️ PHASE 2: Fly.io Infrastructure (10 minutes)
────────────────────────────────────────────

This creates your API, database, and deploys everything.

Option A: Interactive Script
$ ./scripts/create-fly-apps.sh

This script will:

- Guide you to create infamous-freight-api
- Guide you to create infamous-freight-db
- Attach database to API
- Deploy API
- Run migrations
- Verify health checks

Option B: Manual Steps

1. Create API app:
   https://fly.io/dashboard → Create App → infamous-freight-api

2. Create Database:
   https://fly.io/dashboard → Create App → infamous-freight-db (PostgreSQL)

3. Attach database:
   $ flyctl postgres attach infamous-freight-db --app infamous-freight-api

4. Deploy:
   $ flyctl deploy --config fly.api.toml --app infamous-freight-api

5. Run migrations:
   $ flyctl ssh console --app infamous-freight-api
   $ cd api && npx prisma migrate deploy
   $ exit

Status: ✅ API running at https://infamous-freight-api.fly.dev

⏱️ PHASE 3: Monitoring (5 minutes)
─────────────────────────────────────────

Optional but highly recommended.

Option A: Interactive Script
$ ./scripts/setup-monitoring-services.sh

Configures:

- Sentry (error tracking)
- Datadog (APM)
- Uptime Robot (health checks)

Option B: Manual Setup (Choose at least 1)

Sentry (Error Tracking): 1. Sign up: https://sentry.io/signup/ 2. Create project: infamous-freight-api 3. Get DSN 4. Set secret:
$ flyctl secrets set SENTRY_DSN="https://xxx@sentry.io/xxx" \
 --app infamous-freight-api

Status: ✅ Errors tracked and alerted

⏱️ PHASE 4: Verify Everything (5 minutes)
─────────────────────────────────────────

Test that everything works.

1. Check Web:
   $ curl https://infamous-freight-enterprises.fly.dev/
   Expected: HTTP 200 OK

2. Check API:
   $ curl https://infamous-freight-api.fly.dev/api/health
   Expected: {"status":"ok","database":"connected", ...}

3. Check API Docs:
   $ open https://infamous-freight-api.fly.dev/api/docs
   Expected: Swagger documentation loads

4. View Logs:
   $ flyctl logs --app infamous-freight-api --tail 50

Status: ✅ Everything running!

✅ YOU'RE DONE IN 30 MINUTES!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Platform is Now Live:
🌐 Web: https://infamous-freight-enterprises.fly.dev
🔌 API: https://infamous-freight-api.fly.dev
📚 Docs: https://infamous-freight-api.fly.dev/api/docs
📊 Health: https://infamous-freight-api.fly.dev/api/health

🚀 AUTOMATED DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now every time you push to main, it automatically:

1. Runs tests
2. Builds Docker images
3. Deploys to Fly.io
4. Runs database migrations
5. Verifies health checks

Just push:
$ git push origin main

💡 NEXT STEPS (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save Money (73% reduction):
$ ./scripts/optimize-costs.sh

Moves to:

- Vercel for web (FREE)
- Neon for database (FREE - 512MB)
- Upstash for Redis (FREE - 10K req/day)
- Result: $0-3/month instead of $11/month

Add AI Features:
$ flyctl secrets set AI_PROVIDER="openai" --app infamous-freight-api
$ flyctl secrets set OPENAI_API_KEY="sk-..." --app infamous-freight-api

Add Billing:
$ flyctl secrets set STRIPE*SECRET_KEY="sk_live*..." --app infamous-freight-api

📞 NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentation:

- Setup: docs/PRODUCTION_COMPLETE_GUIDE.md
- Secrets: docs/PRODUCTION_SECRETS.md
- Security: docs/SECURITY_HARDENING.md
- Index: docs/100_PERCENT_COMPLETE_INDEX.md

Automated Guides:

- $ ./scripts/orchestrate-setup.sh (interactive menu)
- $ ./scripts/setup-github-secrets.sh
- $ ./scripts/create-fly-apps.sh
- $ ./scripts/setup-monitoring-services.sh
- $ ./scripts/optimize-costs.sh

Troubleshooting:

- Check logs: flyctl logs --app infamous-freight-api --tail 100
- Check status: flyctl status --app infamous-freight-api
- SSH console: flyctl ssh console --app infamous-freight-api

🎉 YOU NOW HAVE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Production-ready infrastructure
✅ Automated CI/CD deployments
✅ Enterprise-grade security (rate limiting, JWT, CORS, etc)
✅ Comprehensive API documentation (Swagger/OpenAPI)
✅ Error tracking (Sentry)
✅ Health monitoring
✅ Redis caching
✅ Database with auto-backups
✅ Automatic scaling
✅ 99.9% uptime guaranteed by Fly.io

All with:
• Zero downtime deployments
• Automatic rollbacks on failure
• Load balancing
• Global CDN
• Free SSL/TLS

Cost: $0-3/month (with free tier optimization)

💪 You're Production Ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Start using your platform:

API Endpoints:
POST /api/shipments - Create shipment
GET /api/shipments/:id - Get shipment
POST /api/commands - AI commands
POST /api/billing - Billing operations
GET /api/health - Health check

Documentation:
/api/docs - Full API documentation

📈 SCALE WHEN READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When you're ready to scale:

Horizontal (More instances):
$ flyctl scale count 3 --app infamous-freight-api

Vertical (More power):
$ flyctl scale memory 1024 --app infamous-freight-api

Database:
Upgrade Postgres plan on Fly.io or migrate to higher-tier provider

Global:
Already distributed globally via Fly.io regional deployment

🎓 LEARNING MORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resources:

- Fly.io Docs: https://fly.io/docs/
- Express.js: https://expressjs.com/
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs/
- Docker: https://docs.docker.com/

Community:

- Fly.io Slack: https://fly.io/slack
- GitHub Discussions: https://github.com/MrMiless44/Infamous-freight-enterprises/discussions

╔════════════════════════════════════════════════════════════════════╗
║ 🏆 YOU'RE ALL SET! 🏆 ║
║ Happy Shipping with Infamous Freight! 🚚 ║
╚════════════════════════════════════════════════════════════════════╝

EOF
