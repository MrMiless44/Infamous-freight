# PHASE 3 QUICK REFERENCE - ML, Geofencing & Notifications

**Document Type:** Quick Reference Guide  
**Last Updated:** 2026-02-15  
**Status:** Production Ready

---

## 🚀 QUICK START

### For Developers Integrating Phase 3

#### 1. ML Endpoints (Only 5 Main Routes)

```bash
# Get recommendations for driver
curl -X GET https://api.infamous-freight.com/api/ml/recommendations \
  -H "Authorization: Bearer {driver_token}"

# Forecast earnings (30-day prediction)
curl -X GET https://api.infamous-freight.com/api/ml/earnings-forecast \
  -H "Authorization: Bearer {driver_token}"

# Suggest rate for specific load
curl -X GET https://api.infamous-freight.com/api/ml/rate-suggestion \
  -H "Authorization: Bearer {driver_token}" \
  -G --data-urlencode "shipmentId=550e8400-e29b-41d4-a716-446655440000" \
  --data-urlencode "miles=250"

# Get optimal pricing for shipper (SHIPPER ONLY)
curl -X GET https://api.infamous-freight.com/api/ml/shipper-rate-optimization \
  -H "Authorization: Bearer {shipper_token}" \
  -G --data-urlencode "shipmentId=550e8400-e29b-41d4-a716-446655440000"

# Market insights
curl -X GET https://api.infamous-freight.com/api/ml/insights \
  -H "Authorization: Bearer {driver_token}"
```

#### 2. Geofencing Flow

```javascript
// Step 1: Register shipment geofences (when driver accepts load)
POST /api/geofencing/register-shipment
{
  "shipmentId": "uuid",
  "pickupLat": 39.7392,
  "pickupLng": -104.9903,
  "pickupAddress": "123 Main St, Denver, CO"
  // ... 8 more fields for dropoff
}

// Step 2: Start sending location updates (from mobile app)
POST /api/geofencing/location-update
{ "latitude": 39.7392, "longitude": -104.9903 }
// Returns: [] if no alerts, or [{type: "arrival", message: "..."}]

// Step 3: Get geofences for map (mobile app rendering)
GET /api/geofencing/driver-geofences
// Returns: {geofences: [{id, type, location, radius, alertRadius}]}

// Step 4: Nearby POI discovery
GET /api/geofencing/nearby-poi?latitude=39.74&longitude=-104.99&type=fuel&radiusMiles=5
```

#### 3. Push Notification Setup (Mobile App)

```javascript
// Step 1: Register device token (app startup)
POST /api/notifications/register-device
{
  "token": "fcm_token_from_firebase",
  "platform": "android|ios",
  "appVersion": "2.1.0"
}

// Step 2: Subscribe to topics
POST /api/notifications/subscribe-topic
{ "topic": "loads_available" }

// Step 3: Test notification
POST /api/notifications/test
// Returns: {success: true, devicesReached: 1}

// Step 4: Update preferences (optional)
PUT /api/notifications/preferences
{
  "notificationTopics": [
    { "topic": "loads_available", "enabled": true },
    { "topic": "promotions", "enabled": false }
  ],
  "quietHours": { "enabled": true, "startTime": "22:00", "endTime": "06:00" }
}
```

---

## 📊 ML ALGORITHM CHEAT SHEET

### Load Recommendation Scoring (0-100)

```
Base: 50 points
+ Equipment match (have dryer, get dry van load): +20
+ Rate alignment (load pays what you want): +0-15
+ Geography match (Denver to Phoenix = favorite): +0-15
+ Commodity match (refrigerated preference): +0-10
+ Fresh posting (< 1 hour old): +0-10
+ Collaborative signal (similar drivers accepted): +5
- Hazmat without cert: -10
━━━━━━
 Final: 0-100 (capped)
```

**Interpretation:**

- Score > 85: Highly recommended
- Score 70-85: Good fit
- Score 50-70: OK fit
- Score < 50: Skip this one

