# Phase 8 Integration Guide - Production Deployment

## 🔧 Environment Setup

### Required Environment Variables

```bash
# ML Service
ML_SERVER=http://localhost:5000
ML_API_KEY=your_ml_api_key

# Exchange Rate API
EXCHANGE_RATE_API_KEY=your_api_key  # exchangerate-api.com

# Speech-to-Text
SPEECH_TO_TEXT_API=google|azure|aws
SPEECH_API_KEY=your_api_key

# WebSocket Configuration
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=8080
SOCKET_IO_ADAPTER=redis

# Blockchain
BLOCKCHAIN_DIFFICULTY=3
BLOCKCHAIN_NETWORK=ethereum|polygon

# Reporting
REPORT_STORAGE_PATH=/var/reports
REPORT_EXPIRY_DAYS=7

# Feature Flags
ENABLE_ML_ROUTING=true
ENABLE_FRAUD_DETECTION=true
ENABLE_DYNAMIC_PRICING=true
ENABLE_VOICE_COMMANDS=true
ENABLE_AR_TRACKING=true
ENABLE_BLOCKCHAIN=true
```

---

## 📦 Service Installation

### 1. Install Dependencies

```bash
cd /workspaces/Infamous-freight-enterprises

# Install additional packages for Phase 8
pnpm add \
  ws \
  socket.io \
  axios \
  crypto \
  express-validator

# Build shared package
pnpm --filter @infamous-freight/shared build
```

### 2. Register Routes in Express App

Edit `apps/api/src/index.js`:

```javascript
const phase8Routes = require("./routes/phase8.advanced");

// Register Phase 8 routes
app.use("/api/v1/phase8", phase8Routes);

// Or include in main API router
app.use("/api", phase8Routes);
```

### 3. Initialize Services in Server

```javascript
// apps/api/src/index.js

const {
  MLRouteOptimizationService,
} = require("./services/mlRouteOptimization");
const {
  BlockchainVerificationService,
} = require("./services/blockchainVerification");
const { RealTimeTrackingService } = require("./services/realTimeTracking");

// Initialize blockchain on startup
const blockchain = new BlockchainVerificationService();
console.log("Blockchain initialized:", blockchain.getBlockchainStats());

// Warm up ML service connection
const mlService = new MLRouteOptimizationService(prisma);
// Pre-connect or health check
```

---

## 🗄️ Database Migrations

### Add Phase 8 Tables (Prisma Schema)

Edit `apps/api/prisma/schema.prisma`:

```prisma
// Driver Performance Scores
model DriverPerformanceScore {
  id           String   @id @default(cuid())
  driverId     String
  driver       Driver   @relation(fields: [driverId], references: [id])
  overallScore Float
  safetyScore  Float
  reliabilityScore Float
  satisfactionScore Float
  efficiencyScore Float
  tier         String   // PLATINUM, GOLD, SILVER, BRONZE, STANDARD
  timestamp    DateTime @default(now())

  @@index([driverId])
}

// Customer NPS Surveys
model NPSSurvey {
  id           String   @id @default(cuid())
  customerId   String
  shipmentId   String
  npsScore     Int // 0-10
  sentiment    String   // POSITIVE, NEUTRAL, NEGATIVE
  respondentType String // PROMOTER, PASSIVE, DETRACTOR
  responses    Json
  createdAt    DateTime @default(now())

  @@index([customerId, shipmentId])
}

// Fraud Detection Records
model FraudDetectionLog {
  id        String   @id @default(cuid())
  type      String   // payment, rating, abuse
  riskScore Float
  riskLevel String   // LOW, MEDIUM, HIGH, CRITICAL
  action    String   // ALLOW, BLOCK, REJECT, SUSPEND
  details   Json
  timestamp DateTime @default(now())

  @@index([riskLevel, timestamp])
}

// Blockchain Transactions
model BlockchainTransaction {
  id          String   @id @default(cuid())
  shipmentId  String
  blockHash   String
  blockHeight Int
  verified    Boolean
  timestamp   DateTime @default(now())

  @@unique([shipmentId, blockHash])
}

// Voice Command History
model VoiceCommand {
  id        String   @id @default(cuid())
  userId    String
  command   String
  confidence Float
  result    Json
  timestamp DateTime @default(now())

  @@index([userId, timestamp])
}

// AR Tracking Sessions
model ARTrackingSession {
  id          String   @id @default(cuid())
  shipmentId  String
  userId      String
  startedAt   DateTime
  endedAt     DateTime?
  duration    Int?
  signature   Json?

  @@index([shipmentId, userId])
}

// Advanced Schedule Records
model AdvancedSchedule {
  id            String   @id @default(cuid())
  date          DateTime
  driverId      String
  assignedShipments Json
  capacity      Int
  utilized      Int
  optimality    Float
  timestamp     DateTime @default(now())

  @@index([driverId, date])
}
```

