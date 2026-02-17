# Phase 3 Quick Start Guide

## 🚀 Getting Started with Phase 3 Features

### 1. Machine Learning Recommendations

#### Backend Setup

```javascript
// apps/api/src/services/mlRecommendations.js (already implemented)
const mlRecommendations = require("./services/mlRecommendations");

// Get personalized recommendations
const recommendations = await mlRecommendations.getRecommendations(driverId, {
  limit: 20,
  minScore: 70,
  includeHazmat: false,
});
```

#### API Usage

```bash
# Get recommendations for driver
curl -X GET http://localhost:4000/api/ml/recommendations?limit=20 \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Response includes:
# - mlScore (0-100)
# - predictedEarnings
# - acceptanceProbability (%)
# - reason (human-readable explanation)
```

#### Frontend Integration (React)

```typescript
import { useEffect, useState } from 'react';

export function LoadRecommendations() {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetch('/api/loads')
      .then(r => r.json())
      .then(data => setRecommendations(data.data.recommendations));
  }, []);

  return (
    <div>
      {recommendations.map(load => (
        <div key={load.id} className="load-card">
          <h3>{load.from} → {load.to}</h3>
          <p>Rate: ${load.rate}</p>
          <div className="ml-score">
            <span>ML Score: {load.mlScore}</span>
            <span>Likelihood: {load.acceptanceProbability}%</span>
          </div>
          <p className="reason">{load.reason}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Predictive Earnings

#### Backend Setup

```javascript
const predictiveEarnings = require("./services/predictiveEarnings");

// Get 30-day forecast
const forecast = await predictiveEarnings.forecastEarnings(driverId, {
  days: 30,
  includeConfidenceInterval: true,
});
```

#### API Usage

```bash
# Get earnings forecast
curl http://localhost:4000/api/ml/earnings/forecast?days=30 \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Response includes:
# - trend (up/down/stable)
# - summary.average, min, max, totalForecast
# - data array with daily predictions + confidence intervals
```

#### Frontend Chart (using Recharts)

```typescript
import { LineChart, Line, XAxis, YAxis } from 'recharts';

export function EarningsForecast({ forecast }) {
  return (
    <LineChart data={forecast.data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Line type="monotone" dataKey="predicted" />
      <Line
        type="monotone"
        dataKey="upper"
        stroke="#90EE90"
        strokeDasharray="5 5"
      />
      <Line
        type="monotone"
        dataKey="lower"
        stroke="#FFB6C6"
        strokeDasharray="5 5"
      />
    </LineChart>
  );
}
```

### 3. Geofencing & Location

#### Mobile Setup (React Native)

```typescript
import { offlineSyncService } from "./services/offlineSyncService";
import { geofencingService } from "./services/geofencingService";

// Initialize offline database
await offlineSyncService.initializeDatabase();

// Create geofence for pickup location
await geofencingService.createGeofence(driverId, {
  name: "Pickup Location",
  latitude: 39.7392,
  longitude: -104.9903,
  radiusMeters: 500,
  type: "pickup",
  loadId: "load-123",
  alertOnEnter: true,
});

// Start location monitoring
const subscription = Location.watchPositionAsync(
  { accuracy: Location.Accuracy.High, distanceInterval: 100 },
  (location) => {
    geofencingService.updateLocation(driverId, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    });
  },
);
```

#### API Usage

```bash
# Update driver location
curl -X POST http://localhost:4000/api/geofencing/location \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"latitude": 39.7392, "longitude": -104.9903}'

# Get nearby loads
curl http://localhost:4000/api/geofencing/nearby-loads?radius=50000 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 4. Offline Mode & Sync

#### Mobile Implementation

```typescript
import { offlineSyncService } from "./services/offlineSyncService";

// 1. Initialize
await offlineSyncService.initializeDatabase();

// 2. Cache loads for offline access
await offlineSyncService.cacheLoads(loads);

// 3. Queue actions while offline
const actionId = await offlineSyncService.queueAction("bid_on_load", {
  loadId: "load-123",
  amount: 2500,
});

// 4. Start background sync
offlineSyncService.startBackgroundSync(30000); // Check every 30s

// 5. Get cached data while offline
const offlineLoads = await offlineSyncService.getCachedLoads();

// 6. Check sync status
const stats = await offlineSyncService.getCacheStats();
console.log(`Pending sync: ${stats.pendingActions} actions`);
```

