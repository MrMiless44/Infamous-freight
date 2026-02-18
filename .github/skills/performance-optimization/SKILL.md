---
name: Performance Optimization
description: Optimize bundle sizes, database queries, API responses, and user experience metrics
keywords:
  - performance
  - optimization
  - bundling
  - caching
  - monitoring
  - metrics
  - lighthouse
  - core-web-vitals
---

# Performance Optimization Skill

## 📋 Quick Rules

1. **Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
2. **Bundle**: First Load JS < 150KB, Total < 500KB
3. **API Response**: < 1s for 95% of requests
4. **Database**: No N+1 queries, use indexes
5. **Monitoring**: Track metrics via Vercel Analytics + Datadog

## 📊 Key Metrics

### Core Web Vitals

| Metric | Target | Tool |
|--------|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse, PageSpeed Insights |
| FID (First Input Delay) | < 100ms | Web Vitals, Datadog RUM |
| CLS (Cumulative Layout Shift) | < 0.1 | Web Vitals, Chrome DevTools |

### API Performance

```javascript
// Log response times
const startTime = Date.now();
// ... handle request
const duration = Date.now() - startTime;
logger.info(`Request completed in ${duration}ms`, {
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration,
});

// Alert on slow requests
if (duration > 1000) {
  Sentry.captureMessage(`Slow API request: ${req.path} took ${duration}ms`);
}
```

## 🎯 Frontend Optimization

### Code Splitting

```typescript
// apps/web/pages/dashboard.tsx
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(() => import('../components/Chart'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-only rendering
});

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<Loader />}>
        <ChartComponent />
      </Suspense>
    </div>
  );
}
```

### Image Optimization

```typescript
import Image from 'next/image';

// Automatic optimization: AVIF, WebP, responsive
<Image 
  src="/shipment.jpg"
  alt="Shipment"
  width={600}
  height={400}
  priority // Load above-the-fold images first
  placeholder="blur" // Blur-up effect
/>
```

### Bundle Analysis

```bash
cd apps/web
ANALYZE=true pnpm build
# Opens interactive visualization at http://localhost:3000
```

**Targets**:
- First Load JS < 150KB
- Total bundle < 500KB
- No unused dependencies (tree-shaking enabled)

## 🗄️ Database Optimization

### N+1 Query Prevention

```javascript
// ❌ BAD: Multiple queries
const users = await prisma.user.findMany();
for (const user of users) {
  user.shipments = await prisma.shipment.findMany({
    where: { userId: user.id }
  });
}

// ✅ GOOD: Single query with include
const users = await prisma.user.findMany({
  include: {
    shipments: {
      take: 5, // Limit related records
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

### Query Optimization

```javascript
// Use select to get only needed fields
const shipments = await prisma.shipment.findMany({
  select: {
    id: true,
    trackingNum: true,
    status: true,
    driver: {
      select: { name: true, email: true },
    },
  },
  where: { status: 'IN_TRANSIT' },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

### Indexing Strategy

```prisma
model Shipment {
  id          Int
  trackingNum String @unique  // Implicit index
  status      ShipmentStatus
  userId      Int
  createdAt   DateTime
  
  // Explicit indexes
  @@index([userId])                    // Single column filter
  @@index([status])                    // Status filtering
  @@index([userId, status, createdAt]) // Composite for complex queries
}
```

## ⚡ API Performance

### Response Caching

```javascript
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

router.get('/shipments/:id', async (req, res, next) => {
  const cacheKey = `shipment:${req.params.id}`;
  
  // Check cache
  if (cache.has(cacheKey)) {
    res.set('X-Cache', 'HIT');
    return res.json(cache.get(cacheKey));
  }
  
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    
    // Cache result
    cache.set(cacheKey, shipment);
    setTimeout(() => cache.delete(cacheKey), CACHE_DURATION);
    
    res.set('X-Cache', 'MISS');
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});
```

### Pagination for Large Results

```javascript
router.get('/shipments', async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * pageSize;
  
  const [data, total] = await Promise.all([
    prisma.shipment.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.shipment.count(),
  ]);
  
  res.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
```

## 📈 Monitoring & Observability

### Lighthouse CI

```bash
cd apps/web
pnpm build
npx lighthouse http://localhost:3000 --view
```

**Budget** (score targets):
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### Vercel Analytics

Automatic tracking in `apps/web/pages/_app.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

### Datadog RUM

```typescript
import { datadogRum } from '@datadog/browser-rum';

if (process.env.NEXT_PUBLIC_ENV === 'production') {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DD_APP_ID!,
    clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
    site: process.env.NEXT_PUBLIC_DD_SITE!,
    service: 'web',
    version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
  });
  datadogRum.startSessionReplayRecording();
}
```

## 🎬 Load Testing

### k6 Script

```javascript
// load-test.k6.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,        // 100 virtual users
  duration: '30s', // 30 seconds
};

export default function () {
  const res = http.get('http://api:3001/api/shipments');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });
}
```

Run:
```bash
k6 run load-test.k6.js
```

## 📋 Performance Checklist

- ✅ LCP < 2.5s, FID < 100ms, CLS < 0.1
- ✅ Images optimized (WebP, lazy loading)
- ✅ Code splitting for routes & components
- ✅ No N+1 database queries
- ✅ Pagination for large result sets
- ✅ Proper indexing on frequently queried columns
- ✅ Response caching where appropriate
- ✅ Gzip/Brotli compression enabled
- ✅ CDN configured for static assets
- ✅ Monitoring & alerting in place

## 🔗 Resources

- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
- [Datadog RUM Docs](https://docs.datadoghq.com/real_user_monitoring/)
- [k6 Load Testing](https://k6.io/)
