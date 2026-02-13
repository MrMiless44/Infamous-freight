# 🚀 PRODUCTION RUNBOOK (100% READY)

**Status**: Live deployment ready  
**Purpose**: Daily operational procedures once INFÆMOUS FREIGHT is deployed  
**Audience**: DevOps team, on-call engineers, customer support  

---

## 📋 TABLE OF CONTENTS

1. **Deployment Procedures** - Deploy code safely
2. **Incident Response** - Handle emergencies
3. **Performance Optimization** - Keep system fast
4. **Database Management** - Prisma/PostgreSQL ops
5. **Monitoring & Alerting** - Watch for problems
6. **Rollback Procedures** - Undo bad deployments
7. **Security Procedures** - Secure system daily
8. **Customer Support** - Help users effectively
9. **Communication Protocol** - Talk to stakeholders
10. **Post-mortems** - Learn from incidents

---

## 🚀 DEPLOYMENT PROCEDURES

### Pre-Deployment Checklist (15 min)

Run BEFORE deploying any code:

```bash
# 1. Verify all tests pass locally
pnpm test                          # All tests green ✅

# 2. Check linting
pnpm lint                          # No errors ✅

# 3. Type check
pnpm check:types                   # No type errors ✅

# 4. Build all packages
pnpm --filter @infamous-freight/shared build
pnpm --filter api build
pnpm --filter web build            # All compile ✅

# 5. Verify git status
git status                          # Nothing uncommitted ✅

# 6. Pull latest main
git checkout main && git pull      # Up to date ✅
```

If ANY step fails, STOP and fix before proceeding.

### Deployment Playbook

**API Deployment (to Fly.io)**:

```bash
# 1. Tag release in Git
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 2. Deploy from main
git checkout main
git pull

# 3. Fly.io deployment
flyctl deploy --app infamous-freight-api

# 4. Verify deployment
curl https://api.infamous-freight.com/api/health
# Should return: { "status": "ok", "database": "connected" }

# 5. Check Sentry for errors (should be 0)
# Visit: https://sentry.io/organizations/infamous/

# 6. Notify team
echo "API v1.0.0 deployed to production" | slack #deployments
```

**Web Deployment (to Vercel)**:

```bash
# 1. Vercel auto-deploys from GitHub on main branch push
# Just commit and push!

git add .
git commit -m "Feature: X"
git push origin main

# 2. Check deployment status
# Dashboard: https://vercel.com/dashboard

# 3. Verify on staging preview
# Vercel creates preview URLs automatically

# 4. Promote to production (if confident)
# Usually automatic 5 minutes after merge
```

### Post-Deployment Validation (10 min)

After deployment, run this checklist:

```
✅ API Health Check
   curl https://api.infamous-freight.com/api/health
   Expected: 200 OK + database: "connected"

✅ Web Homepage Load
   https://infamous-freight-enterprises.vercel.app
   Expected: Page loads < 2s, no 500 errors

✅ User Authentication
   1. Go to home page
   2. Click "Sign Up"
   3. Create test account
   4. Should receive verification email
   Expected: Email arrives within 30 seconds

✅ API Response Times
   - Median latency < 500ms (check Fly.io dashboard)
   - P99 latency < 2s

✅ Error Rate
   - 5xx errors < 0.1% of traffic
   - Check Sentry: < 1 error per 1000 requests

✅ Database Connectivity
   - Verify: flyctl postgres connect
   - Should connect immediately
   - Run: SELECT 1; (returns 1)

✅ Uptime Status
   - Check UptimeRobot dashboard
   - Should show 100% (green)

✅ Slack Alerts
   - Should be quiet (no error spikes)
   - If alerts firing, ROLLBACK immediately
```

If any validation fails → ROLLBACK (see section below).

---

## 🚨 INCIDENT RESPONSE

### When Production Goes Down

**Immediate Actions (First 5 minutes)**:

```
1. ✅ DECLARE THE INCIDENT
   - Post in #incidents Slack channel
   - Message: "🚨 INCIDENT: [Service] down - [Impact]"
   - Example: "🚨 INCIDENT: API health checks failing - All users unable to create shipments"

2. ✅ ESCALATE IF NEEDED
   - If > 100 customers affected: Page on-call team
   - If critical service down: Page CTO
   - Use PagerDuty or Slack notifications

3. ✅ INVESTIGATE ROOT CAUSE
   - Check Sentry for errors (what new errors appeared?)
   - Check Fly.io metrics (CPU, memory, disk usage)
   - Check database status (connection refuses? slow queries?)
   - Check recent deployments (did we just deploy?)

4. ✅ COMMUNICATE STATUS
   - Update Slack every 2 minutes
   - Post to status page: https://status.infamous-freight.com
   - Message: "INVESTIGATING: [Description of what we're doing]"
```