#### UI Indicators

```typescript
function OfflineModeIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const subscription = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => subscription();
  }, []);

  return !isOnline ? (
    <View className="offline-banner">
      <Icon name="wifi-off" />
      <Text>Offline Mode - Changes will sync when online</Text>
    </View>
  ) : null;
}
```

### 5. Biometric Authentication

#### Mobile Setup

```typescript
import { biometricAuthService } from "./services/biometricAuthService";

// 1. Check if biometric available
const available = await biometricAuthService.checkBiometricAvailability();
// { available: true, types: ['Fingerprint', 'Face'] }

// 2. Setup biometric (one-time)
await biometricAuthService.setupBiometric(userId, password);

// 3. Setup PIN fallback
await biometricAuthService.setupPIN(userId, "1234");

// 4. Multi-factor authentication
const result = await biometricAuthService.authenticateMultiFactor(userId);
// Tries biometric first, falls back to PIN
```

#### Login Flow

```typescript
export function BiometricLogin() {
  const [showPinInput, setShowPinInput] = useState(false);

  async function handleLogin() {
    const result = await biometricAuthService.authenticateMultiFactor(userId);

    if (result.success) {
      // Biometric successful
      navigation.navigate('Home');
    } else if (result.factor === 'pin_required') {
      // Show PIN input
      setShowPinInput(true);
    }
  }

  async function handlePinSubmit(pin) {
    const result = await biometricAuthService.verifyPIN(userId, pin);
    if (result.success) {
      navigation.navigate('Home');
    } else {
      Alert.alert('PIN Error', result.message);
    }
  }

  return showPinInput ? (
    <PinInput onSubmit={handlePinSubmit} />
  ) : (
    <TouchableOpacity onPress={handleLogin}>
      <Text>Login with Fingerprint/Face</Text>
    </TouchableOpacity>
  );
}
```

### 6. Voice Search

#### Mobile Setup

```typescript
import { voiceSearchService } from "./services/voiceSearchService";

// 1. Initialize
await voiceSearchService.initializeVoiceRecognition();

// 2. Start listening
await voiceSearchService.startListening();

// 3. Speech automatically captured via onSpeechResults
// Transcript example: "Find me loads to Phoenix"

// 4. Parse command
const parsed = await voiceSearchService.parseVoiceCommand(transcript);
// { type: 'load_search', cities: ['Phoenix, AZ'], confidence: 0.92 }

// 5. Execute search
const results = await searchLoads(parsed);

// 6. Speak response
await voiceSearchService.speakSearchResult(results);
```

#### Voice Button Integration

```typescript
export function VoiceSearchButton() {
  const [isListening, setIsListening] = useState(false);

  async function toggleVoiceSearch() {
    if (isListening) {
      await voiceSearchService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      await voiceSearchService.startListening();
    }
  }

  return (
    <TouchableOpacity
      onPress={toggleVoiceSearch}
      style={{ opacity: isListening ? 1 : 0.6 }}
    >
      <Icon name={isListening ? "mic-on" : "mic"} size={24} />
    </TouchableOpacity>
  );
}
```

### 7. B2B Shipper API

#### Setup (Shipper Account)

```bash
# 1. Shipper registers (admin creates account)
POST /api/b2b/shipper
{
  "companyName": "ABC Logistics",
  "email": "shipper@abc.com",
  "tier": "pro"
}
# Response includes: shipperId, apiKey, rateLimit

# 2. Store API key for future requests
```

#### Usage (Shipper Backend)

```javascript
const shipperId = "shipper-uuid";
const apiKey = "your-api-key";

// Post a load
async function postLoad(loadData) {
  const response = await fetch(
    "https://api.infamousfreight.com/api/b2b/loads",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pickupCity: "Denver, CO",
        dropoffCity: "Phoenix, AZ",
        pickupDate: "2026-02-28T08:00:00Z",
        weight: 45000,
        rate: 2500,
      }),
    },
  );

  const load = await response.json();
  return load.data.id; // Save load ID
}

// Track load status
async function trackLoad(loadId) {
  const response = await fetch(
    `https://api.infamousfreight.com/api/b2b/loads/${loadId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );

  const load = await response.json();
  console.log("Bids:", load.data.bids); // Track driver bids
}