### Earnings Forecast Model

**Formula:**

```
Predicted Daily Earnings = (Trend Component × Day) × Seasonal Factor × Market Growth

Where:
  Trend = Linear regression of historical earnings
  Seasonal = Day-of-week adjustment (Mon-Fri +10%, Sat +5%, Sun -10%)
  Market = 1.05 (expected 5% growth)
  Confidence = 0.85 - (Days ahead × 0.01)
```

**Example Interpretation:**

```json
{
  "predictedEarnings": 1650,
  "confidence": 0.82,
  "trend": "up"
}
→ Can expect ~$1650 with 82% confidence, earnings trending up
```

### Rate Suggestion Model

**Formula:**

```
Optimal Rate = Base Rate × Demand × Scarcity × Urgency

Base Rate = $1.50/mile × miles
Demand: 0.85–1.3x (based on loads_per_driver ratio)
Scarcity: 0.95–1.2x (fewer drivers = higher rate)
Urgency: 0.95–1.2x (rush loads get premium)

Range = [Suggested × 0.95, Suggested × 1.15]
```

**Example:**

```
Load: 200 miles
Base: 1.50 × 200 = $300

Market conditions: High demand
  Demand multiplier: 1.2x
  Scarcity multiplier: 1.05x
  Urgency (pickup in 8 hrs): 1.1x

Optimal rate: $300 × 1.2 × 1.05 × 1.1 = $415.80
Recommended: $415.80 (±$20 range)
```

### Surge Pricing

**Formula:**

```
Surge Rate = Baseline Rate × Surge Factor (0.5x–2.5x)

Surge Factor = Time Multiplier × Day Multiplier × Supply × Availability

Time: Night shift (0.9x) vs daytime (1.0x)
Day: Weekday (1.1x) vs weekend (0.95x)
Supply: Loads_per_driver ratio (1.15–1.3x if high)
Availability: Fewer drivers = higher multiplier
```

**Interpretation:**

- Surge 1.0x = Normal pricing
- Surge 1.5x = 50% premium (very high demand)
- Surge 0.7x = 30% discount (low demand)

---

## 📍 GEOFENCING REFERENCE

### Distance Reference (Testing & QA)

```
10 meters   = inside facility
100 meters  = ~300 feet (2-3 city blocks)
300 meters  = ~1000 feet (alert zone)
1 km        = ~0.6 miles
5 miles     = typical POI search radius
```

### Alert Types

| Alert Type      | Trigger                | Action                         |
| --------------- | ---------------------- | ------------------------------ |
| **entry**       | Inside geofence radius | Notify driver "You've arrived" |
| **exit**        | Left geofence radius   | Notify shipper "Driver left"   |
| **proximity**   | Within alert radius    | "Getting close" guidance       |
| **approaching** | 200m away              | Turn on navigation             |
| **alert**       | 300m away              | "Prepare for X"                |

### Geofence Types

```javascript
{
  "PICKUP": 100m radius + 300m alert zone
  "DROPOFF": 100m radius + 300m alert zone
  "REST_AREA": 150m radius
  "FUEL_STATION": 150m radius
  "WEIGH_STATION": 150m radius
  "TOLL_BOOTH": 100m radius
  "SHIPPER_FACILITY": Custom radius
}
```

### ETA Calculation

```
ETA (minutes) = (Distance in miles / Average Speed in mph) × 60

Examples:
  100 miles, 60 mph avg → 100 minutes (1.67 hours)
  50 miles, 70 mph avg → 42.8 minutes
```

---

## 🔔 PUSH NOTIFICATION TEMPLATES

### Available Templates (9 Total)