### Common Incidents & Solutions

#### Incident #1: API Returning 500s

**Diagnosis**:
```bash
# 1. Check error logs
flyctl logs --app infamous-freight-api | tail -100

# 2. Check Sentry
# Visit: https://sentry.io/organizations/infamous/

# 3. Check recent deployments
git log --oneline -n 10

# 4. Check database
flyctl postgres connect --app infamous-freight-postgres
SELECT 1;  # Should return 1
```

**Common causes**:
- 🔴 Bad deployment (rush to rollback)
- 🔴 Database deadlock (restart postgres)
- 🔴 Rate limiter misconfigured (spike in traffic)
- 🔴 Missing environment variable (check `.env`)

**Solutions**:

```bash
# Solution A: Rollback if deployed in last hour
git revert [commit hash]
git push origin main
flyctl deploy --app infamous-freight-api

# Solution B: Restart API (cold restart)
flyctl restart --app infamous-freight-api

# Solution C: Restart Database (if deadlock)
flyctl restart --app infamous-freight-postgres

# Solution D: Check environment
flyctl secrets list --app infamous-freight-api | grep -i api_
# If missing vars, restore from backup

# Solution E: Check logs for specific error
flyctl logs --app infamous-freight-api -f \
  | grep -i error | tail -20
```

#### Incident #2: Slow Response Times (> 2s)

**Diagnosis**:
```bash
# 1. Check database query performance
flyctl postgres connect
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# 2. Check API latency metrics
flyctl metrics  # See green/yellow/red status

# 3. Check for runaway queries
SELECT * FROM pg_stat_activity;
```

**Solutions**:

```bash
# Solution A: Kill long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE query LIKE '%shipments%' AND state = 'active' 
AND query_start < NOW() - INTERVAL '5 minutes';

# Solution B: Optimize queries
# Check EXPLAIN plans in Prisma logs
# Verify indexes exist (see Database section)

# Solution C: Scale API instances
flyctl scale count --app infamous-freight-api 3

# Solution D: Enable caching
# Restart with Redis enabled (if configured)
```

#### Incident #3: Database Connection Failures

**Diagnosis**:
```bash
# 1. Can we connect?
flyctl postgres connect --app infamous-freight-postgres

# 2. Check connection count
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Check database size
psql -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

**Solutions**:

```bash
# Solution A: Increase connection pool
# Edit docker-compose.prod.yml
# Set DATABASE_POOL_LIMIT=20 (or higher)
export DATABASE_POOL_LIMIT=20

# Solution B: Restart database
flyctl restart --app infamous-freight-postgres

# Solution C: Check permissions
psql -c "ALTER USER infamous_user CREATEDB;"

# Solution D: Emergency: Switch to read-only mode
# (to prevent further writes while investigating)
# In code: Set read-only flag, deploy patch
```

#### Incident #4: High Error Rate from Users

**Diagnosis**:
```bash
# 1. Check what errors
curl https://api.infamous-freight.com/api/health
# Look for specific error types in Sentry

# 2. Check if rate limiting
flyctl logs | grep "429"  # Too Many Requests?

# 3. Check for deployment issue
git log --oneline -1

# 4. Check user feedback in support
# Slack: #support channel
# Email: support@infamous-freight.com
```

**Solutions**:

```bash
# Solution A: If rate limit issue
# Adjust limits in apps/api/src/middleware/security.js
# Increase max requests per window
# Deploy patch

# Solution B: If validation issue
# Check input validation in API
# Update handleValidationErrors middleware

# Solution C: If user data corruption
# Investigate specific user in database
SELECT * FROM users WHERE email = 'customer@example.com';

# Solution D: Communicate with customers
# Post incident update: "#incidents User shipment creation 
# temporarily affected - We've scaled infrastructure"
```

### Post-Incident Procedure

After incident is RESOLVED:

```
1. ✅ MONITOR for 1 hour
   - Watch error rate return to baseline
   - Monitor customer complaints in Slack
   - Check metrics return to normal

2. ✅ UPDATE TEAM
   - Post in Slack: "🟢 RESOLVED: [Service] restored"
   - Include resolution time
   - Example: "🟢 RESOLVED: API restored after 18 minutes"

3. ✅ SCHEDULE POST-MORTEM
   - Schedule meeting within 24 hours
   - Include: Engineer who responded, relevant team members
   - Document: What happened, why it happened, what to do next