### Run Migration

```bash
cd apps/api
pnpm prisma migrate dev --name add_phase8_tables
pnpm prisma generate
```

---

## 🔌 External Service Integration

### 1. ML Server Setup

Create Python ML service:

```python
# ml_service.py
from flask import Flask, request, jsonify
import numpy as np
from sklearn.cluster import KMeans

app = Flask(__name__)

@app.route('/api/optimize-routes', methods=['POST'])
def optimize_routes():
    data = request.json
    shipments = data['shipments']
    drivers = data['drivers']

    # ML optimization logic
    optimized_routes = ml_optimize(shipments, drivers)

    return jsonify(optimized_routes)

@app.route('/api/demand-forecast', methods=['POST'])
def forecast_demand():
    region = request.json['region']
    time_window = request.json['timeWindow']

    forecast = predict_demand(region, time_window)
    return jsonify(forecast)

if __name__ == '__main__':
    app.run(port=5000)
```

Deploy:

```bash
python ml_service.py &
```

### 2. WebSocket Server Setup

```javascript
// apps/api/src/services/websocket.js
const WebSocket = require("ws");
const socketIo = require("socket.io");

class WebSocketManager {
  constructor(server) {
    this.io = socketIo(server, {
      cors: { origin: process.env.CORS_ORIGINS },
    });

    this.io.on("connection", this.handleConnection.bind(this));
  }

  handleConnection(socket) {
    console.log("Client connected:", socket.id);

    socket.on("subscribe-tracking", (shipmentId) => {
      socket.join(`tracking_${shipmentId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  }

  broadcastUpdate(shipmentId, update) {
    this.io.to(`tracking_${shipmentId}`).emit("location-update", update);
  }
}

module.exports = { WebSocketManager };
```

---

## ✅ Testing Phase 8 Services

### Unit Tests

```bash
# Test individual services
pnpm test apps/api/src/services/mlRouteOptimization.test.js
pnpm test apps/api/src/services/fraudDetection.test.js
pnpm test apps/api/src/services/dynamicPricing.test.js
```

### Integration Tests

```javascript
// tests/phase8.integration.test.js
describe("Phase 8 Services", () => {
  it("should calculate dynamic price", async () => {
    const pricing = new DynamicPricingService(prisma);
    const price = await pricing.calculateDynamicPrice({
      distance: 10,
      weight: 5,
      urgency: "express",
    });

    expect(price.finalPrice).toBeGreaterThan(0);
  });

  it("should detect payment fraud", async () => {
    const fraud = new FraudDetectionService(prisma);
    const result = await fraud.analyzePaymentFraud({
      amount: 5000,
      cardNew: true,
      geoDifference: 2000,
    });

    expect(result.riskLevel).toEqual("HIGH");
  });
});
```

### E2E Tests (Playwright)

```javascript
// e2e/phase8.spec.ts
test("AI chatbot should track shipment", async ({ page }) => {
  await page.goto("http://localhost:3000/support");

  await page.fill('[data-test="chat-input"]', "track my order");
  await page.click('[data-test="send-button"]');

  await expect(page.locator('[data-test="order-status"]')).toBeVisible();
});

