# Runbook: Database Emergency - Outage Recovery

**Duration:** 10-30 minutes (depends on root cause)  
**Risk Level:** Medium/High (data integrity critical)  
**Estimated Recovery:** 5-15 minutes for connection issues, longer for corruption

---

## 🚨 When to Use This Runbook

Use this if experiencing:
- [ ] "Database connection failed" errors
- [ ] Connection pool exhausted
- [ ] Query timeouts (> 30 seconds)
- [ ] 502/503 errors on API
- [ ] Data integrity warnings
- [ ] Replication lag > 5 minutes

**Not this runbook if:**
- Single query is slow (see slow-query runbook) 
- Specific table locked (see deadlock runbook)
- Accidental data deletion (see recovery runbook)

---

## Emergency Response

### Step 1: IDENTIFY the Issue (< 2 minutes)

**Check error message:**

```bash
# 1. Look at API logs
echo "Recent errors:"
curl https://api.your-domain.com/api/health
# Note exact error message

# 2. Check Sentry
# https://sentry.io → Issues
# Filter by "database\|connection\|timeout"

# 3. Check database status
# If using Supabase: https://supabase.com/dashboard → Status

# 4. Identify pattern
# All endpoints affected? → Connection pool issue
# Only writes failing? → Replication issue
# Only specific table? → Lock issue
```

**Common symptoms:**

```
"connect ECONNREFUSED 127.0.0.1:5432"
  → Database server down or unreachable

"FATAL: remaining connection slots reserved..."
  → Connection pool exhausted

"server closed the connection unexpectedly"
  → Database restarted or crashed

"query timeout after 30s"
  → Slow queries or high load
```

### Step 2: TRIAGE (< 2 minutes)

**Quick assessment:**

```bash
# Is database actually down?
psql $DATABASE_URL -c "SELECT 1;" 2>&1
# If error → database is down
# If "1" returned → database is up

# Is the API connection pool saturated?
curl https://api.your-domain.com/api/health
# If instant timeout → likely pool issue

# Is replication healthy?
# Supabase: Dashboard → Logs
# Look for replication lag > 60 seconds
```

### Step 3: ASSESS Severity

**Critical (Execute Triage A):**
- All database queries failing
- Connection refused errors
- Database completely unreachable
- **Action: 🔴 Emergency Response**

**High (Execute Triage B):**
- Some queries timing out
- High latency (> 10s)
- Connection pool occasionally exhausted
- **Action: ⚠️ Stabilization**

**Medium (Execute Triage C):**
- Specific queries slow
- Occasional timeouts
- High connection count but responding
- **Action: ✓ Investigation**

---

## Response Options (Choose one)

### TRIAGE A: Database Server Down 🔴

```bash
# This means DATABASE SERVER is unreachable or crashed

echo "🚨 DATABASE DOWN - Emergency Response"

# IMMEDIATE ACTIONS (< 5 min):

# 1. Notify users
slack #incidents "🔴 CRITICAL: Database service is down. ETA 10 minutes."

# 2. Check provider status
# Supabase: https://status.supabase.com
# AWS: https://status.aws.amazon.com
# Self-hosted: SSH to server, check logs

# 3. If Supabase: Wait for their recovery
# Their infrastructure is managed by them
# Monitor status page for updates
sleep 60 && curl https://status.supabase.com

# 4. If self-hosted: Restart database
ssh database-server
sudo systemctl restart postgresql
# OR
docker restart postgres-container

# 5. Verify connection restored
psql $DATABASE_URL -c "SELECT 1;"
# Expected: Should return "1"

# 6. Check data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM shipment;"
# Expected: Should return number without error

# 7. Restart API service
# Fly.io: flyctl restart
# Or manual restart if needed
fly apps restart api-app-name

# 8. Verify health endpoint
curl https://your-domain.com/api/health
# Expected: {"ok":true}

# 9. Communicate recovery
slack #incidents "✅ Database back online. Verifying stability..."
```