4. ✅ CREATE FOLLOW-UP ISSUE
   - GitHub issue: "[Incident] Prevent [root cause]"
   - Assign to engineer
   - Set priority based on severity

5. ✅ UPDATE RUNBOOK
   - If this incident wasn't in the runbook, add it
   - Add prevention measures
   - Add quicker detection/response procedures
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Daily Performance Check

```bash
# 1. Check API response times
flyctl metrics --app infamous-freight-api | grep latency

# 2. Check error rates
flyctl logs --app infamous-freight-api | grep -i error | wc -l

# 3. Check database
flyctl postgres connect
SELECT now() - backend_start AS duration 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY duration DESC 
LIMIT 5;
```

### Response Time Optimization

**Target SLAs**:
- API response: < 500ms median, < 2s p99
- Web page load: < 2s (Largest Contentful Paint)
- Database query: < 100ms for standard queries

**If trending slow**:

```bash
# 1. Check query performance
EXPLAIN ANALYZE 
SELECT * FROM shipments 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 20;

# 2. Add indexes if needed
CREATE INDEX idx_shipments_status ON shipments(status);

# 3. Profile slow endpoints
# In local: NODE_ENV=production node --prof apps/api/index.js
# Generate: node --prof-process isolate-*.log > profile.txt

# 4. Scale horizontally
flyctl scale count --app infamous-freight-api 3  # 3 instances
```

### Database Query Optimization

```bash
# 1. Identify slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC 
LIMIT 5;

# 2. Explain slow query
EXPLAIN ANALYZE SELECT * FROM shipments WHERE driver_id = 123;

# 3. Add missing index
CREATE INDEX idx_shipments_driver ON shipments(driver_id);

# 4. Verify index is used
REINDEX INDEX idx_shipments_driver;
```

---

## 🗄️ DATABASE MANAGEMENT

### Daily Backup Verification

```bash
# 1. List recent backups
flyctl volumes list --app infamous-freight-postgres

# 2. Check backup size
du -sh /data/postgres/

# 3. Verify backup succeeds
# (Fly.io handles automatic daily backups)
# Dashboard shows backup status
```

### Database Scaling

```bash
# If database is running out of space:

# 1. Check current size
flyctl postgres connect
SELECT pg_size_pretty(pg_database_size(current_database()));

# 2. Check fragmentation
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# 3. Vacuum if needed
VACUUM ANALYZE;

# 4. Scale volume if necessary
flyctl volumes update --size-gb 100 infamous-freight-postgres-vol
```

### Data Migrations

**Deploying schema changes safely**:

```bash
# 1. Create migration
cd apps/api
pnpm prisma migrate dev --name add_new_column

# 2. Review generated SQL
cat prisma/migrations/*/migration.sql

# 3. Test locally with production data backup
# (We keep prod backup in CI environment)

# 4. Deploy to production
git add prisma/migrations/
git commit -m "Migration: [description]"
git push origin main

# 5. Verify data integrity
SELECT COUNT(*) FROM shipments;  # Should match pre-migration
SELECT COUNT(*) FROM users;      # Should match pre-migration
```

---

## 📊 MONITORING & ALERTING

### Alert Rules (Configured in Monitoring Guide)

| Alert | Threshold | Action |
|-------|-----------|--------|
| Error Rate > 1% | 5 min window | Page on-call engineer |
| Response Time p99 > 5s | 10 min window | Check database, scale |
| Database > 80% disk | 1 min window | Alert ops, scale volume |
| API memory > 90% | 1 min window | Restart instance |
| Uptime < 99% (hourly) | Rolling | Check logs, incident |

### Alert Response Matrix

```
CRITICAL (Page immediately):
├─ API down (0% uptime)
├─ Database unreachable
├─ Widespread authentication failure
└─ Payment processing failures

HIGH (Respond within 15 min):
├─ Error rate > 5%
├─ Response time > 2s median
├─ Disk > 80%
└─ Memory > 85%

MEDIUM (Respond within 1 hour):
├─ Error rate 1-5%
├─ Response time 500ms-2s
├─ Disk 70-80%
└─ Memory 70-85%

LOW (Resolve within business day):
├─ Error rate < 1%
├─ Performance degradation
├─ Non-critical feature broken
└─ Documentation out of date
```

### Viewing Metrics in Real-Time

```bash
# Fly.io metrics
flyctl metrics --app infamous-freight-api

# Live logs with filtering
flyctl logs --app infamous-freight-api -f \
  | grep -i "error\|latency\|status: 5"

# Database metrics
flyctl postgres connect
SELECT datname, usename, state, query_start 
FROM pg_stat_activity 
WHERE datname = 'infamous_freight_prod';
```

