# ⚡ PHASE 5: PERFORMANCE OPTIMIZATION - 40-60% IMPROVEMENT

**Priority**: 🟠 HIGH  
**Timeline**: Month 1 (4 weeks)  
**Effort**: 40 hours  
**Impact**: 40-60% performance gain, -25% infrastructure costs  

---

## 🎯 Performance Targets

```
API Response (p95):       500ms → 150-200ms  (-70%)
Database Queries (p95):   200ms → 50-100ms   (-75%)
External APIs (p95):      3000ms → 1500ms    (-50%)
Infrastructure Cost:      100% → 75%         (-25%)
Users Affected:           Instantly faster UX
```

---

## 📊 PHASE 5: 3-TIER APPROACH

### TIER 1: Query Optimization (Week 1) ⏱️ 4 hours

**Goal**: Move 90% of queries under 100ms

#### Step 1: Enable Query Monitoring

```javascript
// apps/api/src/utils/queryMonitoring.js

const queryMonitor = require('../services/queryPerformanceMonitor');

// Log all slow queries
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    logger.warn('Slow query detected', {
      duration: e.duration,
      query: e.query,
      timestamp: new Date(),
    });
    
    Sentry.captureMessage(`Slow query: ${e.duration}ms`, {
      level: 'warning',
      tags: { query_type: 'slow' },
      measurements: {
        'query.duration': { value: e.duration, unit: 'ms' }
      }
    });
  }
});

// Weekly slow query report
schedule.scheduleJob('0 9 * * 1', async () => {
  const report = queryMonitor.generateReport();
  sendEmail('engineering@infamousfreight.com', 'Weekly Slow Query Report', report);
});
```

#### Step 2: Review & Fix Top Slow Queries

```javascript
// Find queries taking > 100ms
// For each, apply one of these patterns:

// PATTERN 1: Add include() to prevent N+1
// Before:
const shipments = await prisma.shipment.findMany();
for (const shipment of shipments) {
  shipment.driver = await prisma.driver.findUnique({ 
    where: { id: shipment.driverId } 
  }); // N+1!
}

// After:
const shipments = await prisma.shipment.findMany({
  include: { driver: true } // Single query!
});

// PATTERN 2: Use select() for large datasets
// Before:
const allUsers = await prisma.user.findMany(); // All fields!

// After:
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true } // Only needed fields
});

// PATTERN 3: Add pagination
// Before:
const allShipments = await prisma.shipment.findMany();

// After:
const shipments = await prisma.shipment.findMany({
  take: 50, // Limit results
  skip: (page - 1) * 50,
  orderBy: { createdAt: 'desc' }
});

// PATTERN 4: Batch operations
// Before:
for (const id of ids) {
  await db.query(`SELECT * FROM shipments WHERE id = ${id}`);
}

// After:
const shipments = await prisma.shipment.findMany({
  where: { id: { in: ids } }
});
```

#### Step 3: Monitor Improvement

```bash
# Before optimization
pnpm ts-node scripts/query-benchmark.js
# Expected: Average query time = 150-200ms

# After optimization
pnpm ts-node scripts/query-benchmark.js
# Target: Average query time = 50-75ms
```

**Expected Result**: -20-30% database load ✅

---

### TIER 2: Database Indexes (Week 2) ⏱️ 6 hours

**Goal**: Optimize data retrieval with smart indexing

#### Step 1: Analyze Query Patterns

```sql
-- Find slowest queries
SELECT query, count, mean_exec_time, rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### Step 2: Create Strategic Indexes

```sql
-- Shipments - most queried table
CREATE INDEX idx_shipments_status_created 
  ON shipments(status, created_at DESC);

CREATE INDEX idx_shipments_customer_status 
  ON shipments(customer_id, status);

CREATE INDEX idx_shipments_driver_date 
  ON shipments(driver_id, delivery_date);

-- Drivers
CREATE INDEX idx_drivers_status_availability 
  ON drivers(status, availability);