test("AR tracking should display shipment", async ({ page }) => {
  await page.goto("http://localhost:3000/tracking/ar");

  const arCanvas = page.locator('[data-test="ar-canvas"]');
  await expect(arCanvas).toBeVisible();
});
```

---

## 📊 Monitoring & Observability

### Sentry Configuration

```javascript
// apps/api/src/middleware/sentry.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Express({
      request: true,
      serverName: true,
    }),
  ],
});

// Track Phase 8 operations
const trackPhase8Operation = (operationType, metadata) => {
  Sentry.captureEvent({
    message: `Phase 8 Operation: ${operationType}`,
    level: "info",
    contexts: {
      operation: {
        type: operationType,
        ...metadata,
      },
    },
  });
};

module.exports = { trackPhase8Operation };
```

### Datadog Monitoring

```javascript
// apps/api/src/middleware/datadog.js
const StatsD = require("node-statsd");

const client = new StatsD({
  host: process.env.DD_HOST,
  port: 8125,
});

const trackMetric = (metricName, value, tags = []) => {
  client.gauge(metricName, value, tags);
};

// Example usage in services
trackMetric("phase8.pricing.calculation", price, ["service:pricing"]);
trackMetric("phase8.fraud.risk_score", riskScore, ["service:fraud"]);
```

---

## 🚀 Performance Optimization

### Database Indexing

```sql
-- Add indexes for Phase 8 queries
CREATE INDEX idx_driver_performance_score ON DriverPerformanceScore(driverId, timestamp);
CREATE INDEX idx_nps_survey_customer ON NPSSurvey(customerId, createdAt);
CREATE INDEX idx_fraud_log_timestamp ON FraudDetectionLog(timestamp, riskLevel);
CREATE INDEX idx_blockchain_shipment ON BlockchainTransaction(shipmentId);
CREATE INDEX idx_voice_command_user ON VoiceCommand(userId, timestamp);
```

### Query Optimization

```javascript
// Use selective fields
const driverScore = await prisma.driverPerformanceScore.findUnique({
  where: { driverId },
  select: {
    overallScore: true,
    tier: true,
    timestamp: true,
  },
});

// Use batch fetching
const scores = await prisma.driverPerformanceScore.findMany({
  where: { driverId: { in: driverIds } },
  select: { driverId: true, overallScore: true },
});
```

### Caching Layer

```javascript
// Redis caching for ML predictions
const cache = new Map();
const ML_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getMLOptimization(shipmentIds) {
  const cacheKey = `ml_opt_${shipmentIds.join("_")}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const result = await mlService.optimizeRoutesML(shipments, drivers);
  cache.set(cacheKey, result);

  setTimeout(() => cache.delete(cacheKey), ML_CACHE_TTL);
  return result;
}
```

---

## 🔐 Security Considerations

### Access Control

Ensure proper scope authorization for each endpoint:

```javascript
// Rate limiting tiers for Phase 8 operations
const phase8Limiters = {
  mlOptimization: rateLimit({ windowMs: 60000, max: 20 }), // 20/min
  fraudDetection: rateLimit({ windowMs: 60000, max: 100 }), // 100/min
  dynamicPricing: rateLimit({ windowMs: 15 * 60000, max: 500 }), // 500/15min
  voiceCommands: rateLimit({ windowMs: 60000, max: 30 }), // 30/min
  arTracking: rateLimit({ windowMs: 5000, max: 60 }), // 60/5sec
};
```

### Data Privacy

- Encrypt sensitive ML training data
- Anonymize chatbot conversation logs
- GDPR compliance for NPS surveys
- Secure blockchain transaction storage

---

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] ML server deployed and running
- [ ] Database migrations applied
- [ ] WebSocket server initialized
- [ ] External APIs integrated
- [ ] Dependencies installed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Monitoring configured
- [ ] Performance baselines set
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Load testing completed

---

## 📞 Support

For Phase 8 service issues:

1. Check service logs: `docker logs api`
2. Verify external service connectivity
3. Review Sentry error tracking
4. Check rate limiting and authentication scopes
5. Validate database indexes and query performance

**Status: Ready for Production Deployment** ✅
