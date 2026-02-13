# 📊 PRODUCTION MONITORING SETUP GUIDE (100%)

**Status**: Ready to implement  
**Time to Setup**: 30 minutes  
**Impact**: Prevents catastrophic failures, catches issues early  

---

## 🎯 MONITORING LAYERS

```
┌────────────────────────────────────────────────┐
│ 1. Application Monitoring (Sentry)             │
│    └─ Error tracking, performance metrics      │
├────────────────────────────────────────────────┤
│ 2. Infrastructure Monitoring (Datadog/NewRelic)│
│    └─ CPU, memory, disk, network               │
├────────────────────────────────────────────────┤
│ 3. Uptime Monitoring (UptimeRobot)             │
│    └─ Availability checks every 5 min          │
├────────────────────────────────────────────────┤
│ 4. Performance Monitoring (Vercel Analytics)   │
│    └─ Core Web Vitals, user metrics            │
├────────────────────────────────────────────────┤
│ 5. Log Aggregation (Fly.io logs)               │
│    └─ API logs, error traces                   │
└────────────────────────────────────────────────┘
```

---

## 1️⃣ SENTRY - ERROR TRACKING (10 min)

### Setup
```bash
# 1. Create account: https://sentry.io
# 2. Create project for Node.js (API)
# 3. Get your SENTRY_DSN

# 4. Add to Fly.io secrets
flyctl secrets set SENTRY_DSN="your-dsn-here" -a infamous-freight

# 5. Code already has Sentry integrated
# See: apps/api/src/middleware/errorHandler.js
```

### What It Monitors
- ✅ Uncaught exceptions
- ✅ API errors (500s)
- ✅ Slow transactions (> 1s)
- ✅ Database connection failures
- ✅ Authentication errors

### Critical Alerts to Set
```
Error Rate > 1% (in 5 min)     → Immediate alert
Error Rate > 5% (in 1 min)     → Critical alert
Response Time P95 > 2s         → Warning
```

### Dashboard Commands
```bash
# View errors in real-time
https://sentry.io/organizations/[org-name]/issues/

# Set up Slack notifications
https://sentry.io/integrations/slack/
# → Add Sentry workspace to Slack
# → Configure channel for alerts
```

---

## 2️⃣ FLY.IO METRICS - INFRASTRUCTURE (5 min)

### Default Monitoring (Already Included)

Fly.io automatically tracks:
- CPU usage per machine
- Memory usage per machine
- Network I/O
- Disk space
- Container restarts

### View Dashboard
```bash
# Via CLI
flyctl status -a infamous-freight       # Overall status
flyctl metrics -a infamous-freight      # Real-time metrics

# Via Web Dashboard
https://fly.io/dashboard/infamous-freight/
```

### Key Metrics to Watch

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| CPU | < 30% | 30-60% | > 60% |
| Memory | < 50% | 50-80% | > 80% |
| Disk | < 70% | 70-85% | > 85% |
| Restarts | 0 in 24h | 1-2 per day | > 2 per day |

### Alerting Setup
```bash
# In Fly.io Dashboard:
# Settings → Alerts
# Create alert: "CPU > 70% for 5 min"
# Create alert: "Memory > 80% for 5 min"
# Create alert: "Machine restart"
```

---

## 3️⃣ UPTIME MONITORING (5 min)

### UptimeRobot Setup

```bash
# 1. Go to https://uptimerobot.com
# 2. Sign up (free plan)
# 3. Create monitor:
#    Name: "Infamous Freight API"
#    URL: https://infamous-freight.fly.dev/api/health
#    Type: HTTP(s)
#    Interval: 5 minutes
#    Timeout: 30 seconds
# 4. Add notification channels (email, Slack)
```

### What It Checks
```
GET /api/health

Expected Response:
{
  "status": "ok",
  "database": "connected",
  "uptime": <seconds>
}
```

### Alert Rules
- Down for 5+ minutes → Immediate email
- Down for 15+ minutes → Slack alert
- Recurring downtime pattern → Investigation

---

## 4️⃣ VERCEL ANALYTICS (Auto-Enabled)

### Web Performance Metrics

Vercel automatically tracks:
- **Core Web Vitals**
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1

- **Custom Metrics**
  - Page load time
  - Time to interactive
  - Geographic performance

### View Dashboard
```
Vercel Dashboard → Select infamous-freight-enterprises
→ Analytics → Real User Monitoring (RUM)
```

### Expected Targets
- Lighthouse: > 85
- LCP: < 2.0s
- FID: < 50ms
- CLS: < 0.05

---

## 5️⃣ LOG AGGREGATION (Fly.io)

### View Logs in Real-Time

```bash
# Last 50 lines
flyctl logs -a infamous-freight

# Continuous monitoring
flyctl logs -a infamous-freight --follow

# Filter for errors
flyctl logs -a infamous-freight | grep ERROR

# Last hour of logs
flyctl logs -a infamous-freight -t 1h
```

### Log Levels

| Level | When to Use | Example |
|-------|------------|---------|
| ERROR | Critical failures | Database connection lost |
| WARN | Degraded but working | High memory usage |
| INFO | Important events | User registered |
| DEBUG | Development info | SQL queries (dev only) |

### Log Analysis Commands
```bash
# Count errors by type
flyctl logs -a infamous-freight | grep ERROR | wc -l

# Find slow queries
flyctl logs -a infamous-freight | grep "duration.*ms" | sort -rn

# Track specific user
flyctl logs -a infamous-freight | grep "user_id=123"
```

---

## 🎨 CREATE DASHBOARD

### Recommended Tools

