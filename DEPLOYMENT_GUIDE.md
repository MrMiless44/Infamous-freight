# 🚀 Deployment Guide - Infamous Freight Enterprises

**Created**: February 1, 2026
**Status**: Production Ready
**Target Platforms**: Vercel (Web), Fly.io (API), Cloud Run (Services)

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass: `pnpm test`
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Bundle analysis reviewed: `pnpm --filter web build:analyze`
- [ ] Performance budgets met (First Load JS < 150KB)

### Security
- [ ] No secrets in code: `git log -p | grep -E "password|secret|token"` (check last 10 commits)
- [ ] Dependencies audited: `pnpm audit`
- [ ] Environment variables configured
- [ ] CORS settings correct for production

### Documentation
- [ ] Changelog updated
- [ ] API documentation current
- [ ] Deployment runbook prepared
- [ ] Rollback plan documented

---

## 🌐 Web App Deployment (Vercel)

### Automatic Deployment
The web app automatically deploys on push to `main`:

```bash
# Vercel is already configured via web/.vercel/
# Just push to main and Vercel handles the rest
git push origin main
```

### Manual Deployment
```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from apps/web directory
cd apps/web
vercel deploy --prod
```

### Environment Variables (Vercel)
Set in Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://api.infamousfreight.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_ENV=production
```

### Build Configuration
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Root Directory**: `apps/web`

---

## 🐳 API Deployment (Fly.io)

### Initial Setup
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app (one-time)
fly launch --dockerfile Dockerfile.api
```

### Deploy
```bash
# Generate new machine image and deploy
fly deploy

# Or specific version
fly deploy --image infamous-freight-api:v1.2.0
```

### Monitor
```bash
# View logs
fly logs

# Check status
fly status

# Scale machines
fly scale count 2  # 2 instances
fly scale memory 512  # 512MB RAM each
```

### Environment Variables
```bash
# Set secrets on Fly
fly secrets set DATABASE_URL=postgresql://...
fly secrets set JWT_SECRET=your_secret_key
fly secrets set STRIPE_SECRET_KEY=sk_live_...
fly secrets set AI_PROVIDER=openai

# View all secrets
fly secrets list
```

---

## 🛠️ Service Deployments

### AI Services (Cloud Run)
```bash
# Build image
docker build -f apps/ai/Dockerfile -t ai-service:latest .

# Deploy to Cloud Run
gcloud run deploy inferior-freight-ai \
  --image ai-service:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars AI_PROVIDER=openai
```

### Mobile App (Expo)
```bash
# Publish to EAS
cd apps/mobile
eas build --platform all
eas submit --platform all
```

---

## 🔄 Rollback Procedures

### Web App (Vercel)
```bash
# View deployment history
vercel list

# Rollback to previous deployment
vercel rollback
```

### API (Fly.io)
```bash
# View release history
fly releases

# Rollback to previous release
fly releases rollback
```

### Database Migrations
```bash
# Check migration status
pnpm prisma migrate status

# Rollback last migration
pnpm prisma migrate resolve --rolled-back migration_name
```

---

## 📊 Monitoring & Alerts

### Application Monitoring
- **Sentry**: Error tracking at https://sentry.infamousfreight.com
- **Datadog**: Performance monitoring and logs
- **Vercel Analytics**: Web app performance metrics
- **Fly.io Dashboard**: API health and metrics

### Health Checks
```bash
# API health check
curl https://api.infamousfreight.com/api/health

# Expected response:
# {
#   "uptime": 123456,
#   "timestamp": 1234567890,
#   "status": "ok",
#   "database": "connected"
# }
```

### Log Aggregation
```bash
# Vercel logs (web app)
vercel logs

# Fly.io logs (API)
fly logs

# Datadog (centralized)
# Dashboard at: app.datadoghq.com
```

---

## 🔐 Security Hardening

### Pre-Production
1. Review all environment variables are set
2. Verify CORS whitelisting
3. Check rate limiting is enabled
4. Verify authentication scopes
5. Audit database access controls