**Expected timeline:**
- Supabase downtime: 5-15 minutes (managed)
- Self-hosted restart: 2-5 minutes
- Service verification: 3-5 minutes
- **Total: 10-20 minutes**

---

### TRIAGE B: Connection Pool Issues ⚠️

```bash
# This means DATABASE is up, but connections exhausted

echo "⚠️  CONNECTION POOL ISSUE - Stabilization"

# IMMEDIATE ACTIONS (< 5 min):

# 1. Identify connection usage
psql $DATABASE_URL -c "
  SELECT 
    datname, 
    count(*) as connections,
    max_connections
  FROM pg_stat_activity 
  GROUP BY datname, max_connections;
"
# Look for: connections near max_connections

# 2. Check for idle connections
psql $DATABASE_URL -c "
  SELECT pid, usename, state, query_start 
  FROM pg_stat_activity 
  WHERE state = 'idle' 
  ORDER BY query_start;
"
# Look for: connections idle for > 5 minutes

# 3. Kill idle connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE state = 'idle' AND query_start < NOW() - INTERVAL '5 minutes';
"
# This forcefully closes stale connections

# 4. Increase connection limit (if allowed)
# For Supabase: https://supabase.com/dashboard → Project → Settings
# Increase max_connections (check limits for your plan)

# 5. Deploy code fix to reduce connections
# In api/src/services/database.js:
# Add connection pooling OR
# Reduce concurrent queries

# 6. Restart API to reset pool
fly apps restart api-app-name

# 7. Verify connections normalized
psql $DATABASE_URL -c "
  SELECT 
    sum(numbackends) as total_connections, 
    current_setting('max_connections')::int as max
  FROM pg_stat_database;
"
# Expected: total_connections << max_connections
```

**Expected timeline:**
- Kill idle connections: 30 seconds
- API restart: 1-2 minutes
- Pool recovery: 2-3 minutes
- **Total: 5-10 minutes**

---

### TRIAGE C: Slow Queries or High Load ✓

```bash
# This means DATABASE is responsive but slow

echo "✓ INVESTIGATION MODE - Slow Query Analysis"

# IMMEDIATE ACTIONS (< 5 min):

# 1. Find slow queries
psql $DATABASE_URL -c "
  SELECT query_start, duration, query 
  FROM pg_stat_statements 
  WHERE mean_time > 5000  -- longer than 5 seconds
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# 2. Explain expensive queries
# Example:
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM shipment s JOIN driver d ON s.driver_id = d.id;"
# Look for: Full table scans, N+1 queries

# 3. Check for table locks
psql $DATABASE_URL -c "
  SELECT blocked_locks.pid, blocked_locks.query, 
         blocking_locks.pid, blocking_locks.query 
  FROM pg_catalog.pg_locks blocked_locks
  JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted AND blocked_locks.pid != blocking_locks.pid;
"

# 4. Monitor in real-time
watch -n 1 'psql $DATABASE_URL -c "SELECT namespaces.nspname, tables.relname, statio.heap_blks_read, statio.heap_blks_hit FROM pg_stat_user_tables statio JOIN pg_class tables ON statio.relid = tables.oid JOIN pg_namespace namespaces ON tables.relnamespace = namespaces.oid ORDER BY statio.heap_blks_read DESC LIMIT 5;"'

# 5. Enable query logging for investigation
# In postgresql.conf:
log_min_duration_statement = 1000  # Log queries > 1 second
# OR modify Supabase logging settings

# 6. Deploy performance fix
# Add indexes: CREATE INDEX idx_shipment_driver_id ON shipment(driver_id);
# Or refactor N+1 queries
# Or add database caching

# 7. Monitor improvement
watch -n 5 'curl -s https://your-domain.com/api/health | jq .response_time'
```

**Expected timeline:**
- Identify slow query: 3-5 minutes
- Deploy fix: 5-15 minutes (requires new deployment)
- Verify improvement: 2-3 minutes
- **Total: 15-30 minutes**

---

## Progressive Recovery

**If above steps don't work, escalate:**