**Option A: Datadog (Recommended for startups)**
```
Free tier: 5 hosts
Perfect for: Startups, MVP
Cost: Free initially, $15/host/month scale

Setup:
1. Account: https://www.datadoghq.com
2. Create integration for Fly.io
3. Create dashboard with:
   - API response times
   - Error rates
   - Database performance
   - CPU/Memory/Disk
```

**Option B: Grafana + Prometheus (Self-hosted)**
```
Perfect for: Teams wanting control
Cost: Free, self-hosted

Includes:
- Custom dashboards
- Advanced queries
- Unlimited visualizations
```

**Option C: Simple Setup (No Cost)**
```
Use: Sentry + Fly.io + Vercel analytics
Free tiers coverage:
- Error tracking (Sentry)
- Infrastructure (Fly.io)
- Web metrics (Vercel)
- Uptime (UptimeRobot)
```

### Dashboard Layout

```
┌────────────────────────────────────────────────┐
│ INFAMOUS FREIGHT PRODUCTION DASHBOARD          │
├────────────────────────────────────────────────┤
│ [Status: 🟢 OPERATIONAL] [Uptime: 99.8%]     │
├────────────────────────────────────────────────┤
│ API Health          │ Web Performance         │
│ ├─ Error Rate: 0.02%│ ├─ LCP: 1.8s           │
│ ├─ P95 Latency: 180ms
│ ├─ Requests/min: 1,242│ ├─ Lighthouse: 92    │
│ └─ Status: 🟢 OK    │ └─ Status: 🟢 OK       │
├────────────────────────────────────────────────┤
│ Infrastructure      │ Database                │
│ ├─ CPU: 24%         │ ├─ Connections: 8/20   │
│ ├─ Memory: 45%      │ ├─ Avg Query: 12ms     │
│ ├─ Disk: 62%        │ ├─ Slow Queries: 0     │
│ └─ Machines: 2/2    │ └─ Status: 🟢 OK       │
├────────────────────────────────────────────────┤
│ Active Alerts: None
└────────────────────────────────────────────────┘
```

---

## 🚨 ALERTING STRATEGY

### Alert Rules (Copy/Paste)

**Sentry Alerts**
```
Alert 1: Error Rate Spike
├─ Condition: Error count > 10 in 5 min
├─ Severity: High
└─ Notify: Slack #alerts, email

Alert 2: New Error Type
├─ Condition: First occurrence of error
├─ Severity: Medium
└─ Notify: Slack #alerts

Alert 3: Performance Degradation
├─ Condition: P95 response time > 1000ms for 5 min
├─ Severity: Medium
└─ Notify: Slack #alerts
```

**Fly.io Alerts**
```
Alert 1: High CPU
├─ Condition: CPU > 80% for 5 min
├─ Severity: High
└─ Action: Auto-scale if possible

Alert 2: Memory Pressure
├─ Condition: Memory > 85% for 3 min
├─ Severity: High
└─ Action: Restart + alert

Alert 3: Disk Space
├─ Condition: Disk > 85% used
├─ Severity: Medium
└─ Action: Investigation + cleanup
```

**UptimeRobot Alerts**
```
Alert 1: API Down
├─ Condition: No response for 5 min
├─ Severity: Critical
└─ Notify: SMS + Email + Slack

Alert 2: API Timeout
├─ Condition: Response time > 30s
├─ Severity: High
└─ Notify: Email + Slack
```

---

## 📝 RUNBOOK - COMMON ISSUES

### Issue: P95 Response Time > 1s

```
1. Check query performance
   flyctl ssh console -a infamous-freight
   SELECT * FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;

2. Identify slow query
3. Add index if needed: CREATE INDEX idx_name ON table(column);
4. Restart if needed: flyctl restart -a infamous-freight
```

### Issue: High Error Rate

```
1. Check error types in Sentry
2. Identify which endpoint is failing
3. Check API logs: flyctl logs -a infamous-freight
4. Fix code issue or rollback
5. Monitor for 15 min to confirm resolved
```

### Issue: Out of Memory

```
1. Check memory usage: flyctl status -a infamous-freight
2. Identify memory leak: Add DEBUG logs
3. Restart machine: flyctl restart -a infamous-freight
4. Scale up if persistent: flyctl scale memory 512 -a infamous-freight
```

### Issue: Database Connections Exhausted

```
1. Check connection pool: SELECT count(*) FROM pg_stat_activity;
2. Kill idle connections: SELECT pg_terminate_backend(pid) FROM pg_stat_activity...
3. Increase pool size in Prisma config
4. Restart API: flyctl restart -a infamous-freight
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Sentry account created & DSN configured
- [ ] Fly.io metrics dashboard reviewed
- [ ] UptimeRobot monitoring active
- [ ] Vercel Analytics enabled
- [ ] Log review process documented
- [ ] Alert rules configured
- [ ] Runbooks created for common issues
- [ ] Team trained on dashboards
- [ ] Escalation procedures defined
- [ ] On-call rotation established

---

## 📞 MONITORING OWNERSHIP

**Daily Monitoring**
- Time: 9 AM - 5 PM
- Owner: DevOps Lead
- Activity: Review dashboards, error rates, performance

**On-Call Rotation**
- After hours: Rotating team member
- Pager: PagerDuty or similar
- Response time: < 15 minutes for critical

**Weekly Review**
- Day: Monday morning
- Duration: 30 minutes
- Attendees: Engineering + Ops
- Topics: Trends, patterns, optimizations

---

**Document Version**: 1.0.0  
**Status**: Ready to implement  
**Time to Deploy**: 30-45 minutes