CREATE INDEX idx_drivers_region_status 
  ON drivers(region, status);

-- Warehouses
CREATE INDEX idx_warehouses_region_active 
  ON warehouses(region, is_active);

-- Inventory (critical)
CREATE INDEX idx_inventory_warehouse_product 
  ON inventory(warehouse_id, product_id);

CREATE INDEX idx_inventory_quantity_low 
  ON inventory(quantity) WHERE quantity < reorder_level;

-- Orders
CREATE INDEX idx_orders_customer_date 
  ON orders(customer_id, order_date DESC);

CREATE INDEX idx_orders_status_date 
  ON orders(status, order_date DESC);

-- Execute safely in production (with zero downtime)
BEGIN;
  CREATE INDEX CONCURRENTLY idx_new_index ON table(column);
COMMIT;
```

#### Step 3: Verify Index Performance

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Identify unused indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY idx_blks_read DESC;
```

**Expected Result**: -40-60% query time ✅

---

### TIER 3: Redis Caching (Weeks 3-4) ⏱️ 16 hours

**Goal**: Cache frequently accessed data, reduce database load

#### Step 1: Add Redis to Infrastructure

```bash
# Docker Compose (development)
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

```bash
# Production (AWS ElastiCache or Redis Cloud)
# Configure: 6GB node, 2 replicas, auto-failover
```

#### Step 2: Create Cache Layer Service

```javascript
// apps/api/src/services/cacheLayer.js

const redis = require('redis');
const logger = require('../utils/logger');

class CacheLayer {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: () => 1000 }
    });
    
    this.client.on('error', err => logger.error('Redis error', err));
    this.client.connect();
    
    // Cache configuration
    this.caches = {
      userPermissions: { ttl: 300 }, // 5 min
      shipmentData: { ttl: 60 }, // 1 min
      driverAvailability: { ttl: 30 }, // 30 sec
      warehouseInventory: { ttl: 300 }, // 5 min
      customerPreferences: { ttl: 3600 }, // 1 hour
    };
  }

  // Get with automatic miss handling
  async get(key) {
    try {
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      logger.error('Cache get error', { key, err });
      return null;
    }
  }

  // Set with TTL
  async set(key, value, ttlSeconds = 300) {
    try {
      await this.client.setEx(
        key,
        ttlSeconds,
        JSON.stringify(value)
      );
    } catch (err) {
      logger.error('Cache set error', { key, err });
    }
  }

  // Invalidate (remove) cache
  async invalidate(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (err) {
      logger.error('Cache invalidate error', { pattern, err });
    }
  }

  // Get or load (automatic caching)
  async getOrLoad(key, loader, ttl = 300) {
    const cached = await this.get(key);
    if (cached) return cached;

    const data = await loader();
    await this.set(key, data, ttl);
    return data;
  }

  // Batch operations
  async mget(keys) {
    return Promise.all(keys.map(k => this.get(k)));
  }

  async mset(entries) {
    return Promise.all(
      entries.map(([k, v, ttl]) => this.set(k, v, ttl))
    );
  }
}

module.exports = new CacheLayer();
```

#### Step 3: Apply Caching to High-Traffic Endpoints

```javascript
// apps/api/src/routes/shipments.js

const cache = require('../services/cacheLayer');

// Cached: User permissions (validated every 5 min)
router.get('/api/users/:id/permissions', async (req, res, next) => {
  try {
    const perms = await cache.getOrLoad(
      `perms:${req.params.id}`,
      async () => {
        return await prisma.userPermission.findMany({
          where: { userId: req.params.id }
        });
      },
      300 // 5 minute TTL
    );
    res.json(perms);
  } catch (err) {
    next(err);
  }
});