| Template              | Used For              | Icon | Priority |
| --------------------- | --------------------- | ---- | -------- |
| `loadAvailable`       | New load posted       | ✨   | HIGH     |
| `loadExpiring`        | Load about to expire  | ⏰   | HIGH     |
| `geofenceAlert`       | Arrival alerts        | 📍   | HIGH     |
| `paymentReceived`     | Payment notification  | 💰   | NORMAL   |
| `maintenanceReminder` | Vehicle maintenance   | 🔧   | NORMAL   |
| `docExpiring`         | License/cert expiring | 📄   | HIGH     |
| `promoBanner`         | Promotional offers    | 🎉   | NORMAL   |
| `urgentAlert`         | Critical alerts       | 🚨   | HIGH     |
| `leaderboardUpdate`   | Ranking changes       | 🏆   | NORMAL   |

### Variable Usage

```javascript
// Template example
"loadAvailable": "✨ New Load Available! {pickup} → {dropoff} ({miles} miles)"

// Usage
{
  "templateType": "loadAvailable",
  "data": {
    "pickup": "Denver, CO",
    "dropoff": "Phoenix, AZ",
    "miles": "600"
  }
}
// Result: "✨ New Load Available! Denver, CO → Phoenix, AZ (600 miles)"
```

### Topics (for batch sending)

```javascript
"loads_available"; // New load alerts
"price_alerts"; // Surge pricing & rate opportunities
"promotions"; // Bonuses, referrals, seasonal offers
"maintenance"; // Maintenance due, inspections
"compliance"; // Safety alerts, documentation needed
"earnings"; // Daily/weekly summaries
```

### Quiet Hours Example

```javascript
{
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",    // 10 PM
    "endTime": "06:00",      // 6 AM
    "exceptionTypes": ["urgentAlert"]  // These bypass quiet hours
  }
}
// Result: No notifications 10 PM - 6 AM except urgent alerts
```

---

## 🔐 AUTHENTICATION & SCOPE MAPPING

### Required Scopes by Endpoint

```
ML Service:
  /ml/recommendations              → "driver"
  /ml/earnings-forecast            → "driver"
  /ml/rate-suggestion              → "driver"
  /ml/shipper-rate-optimization    → "shipper"
  /ml/corridor-trends              → "driver" or "shipper"
  /ml/surge-pricing                → "driver" or "shipper"
  /ml/train                        → "admin"
  /ml/insights                     → "driver" or "shipper"

Geofencing:
  /geofencing/register-shipment    → "driver"
  /geofencing/location-update      → "driver"
  /geofencing/driver-geofences     → "driver"
  /geofencing/optimized-route      → "driver"
  /geofencing/nearby-poi           → "driver"
  /geofencing/compliance-report    → "driver" or "admin"
  /geofencing/create-area          → "admin"
  /geofencing/stats                → "admin"

Notifications:
  /notifications/register-device   → authenticated
  /notifications/test              → authenticated
  /notifications/history           → authenticated
  /notifications/subscribe-topic   → authenticated
  /notifications/suppress          → authenticated
  /notifications/preferences       → authenticated
  /notifications/send-batch        → "admin" or "marketing"
  /notifications/track-delivery    → none (webhook)
```

---

## ⚡ PERFORMANCE & RATE LIMITS

### Rate Limits Per Endpoint

```
ML Service:
  /ml/recommendations           100 req/15 min (general limiter)
  /ml/earnings-forecast         100 req/15 min
  /ml/rate-suggestion            20 req/1 min (premium feature)
  /ml/corridor-trends           100 req/15 min
  /ml/shipper-rate-optimization 100 req/15 min
  /ml/surge-pricing             100 req/15 min
  /ml/train                       5 req/1 hour (manual operation)
  /ml/insights                  100 req/15 min

Geofencing:
  /geofencing/location-update   600 req/15 min (high frequency for driving)
  (Other geofencing endpoints)  100 req/15 min

Notifications:
  Device registration           100 req/15 min
  Test notification             100 req/15 min
  Batch send                     30 req/15 min (billing limiter)
  Preferences                   100 req/15 min
```

### Expected Response Times

```
ML endpoints:         < 200ms (with 5-min cache)
Geofencing:           < 150ms (distance calculations fast)
Notifications:        < 100ms (async queueing)
Large queries:        < 500ms (p95)
```

---

