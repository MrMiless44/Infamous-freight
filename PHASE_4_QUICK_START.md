# Phase 4: Quick Start Guide

**Get Phase 4 up and running with practical code examples.**

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 16+ with Phase 4 migrations applied
- Redis 7+ (for notification queues)
- API running on port 4000 (or configured API_PORT)

## 🚀 Setup Steps

### 1. Database Migration

```bash
# Apply Phase 4 schema
cd apps/api
pnpm prisma:migrate:deploy

# Generate Prisma client
pnpm prisma:generate

# (Optional) Verify tables created
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE tablename LIKE '%neural%' OR tablename LIKE '%blockchain%';"
```

### 2. Environment Variables

Add to `.env`:

```env
# Phase 4: Features
PHASE_4_ENABLED=true

# Neural Networks
NN_MODELS_CACHE_TTL=300000       # 5 minutes
NN_PREDICTION_CONFIDENCE_MIN=0.3  # Minimum viable confidence

# Blockchain
BLOCKCHAIN_DIFFICULTY=3           # Mining difficulty (1-5, higher = harder)
BLOCKCHAIN_GAS_LIMIT=21000        # Transaction limit
ESCROW_AUTO_RELEASE=true          # Auto-release on delivery

# Real-time Notifications
NOTIFICATION_QUEUE_MAX=50         # Offline queue size
NOTIFICATION_TTL=3600            # Offline message TTL (seconds)
WEBSOCKET_RECONNECT_MAX=5        # Max reconnection attempts
WEBSOCKET_BACKOFF_BASE=1000      # Exponential backoff (ms)

# Advanced Geofencing
GEOFENCE_LOCATION_CHECK_INTERVAL=5000  # ms
GEOFENCE_SPEED_LIMIT_ENFORCEMENT=true
GEOFENCE_HAZARD_WARNING_RADIUS=5000    # meters

# Analytics & BI
ANALYTICS_CACHE_TTL=60000        # 1 minute
MARKET_TREND_UPDATE_INTERVAL=3600000  # 1 hour

# Compliance & Insurance
COMPLIANCE_AUDIT_INTERVAL=86400000    # 24 hours
OCR_CONFIDENCE_THRESHOLD=0.85
FMCSA_CHECK_INTERVAL=604800000        # 7 days
```

### 3. Start API Server

```bash
pnpm api:dev
# or
pnpm dev
```

Verify with:
```bash
curl http://localhost:4000/api/health
# Response: { "uptime": 12.345, "status": "ok", "database": "connected" }
```

## 💻 Code Examples

### Neural Networks

#### 1. Initialize ML Models

```javascript
// Frontend/Backend sending request
const response = await fetch('http://localhost:4000/api/v4/ml/nn/initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    driverId: 'driver_5829',
  }),
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "modelsInitialized": ["loadAcceptance", "demandForecast", "fraudDetection", "riskScoring"],
//   "driverId": "driver_5829"
// }
```

#### 2. Predict Load Acceptance

```javascript
const load = {
  id: 'load_12345',
  rate: 1850,
  distance: 285,
  pickupTime: new Date(Date.now() + 3600000),
  hazmat: false,
  weatherScore: 0.8,
  trafficScore: 0.6,
  preferenceMatch: 0.9,
};

const response = await fetch('http://localhost:4000/api/v4/ml/nn/load-acceptance', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    driverId: 'driver_5829',
    load,
  }),
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "driverId": "driver_5829",
//   "loadId": "load_12345",
//   "acceptanceProbability": 0.87,
//   "recommendation": "high_likelihood"
// }
```

#### 3. Forecast Demand

```javascript
const historicalData = Array(30).fill(0).map((_, i) => 50 + Math.random() * 30);

const response = await fetch('http://localhost:4000/api/v4/ml/nn/demand-forecast', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    region: 'Phoenix Metro',
    historicalData,
  }),
});

const result = await response.json();
console.log(result.forecast);
// [
//   { volume: 68, confidence: 0.82, trend: "up" },
//   { volume: 71, confidence: 0.81, trend: "up" },
//   ...
// ]
```

### Real-time Notifications

#### 1. Initialize Websocket Connection

```javascript
// React/React Native Component
import { useEffect, useRef } from 'react';

export function NotificationsListener() {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket
    fetch('http://localhost:4000/api/v4/notifications/init-connection', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'driver_5829' }),
    });

    // Subscribe to topics
    fetch('http://localhost:4000/api/v4/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'driver_5829',
        topic: 'load_matches',
      }),
    });
  }, []);

  return <div>Listening for notifications...</div>;
}
```

#### 2. Broadcast Load Match