### Level 1: Connection Reset
```bash
# Force close ALL connections and restart
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid();"
sleep 5
fly apps restart api-app-name
```

### Level 2: Cluster Restart (Supabase)
```bash
# In Supabase Dashboard:
# Project → Settings → Infrastructure
# Click "Restart Postgres" button
# This restarts the entire database cluster
# Estimated downtime: 2-5 minutes
```

### Level 3: Failover (if configured)
```bash
# If you have standby replica:
# Promote read replica to primary
# Update connection string
# Estimated downtime: 1-3 minutes
```

### Level 4: Restore from Backup
```bash
# Last resort - restore from backup
# Estimated downtime: 30-60 minutes
# Data loss: All changes since last backup

# Supabase: https://supabase.com/dashboard → Backups
# Find backup from before issue
# Click "Restore"
```

---

## Prevention Going Forward

**After recovery, implement:**

```bash
# 1. Add monitoring
# Alert when connections > 80% capacity
# Alert when query latency > 5s

# 2. Add connection pooling
# Use PgBouncer: https://github.com/pgbouncer/pgbouncer
# Reduces connection overhead

# 3. Optimize queries
# Add indexes for WHERE/JOIN clauses
# Add SELECT specific columns (not SELECT *)
# Add LIMIT to prevent huge result sets

# 4. Enable auto-scaling
# For Supabase: https://supabase.com/docs/guides/platform/compute-add-ons
# Auto-scales compute based on demand

# 5. Configure alerts
# Sentry: Alert on database errors
# Monitoring: Alert on connection pool usage
# Custom: Alert on query latency spikes

# 6. Load test
# Before production deployment, test with load
# Verify queries perform under load
# Check connection pool behavior
```

---

## Communication Template

**Immediately (when issue detected):**
```
🔴 INCIDENT: Database issues detected
├─ Service: API & Web
├─ Status: Investigating
├─ Impact: May affect shipment operations
└─ ETA: 5 minutes
```

**During resolution:**
```
🟡 INCIDENT: Working on database recovery
├─ Root cause: [Connection pool exhausted / slow queries / replication lag]
├─ Action: [Killing idle connections / restarting service / deploying fix]
└─ ETA: 3 minutes
```

**After recovery:**
```
✅ INCIDENT RESOLVED
├─ Service: Fully operational
├─ Duration: 8 minutes
├─ Root cause: Connection limit hit during peak load
└─ Follow-up: Increasing connection limit + adding monitoring
```

---

## Escalation

| Issue | Self-Resolve | Escalate After | Escalate To |
| --- | --- | --- | --- |
| Connection pool exhausted | Killing idle connections | 5 min | Database admin |
| Slow queries | Check for locks, kill bad queries | 10 min | Engineering lead |
| Database unresponsive | Restart database | 5 min | Cloud provider support |
| Replication lag > 60s | Wait for recovery | 10 min | Supabase support |
| Data corruption suspected | DO NOT restart | 2 min | Database admin + backup team |

---

## Critical Phone Numbers

```
Supabase Support: support@supabase.com (or in-app chat)
AWS Support: [Your support contract number]
On-call DBA: [Phone number]
Emergency contacts: [List here]
```

---

## Verification Checklist

After recovery, verify:

- [ ] Health endpoint returns 200
- [ ] API responds within 2 seconds
- [ ] No errors in Sentry
- [ ] Connections normalized (< 80% capacity)
- [ ] Query latency normal (< 1s)
- [ ] All users can log in
- [ ] Can create shipments
- [ ] Replication lag < 5s
- [ ] No data loss observed
- [ ] Backups still running

---

## Related Runbooks

- [Emergency Rollback](emergency-rollback.md) - If issue requires deployment revert
- [Data Recovery](data-recovery.md) - If data corruption detected
- [Performance Tuning](performance-tuning.md) - Long-term solutions
- [Slow Query Investigation](slow-query-logs.md) - Deep dive analysis

---

**Remember:** Database incidents are manageable. Stay calm, follow these steps, and you'll recover quickly. 💪

For questions: Slack #database or post-mortem after recovery.
