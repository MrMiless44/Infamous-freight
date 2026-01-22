# Operations Runbook

**Last Updated**: January 22, 2026  
**For**: Ops / Support / On-Call Engineers

---

## Quick Links

- **API Status**: https://api.fly.dev/api/health
- **Web App**: https://infamous-freight-enterprises.vercel.app
- **Sentry Errors**: https://sentry.io/projects/infamous-freight/
- **Datadog Dashboard**: https://app.datadoghq.com
- **Fly.io Console**: https://fly.io/dashboard
- **Vercel Console**: https://vercel.com/projects

---

## Common Tasks

### Check API Health

```bash
# Simple health check
curl https://api.fly.dev/api/health

# Detailed health check
curl https://api.fly.dev/api/health | jq .
# Expected response: { "status": "ok", "uptime": 12345, "database": "connected" }
```

### View API Logs

```bash
# Follow real-time logs
flyctl logs -a infamous-freight-api

# Search for errors
flyctl logs -a infamous-freight-api --query 'error'

# Last 100 lines
flyctl logs -a infamous-freight-api --limit 100
```

### Restart API Service

```bash
# Graceful restart (recommended)
flyctl restart -a infamous-freight-api

# Force restart (if stuck)
flyctl restart -a infamous-freight-api --force
```

### Check Database Connection

```bash
# SSH into Fly machine
flyctl ssh console -a infamous-freight-api

# Check PostgreSQL connectivity
psql $DATABASE_URL -c "SELECT 1;"
# Expected: Should return 1

# Check migration status
cd /app && npm run prisma:migrate:status
```

### Monitor Redis/BullMQ

```bash
# SSH into Fly machine
flyctl ssh console -a infamous-freight-api

# Check Redis connectivity
redis-cli ping
# Expected: PONG

# Monitor queue jobs
redis-cli INFO stats | grep total_commands_processed
```

### Access Queue Dashboard (Local Dev)

```bash
# URL: http://localhost:3001/ops/queues
# Requires JWT token with ADMIN role
```

---

## Troubleshooting

### API Down (Error 502)

1. **Check Fly.io machine status**

   ```bash
   flyctl status -a infamous-freight-api
   ```

   If machines are stopped:

   ```bash
   flyctl scale vm=1 --yes -a infamous-freight-api
   ```

2. **Check logs for errors**

   ```bash
   flyctl logs -a infamous-freight-api --query 'ERROR'
   ```

3. **Restart API**

   ```bash
   flyctl restart -a infamous-freight-api
   ```

4. **If still down, check deployments**
   ```bash
   flyctl releases -a infamous-freight-api
   ```
   Rollback last release if needed:
   ```bash
   flyctl releases rollback -a infamous-freight-api
   ```

### Database Connections Exhausted

**Symptoms**: Requests fail with "too many connections"

```bash
# SSH into Fly machine
flyctl ssh console -a infamous-freight-api

# Check connection count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# If > 40 (pool max), restart API
exit
flyctl restart -a infamous-freight-api
```

### Redis/BullMQ Jobs Failing

**Symptoms**: Dispatch/invoice/ETA jobs not processing

```bash
# SSH into Fly machine
flyctl ssh console -a infamous-freight-api

# Check Redis connectivity
redis-cli ping

# Check queue length
redis-cli LLEN dispatch-jobs
redis-cli LLEN invoice-audit-jobs

# If jobs stuck, restart workers (restart API)
exit
flyctl restart -a infamous-freight-api
```

### Slow Dispatch Queries

**Symptoms**: /dispatch/drivers takes >1s

1. **Check database query log**

   ```bash
   flyctl ssh console -a infamous-freight-api
   tail -f /var/log/postgresql/postgresql.log | grep duration
   ```

2. **Run EXPLAIN ANALYZE**

   ```bash
   psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM drivers LIMIT 100;"
   ```

3. **Add missing indexes** (see [DATABASE_OPTIMIZATION.md](DATABASE_OPTIMIZATION.md))

4. **Clear Redis cache to test uncached**
   ```bash
   redis-cli FLUSHDB
   curl https://api.fly.dev/api/dispatch/drivers
   ```

---

## Deployment Procedure

### 1. Pre-Deployment Checklist

```bash
# Run tests
pnpm test

# Type check
pnpm check:types

# Verify deployment script exists
cat .github/workflows/deploy.yml | grep "flyctl deploy"
```

### 2. Deploy API

