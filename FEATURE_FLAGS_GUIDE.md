# Feature Flags Guide

**Version**: 2.2.0 | **Last Updated**: January 14, 2026

## Overview

Feature flags enable safe rollouts, A/B testing, and quick kill-switches without redeployment.

## Implemented Flags

### Backend Features

#### ENABLE_AI_COMMANDS

- **Endpoint**: POST `/api/ai/command`
- **Default**: `true`
- **Use Case**: Enable/disable AI inference
- **Impact**: High (core feature)

```env
ENABLE_AI_COMMANDS=true
```

**Implementation**:

```javascript
if (process.env.ENABLE_AI_COMMANDS === "false") {
  return res.status(503).json({
    ok: false,
    error: "AI commands are currently disabled",
  });
}
```

---

#### ENABLE_VOICE_PROCESSING

- **Endpoint**: POST `/api/voice/ingest`
- **Default**: `true`
- **Use Case**: Enable/disable voice uploads
- **Impact**: High

```env
ENABLE_VOICE_PROCESSING=true
```

---

#### ENABLE_NEW_BILLING

- **Endpoint**: `/api/billing/*`
- **Default**: `true`
- **Use Case**: Switch between old/new billing system
- **Impact**: Critical (revenue feature)

```env
ENABLE_NEW_BILLING=true
```

---

### Frontend Features (Next.js)

#### VITE_ENABLE_ANALYTICS

- **Default**: `true`
- **Use Case**: Track user behavior
- **Impact**: Medium

```env
VITE_ENABLE_ANALYTICS=true
```

**Implementation**:

```typescript
if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true") {
  // Initialize analytics tracker
}
```

---

#### VITE_ENABLE_ERROR_TRACKING

- **Default**: `true`
- **Use Case**: Send errors to Sentry
- **Impact**: High

```env
VITE_ENABLE_ERROR_TRACKING=true
```

---

#### VITE_ENABLE_PERFORMANCE_MONITORING

- **Default**: `true`
- **Use Case**: Track Web Vitals
- **Impact**: Medium

```env
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

---

#### VITE_ENABLE_A_B_TESTING

- **Default**: `false`
- **Use Case**: Experimental features
- **Impact**: Low (opt-in)

```env
VITE_ENABLE_A_B_TESTING=false
```

---

## Usage Patterns

### Pattern 1: Quick Kill-Switch

**Scenario**: Bug discovered in production

**Steps**:

1. **Disable**: Set `ENABLE_AI_COMMANDS=false` in GitHub Secrets
2. **Deploy**: Redeploy with updated env
3. **Verify**: Confirm feature is disabled
4. **Fix**: Fix the underlying bug
5. **Re-enable**: Set back to `true`

```bash
# Timeline
10:00 - Bug discovered
10:05 - Disable flag (users get 503)
10:10 - Deploy updated code
10:15 - Feature enabled after fix
```

---

### Pattern 2: Gradual Rollout

**Scenario**: Testing new billing system

**Week 1**: 10% of users

```env
ENABLE_NEW_BILLING_SAMPLE_RATE=0.1
```

**Week 2**: 50% of users

```env
ENABLE_NEW_BILLING_SAMPLE_RATE=0.5
```

**Week 3**: 100% (full rollout)

```env
ENABLE_NEW_BILLING_SAMPLE_RATE=1.0
```

**Implementation**:

```javascript
// Sample users randomly
const sample = Math.random();
const useNewBilling =
  sample < (parseFloat(process.env.ENABLE_NEW_BILLING_SAMPLE_RATE) || 1.0);

if (useNewBilling) {
  // Use new system
} else {
  // Use old system
}
```

---

### Pattern 3: User Tier Targeting

**Scenario**: Premium features only for paid users

```javascript
const isPremium = req.user?.plan === "premium";
const enableFeature =
  isPremium && process.env.ENABLE_ADVANCED_ANALYTICS === "true";
```

---

### Pattern 4: A/B Testing

**Scenario**: Test UI changes

```env
VITE_ENABLE_A_B_TESTING=true
VITE_AB_TEST_UI_VARIANT=cohort_b  # or cohort_a
```

**Implementation**:

```typescript
export const useABTest = () => {
  const variant = process.env.NEXT_PUBLIC_AB_TEST_UI_VARIANT;
  return {
    isCohortA: variant === "cohort_a",
    isCohortB: variant === "cohort_b",
  };
};
```

---

## Configuration

### Environment Variables

**Development**:

```env
ENABLE_AI_COMMANDS=true
ENABLE_VOICE_PROCESSING=true
ENABLE_NEW_BILLING=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_A_B_TESTING=false
```

**Production**:

```env
ENABLE_AI_COMMANDS=true           # Stable feature
ENABLE_VOICE_PROCESSING=true      # Stable feature
ENABLE_NEW_BILLING=true           # Monitor closely
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_A_B_TESTING=false
```

---

## Monitoring

### Checking Flag Status

**Backend**:

```bash
# Check current flag values
curl -s http://localhost:4000/api/health/detailed | \
  jq '.features'
