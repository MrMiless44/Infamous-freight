# 🚨 Incident Response & Runbooks

**Purpose**: Structured response procedures for common incidents  
**Audience**: On-call engineers, DevOps team, Management

---

## 1️⃣ Incident Severity Levels

### Level 1: Critical (P1)
- **Impact**: Entire platform down or data loss
- **Response Time**: Immediate (< 5 min)
- **Escalation**: CEO + Engineering lead + DevOps
- **Communication**: Every 15 min updates
- **Example**: Database completely unavailable

### Level 2: High (P2)
- **Impact**: Core features unavailable for 10%+ users
- **Response Time**: < 10 minutes
- **Escalation**: Engineering lead + DevOps
- **Communication**: Every 30 min updates
- **Example**: API endpoints returning 500 errors

### Level 3: Medium (P3)
- **Impact**: Feature degradation, non-core services affected
- **Response Time**: < 1 hour
- **Escalation**: On-call engineer
- **Communication**: As needed
- **Example**: Reports feature slow (> 2 min)

### Level 4: Low (P4)
- **Impact**: Minor bugs, non-critical features
- **Response Time**: <24 hours
- **Escalation**: Not urgent
- **Communication**: Dev channel update
- **Example**: Typo in UI, minor cosmetic issue

---

## 2️⃣ Response Playbooks

### Playbook: API Latency High

**Trigger**: API P95 response time > 1 second  
**Severity**: P2

**Step 1: Assess (1 min)**
```bash
# Check current metrics
curl https://app.datadoghq.com/api/v1/stats \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d '{"query":"avg(last_5m):avg:api.request.duration{*}"}'

# Check error rate
curl https://api.example.com/health

# Check database connections
fly ssh console -a freight-postgres
SELECT count(*) FROM pg_stat_activity;
```

**Step 2: Diagnose (3 min)**
```sql
-- Identify slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check connection pool
SELECT sum(numbackends) FROM pg_stat_database;

-- Check table bloat
SELECT 
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**Step 3: Mitigate (5 min)**

If connection pool exhausted:
```bash
# Temporary: increase pool size
heroku config:set DATABASE_CONNECTION_POOL_SIZE=20

# Permanent: update .env
DATABASE_CONNECTION_POOL_SIZE=20
```

If slow query:
```sql
-- Kill long-running query
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE query LIKE '%shipments%'
AND query_start < now() - interval '5 minutes';
```

If memory pressure:
```bash
# Restart API service
fly deploy --strategy=canary -a freight-api
```

**Step 4: Verify (2 min)**
```bash
curl https://api.example.com/health
# Should show response time < 500ms
```

**Step 5: Communicate**
```
🚨 INCIDENT: API Latency High
P2 - 14:35 UTC

ROOT CAUSE: Slow shipment query (mean: 2.5s)
RESOLUTION: Added index on orders.created_at
STATUS: RESOLVED at 14:41 UTC

DURATION: 6 minutes
MITIGATION: Fix deployed, monitoring

Next: Root cause analysis in #incidents
```

---

### Playbook: Database Unavailable

**Trigger**: Health check returns status 503  
**Severity**: P1

**Step 1: Immediate (30 seconds)**
```bash
# Activate incident protocol
# 1. Post #incidents in Slack
# 2. Start war room call
# 3. Enable incident timeline

# Check if database is actually down
psql $DATABASE_URL -c "SELECT 1"
# If hangs or error: database is down
```

**Step 2: Failover (2 min)**
```bash
# IF MULTI-AZ ENABLED (RDS/Fly.io Postgres):
# Automatic failover usually happens in 30-60 seconds
# Just wait and monitor

# IF MANUAL FAILOVER:
# 1. Check replica status
fly postgres replica list -a freight-postgres

# 2. Promote replica
fly postgres replica promote -a freight-postgres --replica-id <id>

