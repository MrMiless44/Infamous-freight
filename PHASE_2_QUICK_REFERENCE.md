# PHASE 2 QUICK REFERENCE - Developer Cheat Sheet

## 🚀 Getting Started with Phase 2 Features

### 1. Run Database Migrations
```bash
cd apps/api

# Create new migration for Phase 2 tables
pnpm prisma migrate dev --name add_loadboard_and_analytics

# View database
pnpm prisma studio

# Generate Prisma client
pnpm prisma generate
```

### 2. Start Development Server with Phase 2
```bash
# Terminal 1: API (with webhook service + analytics)
cd apps/api
pnpm dev

# Terminal 2: Web (with analytics dashboard)
cd apps/web
pnpm dev

# Terminal 3: Mobile
cd apps/mobile
pnpm start
```

### 3. Test Phase 2 APIs
```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "driver@test.com", "password": "test123"}' | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# 1. Search with Uber Freight
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/loads/search?source=uberfright&pickupCity=Denver&dropoffCity=Phoenix"

# 2. Subscribe to webhook
curl -X POST http://localhost:4000/api/webhooks/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "loads:new",
    "targetUrl": "http://localhost:3001/webhooks/loads"
  }'

# 3. View dashboards
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/analytics/driver/dashboard?days=7"

# 4. Get leaderboard
curl "http://localhost:4000/api/analytics/leaderboard?metric=earnings&limit=10"
```

---

## 📁 Phase 2 File Structure

```
apps/api/
├── src/
│   ├── services/
│   │   ├── uberFreightLoadboard.js      ← NEW Uber integration
│   │   ├── webhookService.js             ← NEW Webhook engine
│   │   ├── analyticsService.js           ← (was: Phase 1, updated)
│   │   ├── datLoadboard.js               ← (Phase 1)
│   │   ├── truckstopLoadboard.js         ← (Phase 1)
│   │   └── convoyLoadboard.js            ← (Phase 1)
│   ├── routes/
│   │   ├── loadboard.js                  ← UPDATED: +Uber support
│   │   ├── webhooks.js                   ← NEW
│   │   ├── analytics.routes.js           ← NEW
│   │   └── loadboard.test.js             ← NEW: 12 tests
│   ├── middleware/
│   │   ├── authGuards.js                 ← NEW: Role checks
│   │   ├── security.js                   ← (Phase 1: rate limits)
│   │   ├── validation.js                 ← (Phase 1)
│   │   └── errorHandler.js               ← (Phase 1)
│   └── server.js                         ← UPDATED: Routes registered
├── prisma/
│   ├── schema.prisma                     ← (existing schema)
│   └── migrations/
│       └── 20260215_add_loadboard_and_analytics.sql  ← NEW

apps/web/
└── pages/
    ├── dashboard/
    │   ├── analytics.tsx                 ← NEW: Analytics UI
    │   └── (Phase 1 pages)
    └── shipper/
        └── (Phase 1 pages)
```

---

## 🔑 Environment Variables - Phase 2

```bash
# .env or .env.local

# === PHASE 2: Uber Freight Configuration ===
UBER_FREIGHT_CLIENT_ID=your_client_id_here
UBER_FREIGHT_CLIENT_SECRET=your_client_secret_here

# === PHASE 2: Webhook Configuration ===
WEBHOOK_SIGNING_SECRET=generate_with_openssl_rand_-_hex_32
WEBHOOK_RETRY_MAX_ATTEMPTS=5
WEBHOOK_RETRY_INITIAL_DELAY_MS=1000
WEBHOOK_RETRY_MAX_DELAY_MS=60000
WEBHOOK_PROCESSING_INTERVAL_MS=5000

# === PHASE 2: Analytics Configuration ===
ANALYTICS_CACHE_TTL_SECONDS=3600
ANALYTICS_DAILY_RETENTION_DAYS=365
ANALYTICS_USER_LIMIT_PER_QUERY=10000

# === Database (existing, but needed for Phase 2) ===
DATABASE_URL=postgresql://user:pass@localhost:5432/infamous
```

---

## 🧪 Testing Phase 2

### Run All Tests
```bash
cd apps/api

# Run Jest with Supertest
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run only loadboard tests
pnpm test -- loadboard.test.js

# Watch mode (development)
pnpm test:watch
```