```javascript
// Backend: Dispatcher notifying drivers of new load
const response = await fetch('http://localhost:4000/api/v4/notifications/broadcast-load-match', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${dispatcherToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    load: {
      id: 'load_12345',
      origin: 'Phoenix, AZ',
      destination: 'Las Vegas, NV',
      rate: 1850,
      distance: 285,
      pickupTime: new Date(Date.now() + 7200000),
      estimatedDelivery: new Date(Date.now() + 14400000),
    },
    driverIds: ['driver_5829', 'driver_6194', 'driver_7283'],
  }),
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "notification": {
//     "type": "load_match",
//     "data": { "loadId": "load_12345", "matchScore": 0.92, ... },
//     "expiresIn": 300
//   },
//   "results": [...],
//   "deliveredCount": 3,
//   "enqueuedCount": 0
// }
```

### Blockchain & Escrow

#### 1. Create Escrow Contract

```javascript
// Shipper posts load, escrow created automatically
const response = await fetch('http://localhost:4000/api/v4/blockchain/escrow/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${shipperToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    shipper: 'shipper_acme',
    driver: 'driver_5829',
    amount: 1850.00,
    loadId: 'load_12345',
    releaseCondition: 'delivery_confirmed',
  }),
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "escrowId": "escrow_16823...",
//   "status": "locked",
//   "amount": 1850.00,
//   "transactionHash": "0x7f8d3b9e..."
// }
```

#### 2. Confirm Delivery & Release Escrow

```javascript
// Driver marks delivery complete, escrow releases
const response = await fetch('http://localhost:4000/api/v4/blockchain/escrow/confirm-delivery', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${driverToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    escrowId: 'escrow_16823',
    driver: 'driver_5829',
    proofOfDelivery: {
      lat: 36.1699,
      lon: -115.1398,
      timestamp: new Date(),
      photos: ['delivery_photo_1.jpg'],
    },
    driverSignature: 'signature_hex_string',
  }),
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "escrowId": "escrow_16823",
//   "status": "released",
//   "amount": 1850.00,
//   "receiver": "driver_5829",
//   "transactionHash": "0x9a2c4f1b..."
// }
```

### Advanced Geofencing

#### 1. Create Safety Corridor

```javascript
const response = await fetch('http://localhost:4000/api/v4/geofencing/corridors/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Phoenix to Las Vegas Safe Corridor',
    startLocation: { lat: 33.4484, lon: -112.0742 }, // Phoenix
    endLocation: { lat: 36.1699, lon: -115.1398 },   // Las Vegas
    width: 2000, // 2km on both sides
    waypoints: [
      { lat: 33.8, lon: -113.1 },
      { lat: 34.5, lon: -113.8 },
      { lat: 35.2, lon: -114.5 },
    ],
    speed_limit: 70,
    hazardous_areas: [
      {
        name: 'Mountain Pass',
        location: { lat: 34.8, lon: -113.9 },
        type: 'elevation_gain',
        warningRadius: 5000,
        recommendation: 'Reduce speed and check brakes',
      },
    ],
  }),
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "corridor": { "id": "corridor_...", "name": "...", ... }
// }
```

#### 2. Update Driver Location

```javascript
// Called every 5-10 seconds from mobile app
const response = await fetch('http://localhost:4000/api/v4/geofencing/update-location', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${driverToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    driverId: 'driver_5829',
    location: {
      lat: 34.42,
      lon: -113.65,
      speed: 65, // mph
      heading: 245, // degrees
    },
  }),
});

const result = await response.json();
console.log(result.events);
// [
//   { type: 'zone_entry', zoneName: 'Mountain Pass', ... },
//   { type: 'speeding_violation', currentSpeed: 65, speedLimit: 55, ... }
// ]
```

### Analytics & BI

#### 1. Get Operations Dashboard

```javascript
const response = await fetch('http://localhost:4000/api/v4/analytics/dashboard/operations', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${dispatcherToken}`,
  },
});