# 3. Update connection string
fly secrets set DATABASE_URL=...new-replica-url...
```

**Step 3: Verify (1 min)**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM shipments;"

# Check data integrity
SELECT COUNT(*) FROM shipments_;
# Compare with known baseline from status page
```

**Step 4: Notify Users**
```markdown
# Status page update
🔴 DATABASE INCIDENT

We're experiencing database availability issues.
Services may be unavailable or slow.
ETA for resolution: 10 minutes

Last update: [time]
```

**Step 5: Recovery**
```bash
# Once original database is back online:
# Option 1: Switchback (if possible)
# Option 2: Investigate root cause

# Check logs
fly logs -a freight-postgres | grep error

# Verify integrity
pnpm run validate:database
```

---

### Playbook: Out of Memory

**Trigger**: Memory usage > 90%  
**Severity**: P2

**Step 1: Identify Process (1 min)**
```bash
# SSH into affected service
fly ssh console -a freight-api

# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Identify memory hog
top -b -n 1 | head -20
```

**Step 2: Graceful Shutdown (2 min)**
```bash
# Drain existing connections
kill -TERM $(pgrep -f "node index.js")

# Wait for graceful shutdown (up to 30 seconds)
sleep 30

# Force kill if needed
kill -9 $(pgrep -f "node index.js")
```

**Step 3: Redeploy (3 min)**
```bash
# Restart service automatically via Fly
fly deploy -a freight-api

# Or manually scale
fly scale count 1 -a freight-api
fly scale count 2 -a freight-api  # Scale back up
```

**Step 4: Root Cause Analysis**
```bash
# Check for memory leaks
node --expose-gc app.js

# Monitor memory over time
# If growing: likely memory leak
# If stable: was spike from high traffic

# Check for uncleared buffers/cache
grep -r "cache.set" src/ | grep -v "cache.delete"
```

---

### Playbook: High Error Rate

**Trigger**: Error rate > 5% for > 5 minutes  
**Severity**: P2

**Step 1: Confirm (1 min)**
```bash
# Get error breakdown
curl https://sentry.io/api/0/organizations/...-issues/ \
  -H "Authorization: Bearer $SENTRY_TOKEN" \
  | jq '.[] | {title, count}'

# Get affected endpoints
tail -100 api-error.log | grep -oP '"path":"[^"]*"' | sort | uniq -c
```

**Step 2: Identify Cause (2 min)**
```bash
# Check recent deployments
git log --oneline -10
fly releases -a freight-api

# Check for config changes
fly secrets list -a freight-api

# Check external dependencies
# - Stripe status page
# - AWS status
# - Datadog webhook responses
```

**Step 3: Rollback if Needed (2 min)**
```bash
# If recent deploy caused errors:
fly releases -a freight-api
# Find last good release ID

fly rollback -a freight-api --image <good-release-id>

# Verify
curl https://api.example.com/health
```

**Step 4: Alternative: Hotfix**
```bash
# If rollback causes other issues:
# Make immediate fix
git commit --amend
git push -f origin hotfix/issue-name

fly deploy -a freight-api --force
```

**Step 5: Notify & Close**
```
ℹ️ INCIDENT: High Error Rate
P2 - 15:30 UTC

ROOT CAUSE: Stripe API timeout
FIX: Added timeout handling + retry
DEPLOYED: 15:37 UTC
STATUS: ✅ RESOLVED

Error rate now < 0.1%
Monitoring continues...
```

---

## 3️⃣ Communication Protocol

### During Incident

**Initial Report (within 1 min)**:
```
🚨 INCIDENT DECLARED
Severity: [P1/P2/P3/P4]
Service: [API/Web/Database/etc]
Impact: [description]
Lead: [on-call engineer]
```

**Every 15 minutes** (P1) or **30 minutes** (P2):
```
🔄 STATUS UPDATE
Time: 14:45 UTC
Status: Investigating/Mitigating/Resolved
Current action: [what we're doing]
ETA: [estimated time to resolution]
```