// Create invoice
async function createInvoice(loadId, amount) {
  const response = await fetch(
    "https://api.infamousfreight.com/api/b2b/invoices",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ loadId, amount }),
    },
  );

  return await response.json();
}
```

### 8. Fintech Integration

#### Early Payment Request

```bash
# Get payment options
curl http://localhost:4000/api/fintech/early-pay/options?invoiceAmount=2500 \
  -H "Authorization: Bearer <DRIVER_JWT>"

# Response offers 3 options:
# - standard: 3.5% fee, 1 day funding
# - expedited: 4.5% fee, same-day
# - scheduled: 2.5% fee, 14 days

# Request early payment
curl -X POST http://localhost:4000/api/fintech/early-pay \
  -H "Authorization: Bearer <DRIVER_JWT>" \
  -d '{
    "invoiceId": "inv-123",
    "optionType": "standard"
  }'
```

#### Frontend UI

```typescript
export function EarlyPaymentOptions({ invoiceAmount }) {
  const [options, setOptions] = useState(null);

  useEffect(() => {
    fetch(`/api/fintech/early-pay/options?invoiceAmount=${invoiceAmount}`)
      .then(r => r.json())
      .then(data => setOptions(data.data));
  }, [invoiceAmount]);

  async function requestPayment(type) {
    await fetch('/api/fintech/early-pay', {
      method: 'POST',
      body: JSON.stringify({
        invoiceId: 'inv-123',
        optionType: type
      })
    });
  }

  return options ? (
    <View>
      <Text>Select Payment Option</Text>

      <Card onPress={() => requestPayment('standard')}>
        <Text>Standard: {options.standard.rate}% fee</Text>
        <Text>Net: ${options.standard.netAmount} (1 day)</Text>
      </Card>

      <Card onPress={() => requestPayment('expedited')}>
        <Text>Expedited: {options.expedited.rate}% fee</Text>
        <Text>Net: ${options.expedited.netAmount} (Same day)</Text>
      </Card>

      <Card onPress={() => requestPayment('scheduled')}>
        <Text>Scheduled: {options.scheduled.rate}% fee</Text>
        <Text>Net: ${options.scheduled.netAmount} (14 days)</Text>
      </Card>
    </View>
  ) : <ActivityIndicator />;
}
```

#### Fuel Card Enrollment

```typescript
function FuelCardPrograms() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    fetch('/api/fintech/fuel-cards')
      .then(r => r.json())
      .then(data => setCards(data.data.options));
  }, []);

  async function enrollCard(provider) {
    await fetch('/api/fintech/fuel-cards/enroll', {
      method: 'POST',
      body: JSON.stringify({ provider })
    });
  }

  return cards.map(card => (
    <Button key={card.name} onPress={() => enrollCard(card.name)}>
      {card.name} - Save {card.discountPercentage}%
    </Button>
  ));
}
```

## 📚 Environment Variables

Add to `.env` files:

```bash
# ML Configuration
ML_CACHE_TTL=300000          # 5 minutes (ms)
ML_MIN_CONFIDENCE=0.7        # Minimum confidence score

# Geofencing
GEOFENCE_ALERT_DEBOUNCE=60000   # 60 seconds

# Fintech
FINTECH_WEBHOOK_TIMEOUT=5000
FINTECH_FUNDING_DAYS=1
EARLY_PAY_MIN_AMOUNT=500
EARLY_PAY_MAX_AMOUNT=25000

# B2B API
B2B_RATE_LIMIT=100
B2B_DEFAULT_TIER=pro
```

## 🧪 Testing Checklist

- [ ] ML recommendations return valid scores (70-100)
- [ ] Earnings forecast confidence intervals are bounded
- [ ] Geofence alerts trigger only on boundary crossing
- [ ] Offline sync queues persist across app restart
- [ ] Biometric lockout after 5 failures
- [ ] Voice search handles "find me loads to [city]"
- [ ] B2B tier limits enforce correctly
- [ ] Early payment factor rates adjust by rating
- [ ] Fuel card discounts apply correctly
- [ ] Webhooks deliver with HMAC signature

## 🔗 Related Documentation

- `PHASE_3_IMPLEMENTATION_PLAN.md` - Complete technical reference
- `PHASE_2_COMPLETION_REPORT.md` - Phase 2 features
- API Documentation: `/api/docs` (Swagger)

---

_Phase 3 Quick Start Guide - Infamous Freight_