---

## 🔄 ROLLBACK PROCEDURES

### Emergency Rollback (If deployment causes 5xx errors)

**Decision criteria**: Rollback if:
- Error rate > 5% after deployment
- Response time > 5s consistently
- Database connectivity lost
- Authentication broken

**Rollback steps**:

```bash
# 1. Get previous deployment
git log --oneline -n 5

# 2. Identify last good commit
# Example: abc1234 "Fix: shipment tracking"

# 3. Revert current deployment
git revert HEAD              # Creates new commit with undo
git push origin main

# 4. Redeploy previous version
flyctl deploy --app infamous-freight-api

# 5. Verify health
curl https://api.infamous-freight.com/api/health
# Wait 2 minutes for metrics to stabilize

# 6. Monitor for 10 minutes
fly logs --app infamous-freight-api --tail 100

# 7. Post update
echo "🔄 ROLLED BACK: Reverted to previous version. Investigating issue." | slack #deployments
```

### Partial Rollback (Feature flag disabled)

If rollback isn't necessary, disable feature:

```bash
# 1. Identify feature causing issue
# Example: New shipment filtering broke queries

# 2. Disable via feature flag
export FEATURE_NEW_SHIPMENT_FILTER=false

# 3. Redeploy config
flyctl deploy --app infamous-freight-api --ha=false

# 4. Monitor improvement
flyctl metrics | head -10

# 5. Fix issue in code
# Update feature implementation

# 6. Re-enable when fixed
export FEATURE_NEW_SHIPMENT_FILTER=true
git push origin main
```

---

## 🔐 SECURITY PROCEDURES

### Daily Security Check

```bash
# 1. Check for vulnerable dependencies
pnpm audit                    # Look for CRITICAL warnings

# 2. Verify JWT secrets are rotated quarterly
echo "Last JWT rotation: $(cat .jwt-rotation-date)"

# 3. Check rate limiters are working
# Simulate 100 requests in 1 second
for i in {1..100}; do curl -s https://api.infamous-freight.com/api/health > /dev/null; done
# Should see 429 responses after limit

# 4. Verify CORS is restrictive
curl -H "Origin: evil.com" https://api.infamous-freight.com/api/health
# Should see CORS rejection or no header
```

### Password Rotation (Quarterly)

```bash
# 1. Database password
flyctl secrets set DATABASE_PASSWORD="$(openssl rand -base64 32)"

# 2. JWT secret
flyctl secrets set JWT_SECRET="$(openssl rand -base64 32)"

# 3. API keys (if you use any third-party)
# Update Stripe key: flyctl secrets set STRIPE_API_KEY="..."
# Update OpenAI key: flyctl secrets set OPENAI_API_KEY="..."

# 4. Verify all updated
flyctl secrets list | grep -i "prod"

# 5. Log changes
echo "Rotated secrets at $(date)" >> security.log
```

### Certificate & HTTPS Check

```bash
# 1. Verify HTTPS is enforced
curl -I http://api.infamous-freight.com/api/health
# Should show: 301 redirect to https://

# 2. Check SSL certificate validity
echo | openssl s_client -servername api.infamous-freight.com \
  -connect api.infamous-freight.com:443 2>/dev/null | \
  openssl x509 -noout -dates
# Should show: notAfter in future

# 3. Verify security headers
curl -I https://api.infamous-freight.com/api/health | grep -i "strict\|csp\|x-frame"
# Should show: Strict-Transport-Security, Content-Security-Policy, X-Frame-Options
```

---

## 💬 CUSTOMER SUPPORT

### Support Channel Routing