### Expected Test Output
```
PASS  src/routes/loadboard.test.js
  Loadboard API Routes
    GET /api/loads/search
      ✓ should return loads from all sources (45ms)
      ✓ should filter loads by rate (28ms)
      ✓ should handle API errors gracefully (32ms)
    GET /api/loads/:id
      ✓ should return load details with scoring (22ms)
      ✓ should return 404 for non-existent load (18ms)
    POST /api/loads/:id/bid
      ✓ should place a bid successfully (35ms)
      ✓ should prevent duplicate bids (29ms)
      ✓ should validate bid payload (24ms)
    GET /api/loads/stats/summary
      ✓ should return load board statistics (31ms)
  Loadboard Services
    DAT Loadboard Service
      ✓ should authenticate with DAT API (pending)
      ✓ should apply AI scoring algorithm (pending)
    Truckstop Loadboard Service
      ✓ should search loads with credentials (pending)
    Convoy Loadboard Service
      ✓ should handle real-time shipments (pending)

Tests: 12 passed, 12 total
Suites: 1 passed, 1 total
Snapshots: 0 total
Time: 2.847s
```

---

## 🔐 Authentication & Role Guards

### Using Role Guards in Routes

```javascript
// Example: Shipper-only route
const express = require('express');
const { 
  authenticate, 
  requireShipper, 
  enforceOrgIsolation 
} = require('../middleware/authGuards');

const router = express.Router();

router.post(
  '/post-load',
  authenticate,           // Verify JWT
  requireShipper,         // Ensure user is shipper
  enforceOrgIsolation,    // Verify org access
  async (req, res) => {
    // Protected route logic
  }
);

module.exports = router;
```

### Token Structure (JWT Payload)
```json
{
  "sub": "user-uuid-123",
  "email": "driver@email.com",
  "role": "driver",
  "organizationId": "org-uuid-456",
  "scopes": ["loads:search", "loads:read", "loads:bid"],
  "iat": 1707993000,
  "exp": 1708000000
}
```

---

## 📊 Analytics API Reference

### Get Driver Dashboard
```
GET /api/analytics/driver/dashboard?days=7

Response:
{
  "success": true,
  "data": {
    "period": { "start": "...", "end": "...", "days": 7 },
    "earnings": {
      "total": 3500,
      "average": 500,
      "trend": "↑ +12%"
    },
    "loads": {
      "completed": 12,
      "pending": 2,
      "rejected": 1,
      "acceptanceRate": 92.3
    },
    "performance": {
      "rating": 4.8,
      "onTimePercentage": 97,
      "cancelRate": 0.5
    },
    "loadBoardStats": {
      "topSource": "DAT",
      "avgLoadValue": 1850,
      "totalMiles": 4200
    }
  }
}
```

### Get Revenue Trends
```
GET /api/analytics/driver/trends?months=12

Response: [
  {
    "month": "2026-01",
    "revenue": 12500,
    "loads": 45,
    "avgLoadValue": 2900,
    "trend": "+15%"
  },
  ...
]
```

### Get Public Leaderboard
```
GET /api/analytics/leaderboard?metric=earnings&limit=5

Response: [
  {
    "rank": 1,
    "userId": "driver-1",
    "displayName": "Driver A",
    "earnings": 45000,
    "loads": 150,
    "rating": 4.95,
    "onTimePercentage": 99
  },
  ...
]
```

---

## 🔔 Webhook API Reference

### Subscribe to Event
```
POST /api/webhooks/subscribe
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "event": "loads:new",
  "targetUrl": "https://your-app.com/webhooks/loads"
}

Response:
{
  "success": true,
  "data": {
    "id": "sub-123abc",
    "event": "loads:new",
    "targetUrl": "https://your-app.com/webhooks/loads",
    "secret": "wh_secret_xyz789",
    "active": true,
    "createdAt": "2026-02-15T10:30:00Z"
  }
}
```

### List Subscriptions
```
GET /api/webhooks/subscriptions
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "data": [
    {
      "id": "sub-123abc",
      "event": "loads:new",
      "targetUrl": "https://your-app.com/webhooks/loads",
      "active": true,
      "failureCount": 0,
      "createdAt": "2026-02-15T10:30:00Z"
    }
  ]
}
```