## 📁 FILE STRUCTURE

```javascript
apps/api/src/
├── services/
│   ├── mlRecommendationService.js       // Load scoring, earnings forecast
│   ├── pricingOptimizationService.js    // Dynamic pricing algorithms
│   ├── geofencingService.js             // Location tracking
│   └── pushNotificationService.js       // FCM/APNs handling
├── routes/
│   ├── ml.routes.js                     // ML endpoints
│   ├── geofencing.routes.js             // Geofencing endpoints
│   └── notifications.routes.js          // Notification endpoints
└── server.js                            // Route registration (updated)
```

---

## 🐛 TROUBLESHOOTING

### Issue: ML recommendations all score same

**Cause:** Driver profile not fully populated **Fix:**

```javascript
// Ensure driver has:
driverProfile.acceptanceRate; // 0-1
driverProfile.rating; // 0-5
driverProfile.equipmentTypes; // ["Dry Van", ...]
driverProfile.favoriteCorridors; // ["Denver→Phoenix", ...]
```

### Issue: Geofence alerts not firing

**Cause:** Location updates not being sent OR alert already fired 5 min ago
**Fix:**

```javascript
// Check mobile app is sending location updates:
POST /api/geofencing/location-update { lat, lng }

// Check throttling (5 min per alert type):
// Can retry same alert after 5 minutes
```

### Issue: Push notifications not arriving Android

**Cause:** Invalid FCM token format OR Firebase not configured **Fix:**

```bash
# Verify FCM token length (minimum 50 chars)
echo "${FCM_TOKEN}" | wc -c

# Check Firebase Admin SDK key in environment
echo "${FIREBASE_ADMIN_KEY}" | jq .
```

### Issue: Permission denied on notification endpoints

**Cause:** Token missing scope or wrong user type **Fix:**

```javascript
// Check JWT token claims:
const payload = jwt_decode(token);
console.log(payload.scopes); // Should include "driver", "shipper", or "admin"
```

---

## 💡 COMMON USE CASES

### Use Case 1: Driver Gets New Load Notification

```
1. Shipper posts load via /api/loads/post
2. System triggers notification via topic "loads_available"
3. Push service finds all subscribed drivers
4. Filters by geofence (near pickup?)
5. FCM sends platform-specific message
6. Mobile app displays notification + plays sound
7. Driver taps → opens load details
```

### Use Case 2: Driver Navigating to Pickup

```
1. Driver accepts load
2. System calls /api/geofencing/register-shipment
   → Creates pickup/dropoff geofences
3. Mobile app enters/exits navigation mode
4. Location updates sent every 30-60 seconds
   POST /api/geofencing/location-update
5. When < 300m away → alert "Getting close"
6. When < 100m away → alert "You've arrived"
7. When exactly at pickup → "Confirm arrival"
8. Driver confirms → geofence entry logged
```

### Use Case 3: Shipper Optimizing Load Pricing

```
1. Shipper enters load details
2. System analyzes market via /api/ml/shipper-rate-optimization
3. Response shows:
   - Recommended rate: $1,200
   - Range: $1,050-$1,380
   - Predicted conversions:
     * At $1,050: 95% conversion (get bids)
     * At $1,200: 75% conversion (optimal revenue)
     * At $1,380: 45% conversion (too high)
4. Shipper posts at $1,200 → gets 5-7 bids
```

---

## 📞 API INTEGRATION CHECKLIST

- [ ] Imported all 4 services in routes
- [ ] Registered 3 routes in server.js
- [ ] JWT tokens configured and working
- [ ] Scope values verified (driver/shipper/admin)
- [ ] Rate limiters applied and tested
- [ ] Test notifications working (POST /api/notifications/test)
- [ ] Database schema created (if using persistence)
- [ ] Logging configured (monitor /var/log/api.log)
- [ ] Error handling tested (try intentional failures)
- [ ] Performance tested under load
- [ ] Security audit passed
- [ ] Documentation updated

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-15  
**Status:** ✅ Production Ready