```

**Frontend** (console):

```javascript
console.log({
  analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  errorTracking: process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING,
  abTesting: process.env.NEXT_PUBLIC_ENABLE_A_B_TESTING,
});
```

### Log Disabled Features

```javascript
if (process.env.ENABLE_AI_COMMANDS === "false") {
  logger.warn("Feature disabled: AI commands");
}
```

---

## Best Practices

### 1. Always Have Safe Default

```javascript
// ✅ GOOD: Safe default (feature on)
const enabled = process.env.ENABLE_FEATURE !== "false";

// ❌ BAD: Unsafe default (feature off)
const enabled = process.env.ENABLE_FEATURE === "true";
```

### 2. Log When Disabled

```javascript
if (process.env.ENABLE_AI_COMMANDS === "false") {
  logger.warn("Feature disabled by flag", {
    feature: "ai:command",
    timestamp: new Date().toISOString(),
  });
  return res.status(503).json({ error: "Service temporarily unavailable" });
}
```

### 3. Version Flags

```env
# Include version info for tracking
ENABLE_AI_COMMANDS=true  # v2.0+
ENABLE_VOICE_PROCESSING=true  # v1.5+
```

### 4. Document Impact

```javascript
/**
 * Feature Flag: ENABLE_AI_COMMANDS
 * - Backend: POST /api/ai/command disabled when false
 * - Impact: AI inference feature unavailable
 * - Rollback: Change flag to 'false', deploy
 */
if (process.env.ENABLE_AI_COMMANDS === "false") {
  // ...
}
```

### 5. Cleanup Old Flags

Once a feature is stable (>1 month), remove the flag:

```javascript
// ❌ REMOVE: This feature is now standard
if (process.env.ENABLE_OLD_FEATURE === "false") {
  // This code is dead
}

// ✅ DELETE: Feature is stable, no longer optional
// Commit: Remove deprecated feature flag
```

---

## Deployment Strategy

### 1. Feature Development

```bash
# Create feature flag PR
git checkout -b feature/new-billing-system

# Add flag check
ENABLE_NEW_BILLING=false  # Start disabled
```

### 2. Staging Testing

```env
# In staging env
ENABLE_NEW_BILLING=true  # Test with flag on
```

### 3. Production Rollout

```bash
# Week 1: Monitor
ENABLE_NEW_BILLING=false  # Start disabled

# Week 2: 10% users
ENABLE_NEW_BILLING_SAMPLE_RATE=0.1

# Week 3: 50% users
ENABLE_NEW_BILLING_SAMPLE_RATE=0.5

# Week 4: 100% users
ENABLE_NEW_BILLING=true  # Stable, can remove flag
```

---

## Flag Matrix

| Flag                       | Status     | Default | Tier     | Rollback |
| -------------------------- | ---------- | ------- | -------- | -------- |
| ENABLE_AI_COMMANDS         | Stable     | true    | High     | 5 min    |
| ENABLE_VOICE_PROCESSING    | Stable     | true    | High     | 5 min    |
| ENABLE_NEW_BILLING         | Monitoring | true    | Critical | 10 min   |
| VITE_ENABLE_ANALYTICS      | Stable     | true    | Medium   | 5 min    |
| VITE_ENABLE_ERROR_TRACKING | Stable     | true    | High     | 5 min    |
| VITE_ENABLE_A_B_TESTING    | Opt-in     | false   | Low      | N/A      |

---

## Troubleshooting

### Flag Not Taking Effect

**Check 1**: Environment variable set?

```bash
echo $ENABLE_AI_COMMANDS
```

**Check 2**: Process restarted?

```bash
# Container restarts load new env
docker-compose restart api
```

**Check 3**: Code redeployed?

```bash
# Feature flag check must be in deployed code
git log --oneline | head -5
```

### Users See Wrong Behavior

**Check 1**: Caching issue?

```bash
# Clear CDN cache
cloudflare-cli cache-purge
```

**Check 2**: Session stickiness?

```
# Multiple servers? Ensure consistent env across all
```

### Gradual Rollout Not Working

**Implementation Issue**: Sample rate not stored

```javascript
// ❌ Wrong: Sample on each request
if (Math.random() < sampleRate) {
}

// ✅ Correct: Sample per user, consistent
const isSelectedUser = hashFunction(userId) % 100 < sampleRate;
```

---

## References

- [Enable Feature Flags](https://martinfowler.com/articles/feature-toggles.html)
- [Release Toggles](https://martinfowler.com/articles/feature-toggles.html#ReleaseToggles)
- [Rollout Strategy](https://en.wikipedia.org/wiki/Feature_toggle#Rollout_strategy)