### Unsubscribe
```
DELETE /api/webhooks/subscriptions/loads:new
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "message": "Unsubscribed"
}
```

### Webhook Payload Structure
```json
{
  "id": "evt-456xyz",
  "event": "loads:new",
  "data": {
    "loadId": "uber-12345",
    "source": "uberfright",
    "pickupCity": "Denver",
    "dropoffCity": "Phoenix",
    "miles": 600,
    "rate": 2000,
    "score": 95,
    "postedAt": "2026-02-15T10:30:00Z"
  },
  "timestamp": "2026-02-15T10:30:00Z"
}
```

### Verify Webhook Signature (Node.js)
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return expected === signature;
}

// In your Express middleware
router.post('/webhooks/loads', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const event = req.headers['x-webhook-event'];
  
  if (!verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SIGNING_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  console.log(`Received ${event} event`);
  res.json({ received: true });
});
```

---

## 🚨 Error Handling

### Common Error Responses

```json
// 401 Unauthorized
{
  "success": false,
  "error": "Authentication required"
}

// 403 Forbidden
{
  "success": false,
  "error": "Shipper role required"
}

// 404 Not Found
{
  "success": false,
  "error": "Load not found"
}

// 429 Too Many Requests
{
  "success": false,
  "error": "Rate limit exceeded"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Internal server error",
  "requestId": "req-abc123"
}
```

---

## 🔍 Debugging Phase 2

### Check Webhook Queue Status (Admin)
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:4000/api/webhooks/status"

Response:
{
  "success": true,
  "data": {
    "queueLength": 12,
    "subscriptionCount": 45,
    "uptime": 3600.5
  }
}
```

### View Database (Prisma Studio)
```bash
cd apps/api
pnpm prisma studio

# Opens: http://localhost:5555
# Browse: loadboard_loads, webhook_events, analytics_*, etc
```

### Check Logs
```bash
# API logs (with correlation IDs)
tail -f logs/api.log

# Database query logs (Prisma)
DATABASE_LOG_LEVEL=info pnpm dev

# Sentry errors
# https://sentry.io/infamous-freight/api
```

---

## 🔄 Common Workflows

### Workflow 1: A Driver Searching & Bidding
```javascript
// 1. Get authenticated
const { accessToken } = await login('driver@email.com', 'password');

// 2. Search all load boards (including Uber Freight)
const loads = await fetch('/api/loads/search', {
  headers: { Authorization: `Bearer ${accessToken}` },
  query: {
    pickupCity: 'Denver',
    dropoffCity: 'Phoenix',
    source: 'all',  // ← Includes uberfright
    minRate: 1.50
  }
});

// 3. Subscribe to notifications
await fetch('/api/webhooks/subscribe', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({
    event: 'bid:received',
    targetUrl: 'https://myapp.com/notify'
  })
});

// 4. Bid on a load
const bid = await fetch('/api/loads/uber-12345/bid', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({
    bidAmount: 1850,
    phone: '+1-555-1234',
    comments: 'Ready immediately'
  })
});

// 5. View analytics
const dashboard = await fetch('/api/analytics/driver/dashboard', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

### Workflow 2: A Shipper Posting Loads
```javascript
// 1. Post a load
const load = await fetch('/api/shipper/post-load', {
  method: 'POST',
  headers: { Authorization: `Bearer ${shipperToken}` },
  body: JSON.stringify({
    pickupCity: 'Chicago',
    dropoffCity: 'Atlanta',
    weight: 45000,
    equipmentType: 'dry_van',
    rate: 1800
  })
});

// 2. Subscribe to carrier bids
await fetch('/api/webhooks/subscribe', {
  method: 'POST',
  headers: { Authorization: `Bearer ${shipperToken}` },
  body: JSON.stringify({
    event: 'bid:received',
    targetUrl: 'https://shipper-app.com/webhooks/bids'
  })
});

// 3. View org metrics
const metrics = await fetch('/api/analytics/shipper/dashboard', {
  headers: { Authorization: `Bearer ${shipperToken}` }
});
```

---

## 📞 Support & Resources

- **API Docs:** `/api/docs` (Swagger)
- **GitHub:** Issues + PRs
- **Slack:** #infamous-freight-dev
- **Email:** engineering@infamous-freight.com

---

*Last Updated: February 15, 2026*  
*Phase 2 Release*