**Slack** (#support):
- Quick replies (< 30 min)
- Screenshots and debugging steps
- General usage questions

**Email** (support@infamous-freight.com):
- Detailed issues
- Feature requests
- Billing questions

**In-App** (Help widget):
- Contextual help
- Screen-specific guidance

### Escalation Path

```
Level 1: Support team (response < 2 hours)
├─ Reset password
├─ Billing questions
├─ General usage

Level 2: Product team (response < 4 hours)
├─ Bugs in features
├─ Feature requests
├─ Configuration help

Level 3: Engineering team (response < 24 hours)
├─ Critical bugs
├─ Data corruption
├─ Performance issues

Level 4: CEO (response < 1 hour)
├─ Enterprise issues
├─ Large customer concerns
└─ Outages affecting customers
```

### Common Support Issues & Solutions

| Issue | Solution | Response Time |
|-------|----------|---|
| Can't reset password | Send password reset email via admin panel | 5 min |
| Shipment not showing | Check if status matches currently selected filter | 10 min |
| Can't connect to API | Check API_KEY in settings, regenerate if needed | 15 min |
| Slow performance | Check server status, scale if needed | 30 min |
| Billing problem | Contact Stripe support or open admin panel | 1 hour |

---

## 📢 COMMUNICATION PROTOCOL

### Incident Communication Timeline

```
T+0:00    Incident declared in #incidents
T+0:05    "INVESTIGATING" status update
T+0:15    "WORKING ON IT" update if ongoing
T+0:30    "UPDATE" with progress or rollback decision
T+0:45    "RESOLVED" or new ETA
T+1:00    "MONITORING" - watching for stability
T+1:30    "✅ RESOLVED" with summary
T+1:35    Post-mortem scheduled (24-48 hours)
```

### Example Incident Update

```
🚨 INCIDENT: API shipment creation endpoint returning 500s
   ├─ Status: INVESTIGATING
   ├─ Affected: ~100 active users
   ├─ Cause: Unknown (investigating)
   ├─ ETA: 15 minutes
   └─ Updates: Every 5 minutes in this thread

[5 min later]
   ├─ Status: IDENTIFIED
   ├─ Root Cause: Recent deployment broke shipment validation
   ├─ Action: Rolling back to previous version
   ├─ ETA: 5 minutes

[10 min later]
   ├─ Status: RESOLVED ✅
   ├─ Duration: 12 minutes
   ├─ Resolution: Rolled back to commit abc1234
   ├─ Action items:
   │  ├─ Fix validation logic
   │  ├─ Add pre-deployment test
   │  └─ Schedule post-mortem
```

---

## 🔍 POST-MORTEMS

### Post-Mortem Template (24-48 hours after incident)

```
# Post-Mortem: [Incident Name]

## Executive Summary
[2-3 sentence description of what happened and impact]

## Timeline
- T+0:00 - First alert triggered
- T+0:05 - Team paged
- T+0:10 - Root cause identified
- T+0:12 - Rollback initiated
- T+0:15 - Service recovered
- T+1:00 - Monitoring confirmed stable

## Root Cause
[Analysis of why incident happened]

## Impact
- Duration: 15 minutes
- Users affected: ~100
- Revenue impact: ~$50 (lost transactions)

## What Went Well
- ✅ Alert triggered immediately
- ✅ Team responded quickly
- ✅ Rollback completed in < 5 min

## What Could Improve
- ❌ Lack of test coverage for new feature
- ❌ No pre-deployment validation
- ❌ Could have been caught in staging

## Action Items
1. Add integration tests for shipment creation (High priority)
2. Implement pre-deployment smoke tests (High priority)
3. Add feature flags for risky deployments (Medium priority)
4. Document rollback procedure in runbook (Low priority)

## Owner: [Engineer Name]
## Status: OPEN (Follow up in 2 weeks)
```

### Blameless Culture

**Principle**: Incidents are opportunities to improve systems, not to blame people.

**Post-mortem rules**:
- ✅ Focus on process, not person
- ✅ Ask "why" 5 times to find root cause
- ✅ Document lessons learned
- ✅ Create actionable improvements
- ❌ Don't assign blame
- ❌ Don't use post-mortems for performance reviews

---

## 📆 WEEKLY OPS CHECKLIST

Every Monday morning:

```
✅ Review alerts from previous week
   └─ Any patterns? Systemic issues?

✅ Check metrics trending
   └─ Error rate up/down?
   └─ Response times stable?
   └─ Database size growing unexpectedly?

✅ Customer support review
   └─ Any recurring issues?
   └─ Common feature requests?

✅ Dependency security audit
   └─ Run: pnpm audit
   └─ Update if necessary

✅ Backup verification
   └─ Check last successful backup
   └─ Verify restore would work

✅ Team standups
   └─ Share metrics
   └─ Discuss improvements
   └─ Plan for coming week
```

---

## 🆘 EMERGENCY CONTACTS

```
On-Call Engineer: [Slack channel: #oncall]
CTO: [Emergency: page via PagerDuty]
DevOps Lead: [Email: ops@infamous-freight.com]
Customer Success: [Slack: #support]

Status Page: https://status.infamous-freight.com
API Status: https://api.infamous-freight.com/api/health
```

---

**Document Version**: 1.0.0  
**Last Updated**: [Today's date]  
**Maintained By**: DevOps team  
**Review Cycle**: Quarterly (or after major incidents)
