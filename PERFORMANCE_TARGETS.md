# Performance & Reliability Targets

**Last Updated**: January 22, 2026  
**Status**: Production SLO Targets

---

## 🎯 Service Level Objectives (SLOs)

| Metric                       | Target                         | Priority | Monitor               |
| ---------------------------- | ------------------------------ | -------- | --------------------- |
| **Availability**             | 99.9% (8.7 hrs/month downtime) | Critical | Uptime robot + Fly.io |
| **API Response Time (P95)**  | < 500ms                        | High     | Datadog APM           |
| **API Response Time (P99)**  | < 1000ms                       | High     | Datadog APM           |
| **Error Rate**               | < 1%                           | Critical | Sentry + Datadog      |
| **Database Connection Pool** | < 80% utilization              | High     | PostgreSQL metrics    |
| **Redis Memory**             | < 85% utilization              | Medium   | Redis monitor         |
| **Page Load Time (Web)**     | < 2.5s (LCP)                   | High     | Vercel Analytics      |
| **Dispatch Queue Drain**     | < 5 seconds                    | Medium   | BullMQ dashboard      |
| **JWT Token Issuance**       | < 100ms                        | Low      | API logs              |

---

## 📊 Baseline Metrics (Current)

| Metric               | Current | Target | Gap         |
| -------------------- | ------- | ------ | ----------- |
| Average API response | ~300ms  | 500ms  | ✅ Good     |
| P95 API latency      | ~800ms  | 500ms  | ⚠️ Optimize |
| Error rate           | ~0.5%   | < 1%   | ✅ Good     |
| Web LCP              | ~3.2s   | < 2.5s | ⚠️ Optimize |
| Test coverage        | ~85%    | 95%    | ⚠️ Improve  |

---

## 🚀 Optimization Roadmap

### Phase 1: Pre-Launch (This Week)

**Goal**: Reduce P95 latency from 800ms → 500ms

- [ ] Add database indexes (dispatch, shipments, billing)
- [ ] Implement Redis caching layer (5-min TTL)
- [ ] Fix N+1 queries in Prisma
- [ ] Run load test (k6) to identify bottlenecks
- [ ] Enable slow query logging in PostgreSQL

**Expected Result**: P95 latency < 600ms

---

### Phase 2: Post-Launch (Month 1)

**Goal**: Achieve 99.9% availability

- [ ] Enable database replication (primary + read replica)
- [ ] Set up database backup snapshots (daily)
- [ ] Implement API rate limiting per user (not just global)
- [ ] Add query result caching (1-hour TTL for reference data)
- [ ] Monitor Fly.io auto-scaling performance

**Expected Result**: Availability 99.5%+

---

### Phase 3: Scale Phase (Month 2)

**Goal**: Support 10,000+ concurrent users

- [ ] Implement CDN for static assets (Cloudflare)
- [ ] Add API response compression (gzip)
- [ ] Implement GraphQL layer for efficient data queries
- [ ] Add database connection pooling (PgBouncer)
- [ ] Scale Fly.io to 4+ machines with load balancing

**Expected Result**: Support 10x traffic growth

---

## 📈 Load Testing Strategy

### Baseline Test (Current)

```bash
# Run k6 load test
K6_TOKEN=$JWT_TOKEN k6 run load-test.k6.js --vus 50 --duration 5m
```

**Expect**: P95 < 800ms at 50 concurrent users

### Pre-Launch Test (After Optimizations)

```bash
# Stress test with 200 concurrent users
K6_TOKEN=$JWT_TOKEN k6 run load-test.k6.js --vus 200 --duration 10m
```

**Target**: P95 < 500ms at 200 concurrent users

### Post-Launch Monitoring

- Run weekly baseline test
- Monthly stress test with 500+ concurrent users
- Alert if P95 > 600ms or error rate > 2%

---

## 🔍 Profiling & Bottleneck Analysis

### Identify Slow Endpoints

```sql
-- Top 10 slowest queries (PostgreSQL)
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Profile Node.js CPU

```bash
# Use clinic.js to profile
npm install -g clinic

clinic doctor -- node api/src/index.js
# Load test while profiling
# Results: HTML report with CPU/memory/delays
```

### Trace Requests in Datadog

1. Go to Datadog → APM → Traces
2. Filter: `service:infamous-freight-api`
3. Sort by duration
4. Drill down into slowest requests
5. Identify hotspots (database, Redis, external APIs)

---

## 💾 Caching Strategy

### Cache Layers (Priority)

| Layer                   | TTL    | Hit Rate | Priority |
| ----------------------- | ------ | -------- | -------- |
| Redis (in-memory)       | 5 min  | 80%+     | Critical |
| HTTP (CDN/browser)      | 1 hour | 40%+     | High     |
| Database (query result) | 1 hour | 60%+     | High     |
| Precomputed (analytics) | 6 hour | 90%+     | Medium   |

### Cache Invalidation

```typescript
// Invalidate on write
router.patch('/drivers/:id', async (req, res) => {
  const driver = await prisma.driver.update({ ... });

  // Invalidate related caches
  await invalidateCache(CACHE_KEYS.DISPATCH_DRIVERS);
  await invalidateCache(CACHE_KEYS.DRIVER(driver.id));

  res.json(driver);
});
```

---

## 🧪 Test Coverage Targets

### Current: 85%

### Target: 95%

**Gap**: 30 failing tests + new test coverage

```bash
# Generate coverage report
pnpm test --coverage

# Identify uncovered lines
cat api/coverage/lcov-report/index.html
```

### Coverage by Module (Target)

- API routes: 95% (critical)
- Middleware: 90% (important)
- Services: 85% (important)
- Utils: 80% (nice to have)

---

## 📉 Cost Optimization

### Current Spend (Estimated)

| Service             | Monthly   | Optimization               |
| ------------------- | --------- | -------------------------- |
| Fly.io (2 machines) | $30       | Auto-scale to 1 off-peak   |
| PostgreSQL          | $20       | Shared cluster → dedicated |
| Redis               | $10       | Managed service            |
| Vercel              | $20       | Standard tier              |
| Sentry              | $29       | Free tier → Pro            |
| Datadog             | $15       | Pay-as-you-go              |
| **Total**           | **~$124** |                            |

### Optimization Opportunities

- [ ] Switch to Fly Postgres (managed) - Save $10/month
- [ ] Use AWS ElastiCache instead of managed Redis - Save $5/month
- [ ] Reduce Datadog retention to 15 days - Save $10/month
- [ ] **Total savings**: ~$25/month (20%)

---

## 📋 Pre-Launch Performance Checklist

- [ ] All indexes created (database optimization)
- [ ] Redis caching implemented (5-min TTL)
- [ ] N+1 queries fixed (Prisma includes)
- [ ] Load test passed (P95 < 500ms at 100 users)
- [ ] Database connection pool tuned
- [ ] Slow query logging enabled
- [ ] Datadog monitoring active
- [ ] Sentry error tracking enabled
- [ ] PagerDuty alerts configured
- [ ] Runbook complete and accessible

---

## 🚨 Alert Thresholds

| Alert              | Threshold             | Severity |
| ------------------ | --------------------- | -------- |
| API down           | Health check fails 3x | Critical |
| Error rate         | > 5%                  | High     |
| P95 latency        | > 1000ms              | High     |
| DB connections     | > 40/50               | Medium   |
| Redis memory       | > 85%                 | Medium   |
| Queue backlog      | > 1000 jobs           | Medium   |
| Certificate expiry | < 7 days              | Low      |

---

**Last Updated**: January 22, 2026  
**Owner**: Engineering / DevOps  
**Review Frequency**: Monthly