// Cached: Shipment details (very frequently accessed)
router.get('/api/shipments/:id', async (req, res, next) => {
  try {
    const shipment = await cache.getOrLoad(
      `shipment:${req.params.id}`,
      async () => {
        return await prisma.shipment.findUnique({
          where: { id: req.params.id },
          include: { driver: true, customer: true }
        });
      },
      60 // 1 minute TTL
    );
    
    if (!shipment) return res.status(404).json({ error: 'Not found' });
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

// Cached: Driver availability
router.get('/api/drivers/available', async (req, res, next) => {
  try {
    const drivers = await cache.getOrLoad(
      'drivers:available',
      async () => {
        return await prisma.driver.findMany({
          where: { status: 'available' }
        });
      },
      30 // 30 second TTL (needs fresh data)
    );
    res.json(drivers);
  } catch (err) {
    next(err);
  }
});

// Invalidate cache on mutations
router.post('/api/shipments', async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.create({
      data: req.body
    });
    
    // Invalidate relevant caches
    await cache.invalidate('shipment:*');
    await cache.invalidate('drivers:available');
    
    res.status(201).json(shipment);
  } catch (err) {
    next(err);
  }
});
```

#### Step 4: Monitor Cache Effectiveness

```javascript
// Cache statistics middleware
app.use(async (req, res, next) => {
  const cacheStats = await redis.client.info('stats');
  
  logger.info('Cache stats', {
    hits: cacheStats.keyspace_hits,
    misses: cacheStats.keyspace_misses,
    hitRate: cacheStats.keyspace_hits / 
             (cacheStats.keyspace_hits + cacheStats.keyspace_misses)
  });
  
  next();
});
```

**Expected Result**: -50-70% database load ✅

---

## 🚀 ADDITIONAL OPTIMIZATIONS

### Frontend Performance

```javascript
// apps/web/next.config.js

module.exports = {
  // 1. Image optimization
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // 2. Compression
  compress: true,
  
  // 3. Code splitting
  productionBrowserSourceMaps: false, // Reduce bundle
  
  // 4. Static optimization
  staticPageGenerationTimeout: 60,
  
  // 5. SWR (Stale-While-Revalidate)
  // Already used in data fetching
};
```

### API Caching Headers

```javascript
// Add to all read endpoints
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=60'); // 1 minute
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});
```

### Enable Compression

```javascript
// apps/api/src/index.js
const compression = require('compression');

app.use(compression({
  level: 6, // Balance between compression speed and ratio
  threshold: 1024, // Only compress > 1KB
}));
```

---

## 📊 PERFORMANCE METRICS & TARGETS

### Before Optimization
```
API p95:              500ms
Database p95:         200ms
Average response:     150ms
Database load:        100%
Infrastructure cost:  100%
```

### After Phase 5
```
API p95:              150-200ms    (-70%)
Database p95:         50-100ms     (-75%)
Average response:     60-80ms      (-50%)
Database load:        30-40%       (-70%)
Infrastructure cost:  75%          (-25%)
```

---

## ✅ COMPLETION CHECKLIST

- [ ] Query optimization applied to top 10 slow queries
- [ ] Database indexes created and tested
- [ ] Redis deployed and integrated
- [ ] Caching strategy implemented on high-traffic endpoints
- [ ] Cache invalidation working correctly
- [ ] Performance metrics show 40-60% improvement
- [ ] API p95 < 200ms
- [ ] Database p95 < 100ms
- [ ] No customer-facing issues after deployment
- [ ] Team trained on new caching patterns
- [ ] Documentation updated with optimization tips

---

## 🎯 SUCCESS CRITERIA

**Phase 5 Complete When:**
```
✅ Performance improvement: 40-60%
✅ Database load reduced: 50-70%
✅ Cost reduction: 15-25%
✅ Zero performance regressions
✅ Team confident with new systems
✅ Ready for Phase 6
```

---

## 🚀 Next: Phase 6 - Security Hardening

Once Phase 5 is complete and validated, move to Phase 6 to add MFA, SSO, and enterprise security features.