```bash
# Push to main branch (auto-deploys via GitHub Actions)
git push origin main

# Or manual deployment
flyctl deploy -a infamous-freight-api

# Monitor deployment
flyctl status -a infamous-freight-api
```

### 3. Run Database Migrations

```bash
# Check pending migrations
flyctl ssh console -a infamous-freight-api -c "npm run prisma:migrate:status"

# Apply migrations (done automatically during deploy)
# If manual:
flyctl ssh console -a infamous-freight-api -c "npm run prisma:migrate:deploy"
```

### 4. Post-Deployment Verification

```bash
# Health check
curl https://api.fly.dev/api/health

# Smoke test dispatch endpoint
curl -H "Authorization: Bearer $ADMIN_JWT" \
  https://api.fly.dev/api/dispatch/drivers | jq .

# Check for errors in Sentry
# Go to https://sentry.io/projects/infamous-freight/
# Should see 0 new errors in last 5 minutes
```

---

## Incident Response

### Major Outage (API Down)

1. **Declare incident** → Notify team in Slack #incidents
2. **Check status page** → Update status.io (if applicable)
3. **Identify cause**:
   - Database down? → Check Fly.io machine status
   - Deployment issue? → Check GitHub Actions logs
   - Traffic spike? → Check auto-scaling
4. **Mitigation**:
   - Restart API: `flyctl restart`
   - Rollback: `flyctl releases rollback`
   - Scale up: `flyctl scale vm=2`
5. **Resolution**:
   - Fix root cause
   - Deploy fix
   - Verify recovery
6. **Post-mortem**: Document lessons learned

### Database Issues

1. **Connection pool exhausted**: Restart API
2. **Out of storage**: Increase Fly.io volume
3. **Replication lag**: Check primary/replica status
4. **Corrupted index**: Reindex: `REINDEX TABLE shipments;`

---

## Monitoring & Alerts

### Check Sentry Errors

```bash
# CLI: List recent errors
curl -s https://sentry.io/api/0/projects/infamousfreight/infamous-freight/events/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq '.[] | {title: .title, timestamp: .dateCreated}'
```

### Check Datadog Metrics

1. Go to https://app.datadoghq.com → Dashboards
2. Open "Infamous Freight Overview" dashboard
3. Monitor P95 latency, error rate, database connections

### Alert Channels

- **Slack #alerts**: Auto-alerts for errors, slow queries
- **PagerDuty**: Critical incidents escalate to on-call
- **Email**: High-priority Sentry issues

---

## Maintenance

### Daily

- [ ] Check Sentry for critical errors
- [ ] Monitor API response time (target: P95 < 500ms)
- [ ] Check database connection pool (target: < 30/40)

### Weekly

- [ ] Review slow queries (> 1s)
- [ ] Check Redis memory usage (< 80%)
- [ ] Review BullMQ queue depths (should drain daily)

### Monthly

- [ ] Review Datadog retention policies
- [ ] Check SSL certificate expiry (Fly handles auto-renewal)
- [ ] Review access logs for suspicious patterns
- [ ] Test disaster recovery (database backup/restore)

---

## Key Contacts

| Role             | Contact                |
| ---------------- | ---------------------- |
| On-Call          | See PagerDuty schedule |
| Engineering Lead | @santorio-miles        |
| DevOps           | @infrastructure-team   |
| Database Admin   | @dba-team              |

---

## Useful Commands Cheat Sheet

```bash
# Fly.io
flyctl apps list
flyctl machines list -a infamous-freight-api
flyctl status -a infamous-freight-api
flyctl logs -a infamous-freight-api
flyctl ssh console -a infamous-freight-api
flyctl restart -a infamous-freight-api

# Database
psql $DATABASE_URL -c "SELECT 1;"
psql $DATABASE_URL -c "\l"  # List databases
psql $DATABASE_URL -c "\dt"  # List tables

# Redis
redis-cli ping
redis-cli INFO
redis-cli KEYS '*'
redis-cli FLUSHDB  # ⚠️ CAUTION

# Git/Deployment
git push origin main
git status
git log --oneline -10
```

---

## Escalation Path

1. **Tier 1 (Support)**: Check status page, restart service
2. **Tier 2 (Engineer)**: Debug with logs, check infrastructure
3. **Tier 3 (DevOps Lead)**: Database issues, scaling, security
4. **Escalate to CEO**: Revenue-impacting outage > 1 hour

---

**Last Updated**: January 22, 2026  
**Version**: 1.0.0