**Resolution**:
```
✅ INCIDENT RESOLVED
Duration: 25 minutes (14:20 - 14:45 UTC)
Impact: 150 users affected
Root cause: Database connection pool exhaustion
Fix: Increased pool size + added monitoring

RCA meeting: Tomorrow 10am
```

### Post-Incident

**RCA Meeting** (within 24 hours):
- What happened?
- Why did it happen?
- How do we prevent it?
- What alarms should we add?

**RCA Document**:
```markdown
# Incident RCA: High API Latency

## Timeline
- 14:20 UTC: Alerts started firing
- 14:22 UTC: Incident declared
- 14:35 UTC: Root cause identified
- 14:40 UTC: Fix deployed
- 14:42 UTC: Resolved

## Root Cause
Database connection pool exhausted due to N+1 query pattern in new feature.

## Contributing Factors
- No monitoring on connection pool utilization
- Load test didn't simulate production traffic
- Feature deployed without code review

## Actions
- [X] Deploy hotfix patch
- [ ] Add connection pool monitoring (by: 2026-02-05)
- [ ] Implement query optimization (by: 2026-02-08)
- [X] Post-mortem meeting (2026-02-02)

## Prevention
- Add monitoring for connection pool
- Mandatory load testing for features
- Code review checklist updated
```

---

## 4️⃣ Oncall Rotation

### Setup Oncall Schedule

```bash
# Using Opsgenie or PagerDuty
# 1. Create schedules:
#    - Primary: Mon-Fri, 9am-5pm UTC
#    - Secondary: Always
#    - Weekends: Rotating

# 2. Integration
# - GitHub notifications
# - Sentry → PagerDuty
# - Datadog → PagerDuty
# - Manual: #oncall channel
```

### Oncall Responsibilities

**Before Shift**:
- [ ] Test all notification channels
- [ ] Review recent incidents
- [ ] Ensure you have access to all systems
- [ ] Set status in Slack

**During Shift**:
- [ ] Respond to alerts within SLO
- [ ] Investigate and mitigate
- [ ] Communicate status
- [ ] Document incident

**After Shift**:
- [ ] Handoff to next engineer
- [ ] Document any ongoing issues
- [ ] Update runbooks if learned anything

---

## 5️⃣ Alert Configuration

### Critical Alerts (Always Notify)

```yaml
Alerts:
  - API unavailable (health check 503)
  - Database down
  - Out of memory
  - Disk space critical (< 5% remaining)
  - High error rate (> 5% consecutive 5 min)
```

### Important Alerts (Notify within 1 hour)

```yaml
Alerts:
  - API latency P95 > 1 second
  - Database connections > 80%
  - Cache hit rate < 70%
  - Deployment failed
```

### Informational Alerts (Log only)

```yaml
Alerts:
  - Deployment started
  - Type checking warning
  - Linting warning
  - Performance report
```

---

## 📋 Quick Reference Card (Print & Keep Handy)

```
┌─────────────────────────────────────────|
│ INCIDENT QUICK REFERENCE
├─────────────────────────────────────────┤
│ DECLARE INCIDENT: #incidents + @everyone
│ ESCALATE: P1→CEO | P2→Lead | P3→Oncall
│ COMMS: Every 15min (P1) or 30min (P2)
├─────────────────────────────────────────┤
│ Health Check:
│ curl https://api.example.com/health
│
│ Database:
│ fly ssh console -a freight-postgres
│
│ Logs:
│ fly logs -a freight-api | grep error
│
│ Rollback:
│ fly releases -a freight-api
│ fly rollback -a freight-api --image <id>
├─────────────────────────────────────────┤
│ WAR ROOM: Zoom link in #incidents
│ RCA: Next day, 10am UTC
└─────────────────────────────────────────┘
```

---

**Use Case**: Printed above every desk, shared with full team  
**Update Frequency**: After every major incident  
**Status**: Ready to implement