const dashboard = await response.json();
console.log(dashboard.dashboard);
// {
//   "sections": {
//     "summary": {
//       "activeDrivers": 87,
//       "totalShipments": 512,
//       "onTimeDeliveries": 94.5,
//       "revenue24h": 48375
//     },
//     "drivers": { ... },
//     "shipments": { ... },
//     "financials": { ... }
//   }
// }
```

#### 2. Get Market Trends

```javascript
const response = await fetch('http://localhost:4000/api/v4/analytics/market-trends', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${directorToken}`,
  },
});

const trends = await response.json();
console.log(trends.trends.regions);
// [
//   {
//     "name": "Phoenix Metro",
//     "demandLevel": "high",
//     "avgRate": 1850,
//     "trend": "increasing",
//     "recommendedCapacity": "increase"
//   },
//   ...
// ]
```

### Compliance & Insurance

#### 1. Initiate Insurance Claim

```javascript
// Auto-triggered on incident detection
const response = await fetch('http://localhost:4000/api/v4/compliance/insurance/claim', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${safetyToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'collision',
    driverId: 'driver_5829',
    vehicleId: 'vehicle_108',
    date: new Date(),
    location: '39.7392 N, 104.9903 W',
    description: 'Rear-end collision at traffic light',
    damageEstimate: 8500,
    thirdParty: {
      name: 'John Smith',
      phoneNumber: '555-0102',
      insuranceCompany: 'State Farm',
    },
    photos: ['damage_1.jpg', 'damage_2.jpg'],
  }),
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "claim": {
//     "claimId": "claim_...",
//     "status": "auto_initiated",
//     "severity": "high",
//     "estimatedAmount": 8500,
//     "assignedAdjuster": "Auto-Assignment Pending",
//     "nextSteps": [...]
//   }
// }
```

#### 2. Run Compliance Audit

```javascript
const response = await fetch('http://localhost:4000/api/v4/compliance/audit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    driverId: 'driver_5829',
  }),
});

const audit = await response.json();
console.log(audit.audit);
// {
//   "overallScore": 92,
//   "overallStatus": "compliant",
//   "categories": {
//     "documentation": { "score": 95, "status": "compliant" },
//     "licensing": { "score": 100, "status": "compliant" },
//     ...
//   },
//   "findings": [...]
// }
```

## 🧪 Manual Testing

### Test Neural Network Prediction

```bash
curl -X POST http://localhost:4000/api/v4/ml/nn/load-acceptance \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver_test_001",
    "load": {
      "id": "load_test_001",
      "rate": 1850,
      "distance": 285,
      "hazmat": false
    }
  }'
```

### Test Blockchain Transaction

```bash
curl -X POST http://localhost:4000/api/v4/blockchain/record-transaction \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "sender": "shipper_001",
    "receiver": "driver_001",
    "amount": 1850.00,
    "loadId": "load_001"
  }'
```

### Test Geofencing Location Update

```bash
curl -X POST http://localhost:4000/api/v4/geofencing/update-location \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver_test_001",
    "location": {
      "lat": 33.4484,
      "lon": -112.0742,
      "speed": 65
    }
  }'
```

## 📊 Monitoring & Observability

### Check Neural Network Status

```bash
curl http://localhost:4000/api/v4/ml/nn/status/driver_5829 \
  -H "Authorization: Bearer $JWT"
```

### Get Notification Analytics

```bash
curl http://localhost:4000/api/v4/notifications/analytics \
  -H "Authorization: Bearer $JWT"
```

### Get Blockchain Statistics

```bash
curl http://localhost:4000/api/v4/blockchain/statistics \
  -H "Authorization: Bearer $JWT"
```

## 🐛 Troubleshooting

### Issue: Neural network predictions time out

**Solution**: Check `NN_MODELS_CACHE_TTL` is set appropriately. Reduce prediction complexity if needed.

### Issue: WebSocket disconnects frequently

**Solution**: Verify `WEBSOCKET_RECONNECT_MAX` and `WEBSOCKET_BACKOFF_BASE` are reasonable. Check network stability.

### Issue: Blockchain mining too slow

**Solution**: Reduce `BLOCKCHAIN_DIFFICULTY` from 3 to 2 or 1.

### Issue: Geofencing not firing events

**Solution**: Ensure `GEOFENCE_LOCATION_CHECK_INTERVAL` is low enough (5000ms recommended) and location updates are being sent.

### Issue: Compliance documents not OCR'ing

**Solution**: Check `OCR_CONFIDENCE_THRESHOLD` is not too high (0.85 recommended). Verify document images are clear.

## 🎓 Next Steps

1. **Deploy to Staging**: Push to staging environment for integration testing
2. **Load Testing**: Use k6/Locust to test under load (1000+ concurrent users)
3. **Mobile Integration**: Connect React Native app to Phase 4 APIs
4. **Frontend Integration**: Build dashboards with real-time updates
5. **Monitoring**: Set up dashboards in Datadog/Sentry for Phase 4 metrics

## 📚 Further Reading

- [PHASE_4_IMPLEMENTATION_PLAN.md](PHASE_4_IMPLEMENTATION_PLAN.md) - Full technical details
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [SECURITY.md](SECURITY.md) - Security best practices
- Copilot Instructions - Architecture patterns in repo root

---

**Phase 4 is production-ready. Deploy with confidence!** ✅