### Post-Deployment
1. Monitor error rates: target < 0.1%
2. Check security headers: `curl -I https://infamousfreight.com`
3. Verify certificate validity
4. Test API authentication
5. Confirm email notifications work

### Headers Check
```bash
# Should see security headers
curl -I https://infamousfreight.com | grep -E "X-Frame|CSP|HSTS"

# Expected:
# X-Frame-Options: DENY
# Content-Security-Policy: ...
# Strict-Transport-Security: max-age=...
```

---

## 📈 Performance Targets

### Web App
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 150KB (First Load JS)

### API
- **Response Time (p50)**: < 100ms
- **Response Time (p95)**: < 500ms
- **Response Time (p99)**: < 1000ms
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%

### Database
- **Query Time (p50)**: < 50ms
- **Connection Pool**: 20-50 connections
- **Replication Lag**: < 1s

---

## 🚨 Incident Response

### Critical Issues
1. Check Sentry for error spikes
2. View API logs for failures
3. Check database connectivity
4. Review recent deployments
5. Execute rollback if necessary

### Common Issues

**High Memory Usage**
```bash
# Fly.io
fly scale memory 1024  # Increase RAM

# Cloud Run
gcloud run deploy --memory=2Gi
```

**High Error Rate**
```bash
# Check logs for errors
fly logs --level error

# Rollback deployment
fly releases rollback
```

**Database Connection Issues**
```bash
# Check Prisma connection
pnpm prisma studio

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

---

## 📝 Deployment Checklist

### 24 Hours Before
- [ ] Code review complete
- [ ] Tests passing on CI/CD
- [ ] Performance targets met
- [ ] Database migration tested
- [ ] Rollback plan prepared

### 1 Hour Before
- [ ] Notify team of deployment
- [ ] Clear cache if needed
- [ ] Have monitoring dashboard open
- [ ] Have rollback procedure ready
- [ ] Document deployment start time

### During Deployment
- [ ] Monitor error rates (Sentry)
- [ ] Watch API response times (Datadog)
- [ ] Check web app performance (Vercel)
- [ ] Verify health checks
- [ ] Test critical flows

### After Deployment
- [ ] Verify all services are up
- [ ] Monitor error rates (15 min)
- [ ] Check performance metrics (15 min)
- [ ] Test user flows end-to-end
- [ ] Document deployment in changelog
- [ ] Notify team of success

---

## 🔗 Useful Commands

```bash
# View recent deployments
vercel list                    # Web (Vercel)
fly releases                   # API (Fly.io)

# Check health
curl https://api.infamousfreight.com/api/health

# View logs
fly logs                       # API logs (last 100 lines)
vercel logs                    # Web logs
fly logs --n 1000             # More logs

# Trigger deployment manually
git push origin main           # Auto-deploys web
fly deploy                     # Deploy API

# Emergency rollback
fly releases rollback          # API rollback
vercel rollback               # Web rollback

# Database backup
pnpm prisma db push          # Sync schema
pnpm prisma db pull          # Pull schema from DB
```

---

## 📞 Escalation Contacts

| Issue | Contact | Link |
|-------|---------|------|
| Web App Down | DevOps | https://vercel.com/dashboard |
| API Down | Backend Team | https://fly.io/dashboard |
| Database Issues | DBA | https://supabase.com/dashboard |
| Security Incident | Security Lead | [Protocol] |
| Monitoring Alerts | On-Call Engineer | Pagerduty |

---

## 📚 Related Documentation

- [BUILD.md](./BUILD.md) - Build and local development
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Command cheat sheet
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Infrastructure setup
- [Vercel Docs](https://vercel.com/docs) - Web deployment
- [Fly.io Docs](https://fly.io/docs) - API deployment
- [Prisma Docs](https://www.prisma.io/docs) - Database migrations

---

**Last Updated**: February 1, 2026  
**Next Review**: February 15, 2026
