# Rate Limiting Guide

**Version**: 2.2.0 | **Last Updated**: January 14, 2026

## Overview

Rate limiting protects the API from abuse and ensures fair resource allocation. This guide details the strategy, configuration, and monitoring.

## Rate Limit Tiers

### General API (100 req/15 min)

**Use Case**: Standard API requests
**Default**: 100 requests per 15 minutes

```env
RATE_LIMIT_GENERAL_WINDOW_MS=15
RATE_LIMIT_GENERAL_MAX=100
```

**Applied To**:

- GET shipments
- GET users
- POST comments

**Headers** (response):

```
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1705266000
```

---

### Authentication (5 req/15 min)

**Use Case**: Login, token refresh
**Default**: 5 requests per 15 minutes (strict)

```env
RATE_LIMIT_AUTH_WINDOW_MS=15
RATE_LIMIT_AUTH_MAX=5
```

**Applied To**:

- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh

**Security Note**: Keyed by IP, not user (prevents account enumeration)

**Response When Limited** (429):

```json
{
  "error": "Too many authentication attempts. Try again later."
}
```

---

### AI Service (20 req/1 min)

**Use Case**: AI command processing
**Default**: 20 requests per 1 minute

```env
RATE_LIMIT_AI_WINDOW_MS=1
RATE_LIMIT_AI_MAX=20
```

**Applied To**:

- POST /api/ai/command
- GET /api/ai/history

**Rationale**: Expensive operations, prevent token depletion

**Response When Limited** (429):

```json
{
  "error": "AI service rate limit exceeded."
}
```

---

### Billing (30 req/15 min)

**Use Case**: Payment operations
**Default**: 30 requests per 15 minutes

```env
RATE_LIMIT_BILLING_WINDOW_MS=15
RATE_LIMIT_BILLING_MAX=30
```

**Applied To**:

- POST /api/billing/create-payment-intent
- POST /api/billing/confirm-payment
- GET /api/billing/history

**Rationale**: Prevent duplicate charges, API quota limits

---

### Voice Processing (10 req/1 min)

**Use Case**: Audio upload and processing
**Default**: 10 requests per 1 minute

```env
RATE_LIMIT_VOICE_WINDOW_MS=1
RATE_LIMIT_VOICE_MAX=10
```

**Applied To**:

- POST /api/voice/ingest
- POST /api/voice/command

**Rationale**: Large file uploads, transcription limits

---

## Monitoring Rate Limits

### Logging

Rate limit violations are logged:

```json
{
  "method": "POST",
  "path": "/api/ai/command",
  "status": 429,
  "duration_ms": 5,
  "error": "RateLimitError",
  "user": "user-123",
  "remaining": 0,
  "resetTime": "2025-01-14T10:30:00Z"
}
```

### Metrics to Track

1. **Hit Rate** (% of requests hitting limit)

   ```bash
   grep "429" api/logs/*.log | wc -l
   ```

2. **User Patterns**

   ```bash
   grep "429" api/logs/*.log | jq -r '.user' | sort | uniq -c
   ```

3. **Endpoint Distribution**
   ```bash
   grep "429" api/logs/*.log | jq -r '.path' | sort | uniq -c
   ```

---

## Tuning Strategy

### Observe (Weeks 1-2)

1. **Baseline**: Monitor current usage patterns
2. **Log**: Track limit violations
3. **Identify**: Find problematic endpoints

### Analyze (Weeks 3-4)

1. **Review** violation patterns
2. **Segment** by user tier
3. **Calculate** optimal limits

### Adjust (Week 5+)

1. **Update** environment variables
2. **Deploy** changes
3. **Monitor** for 1-2 days
4. **Repeat** as needed

### Example Tuning Scenario

**Initial Setup**:

```env
RATE_LIMIT_AI_MAX=20  # 20 req/min
```

**After 2 Weeks**:

- 15% of power users hitting limit
- No abuse detected
- Decision: Increase to 30

**Adjustment**:

```env
RATE_LIMIT_AI_MAX=30  # Now 30 req/min
```

---

## Client Handling

### Recommended Pattern

```javascript
// Retry with exponential backoff
async function makeApiRequest(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const resetTime = response.headers.get("RateLimit-Reset");
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff

        console.warn(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}
```

### Response Headers

Always include rate limit info:

```
RateLimit-Limit: 100
RateLimit-Remaining: 45
RateLimit-Reset: 1705266000
```

**Client Usage**:

```javascript
const response = await fetch("/api/resource");
const remaining = response.headers.get("RateLimit-Remaining");

if (remaining < 10) {
  console.warn("Approaching rate limit");
}
```

---

## Exceptions & Bypass

### Health Checks (Always Exempt)

```javascript
skip: (req) => req.path === "/api/health" || req.path === "/api/health/live";
```

Ensures monitoring systems never get rate limited.

### Admin Bypass (Optional)

For emergency use:

```javascript
limiters.general = createLimiter({
  skip: (req) => req.user?.role === "admin",
  // ... other config
});
```

---

## Best Practices

1. **Use Idempotency Keys**: Prevent accidental duplicates

   ```javascript
   POST /api/billing/create-payment-intent
   {
     "amount": 100,
     "idempotencyKey": "charge-user123-1705265830000"
   }
   ```

2. **Cache When Possible**: Reduce API calls

   ```javascript
   const cached = await cache.get(key);
   if (cached) return cached;
   ```

3. **Batch Operations**: Combine multiple requests

   ```javascript
   POST /api/shipments/bulk
   {
     "ids": ["ship1", "ship2", "ship3"]
   }
   ```

4. **Implement Queuing**: For non-real-time operations

   ```javascript
   POST /api/reports/generate
   // Returns job ID, check status with polling
   GET /api/reports/job/:jobId
   ```

5. **Graduated Limits**: Different tiers for different users
   ```javascript
   keyGenerator: (req) => {
     return req.user?.plan === "premium"
       ? `premium-${req.user.sub}`
       : `standard-${req.ip}`;
   };
   ```

---

## Troubleshooting

### "Too Many Requests" Error

**Symptom**: Frequent 429 responses

**Investigation**:

```bash
# Check which endpoint
grep "429" logs/*.log | jq '.path' | sort | uniq -c

# Check which user
grep "429" logs/*.log | jq '.user' | sort | uniq -c

# Check time pattern
grep "429" logs/*.log | jq '.timestamp' | head -20
```

**Solutions**:

1. Increase limit for that endpoint
2. Implement client-side caching
3. Batch requests
4. Check for retry loops

### Uneven Distribution

**Symptom**: Some users hit limit, others don't

**Cause**: Keying strategy (IP vs User ID)

**Solution**: Review keyGenerator logic

```javascript
keyGenerator: (req) => req.user?.sub || req.ip;
```

---

## Configuration Reference

**File**: `.env.example`

```env
# Window (minutes)
RATE_LIMIT_GENERAL_WINDOW_MS=15
RATE_LIMIT_AUTH_WINDOW_MS=15
RATE_LIMIT_AI_WINDOW_MS=1
RATE_LIMIT_BILLING_WINDOW_MS=15
RATE_LIMIT_VOICE_WINDOW_MS=1

# Max requests
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_AI_MAX=20
RATE_LIMIT_BILLING_MAX=30
RATE_LIMIT_VOICE_MAX=10
```

---

## References

- [security.js](api/src/middleware/security.js) - Implementation
- [express-rate-limit](https://github.com/nfriedly/express-rate-limit) - Library docs
- [Rate Limiting Best Practices](https://tools.ietf.org/html/draft-polli-ratelimit-headers) - RFC Draft
