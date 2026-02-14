<!-- Datadog RUM Integration Guide -->

# Datadog Real User Monitoring (RUM) Integration

**File**: `apps/web/lib/datadog-rum.ts` (created)  
**Integration Point**: `apps/web/pages/_app.tsx` (needs integration)  
**Status**: Ready for deployment

---

## Setup Instructions

### 1. **Install Datadog RUM Package**

```bash
cd apps/web
pnpm add @datadog/browser-rum @datadog/browser-logs
```

### 2. **Set Environment Variables**

In `.env.local` (development) and CI/CD secrets (production):

```bash
# Datadog Configuration
NEXT_PUBLIC_DD_APP_ID=your_datadog_app_id_here
NEXT_PUBLIC_DD_CLIENT_TOKEN=your_datadog_client_token_here
NEXT_PUBLIC_DD_SITE=datadoghq.com              # or datadoghq.eu for EU
NEXT_PUBLIC_ENV=production                     # development, staging, production
NEXT_PUBLIC_SERVICE=infamous-freight-web      # Service name in Datadog

# Sampling rates (adjust based on traffic)
NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE=100         # Capture 100% of sessions
NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE=20   # Record 20% for replay
```

### 3. **Integrate into Next.js App**

In `apps/web/pages/_app.tsx`:

```typescript
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { initializeDatadogRum, useDatadogRouteTracking } from '../lib/datadog-rum';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Initialize Datadog RUM (once on mount)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENV === 'production') {
      initializeDatadogRum({
        applicationId: process.env.NEXT_PUBLIC_DD_APP_ID!,
        clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
        site: process.env.NEXT_PUBLIC_DD_SITE || 'datadoghq.com',
        service: process.env.NEXT_PUBLIC_SERVICE || 'web',
        env: process.env.NEXT_PUBLIC_ENV || 'development',
        sessionSampleRate: parseInt(process.env.NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE || '100'),
        sessionReplaySampleRate: parseInt(process.env.NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE || '20'),
      });
    }
  }, []);

  // Track route changes
  useDatadogRouteTracking(router.pathname);

  return <Component {...pageProps} />;
}

export default MyApp;
```

### 4. **Track User Context**

In user login handler:

```typescript
import { setDatadogUserContext } from '../lib/datadog-rum';

// After successful login
setDatadogUserContext({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.organization?.plan,
});
```

### 5. **Track Custom Events**

Throughout your application:

```typescript
import { trackDatadogAction, trackDatadogError } from '../lib/datadog-rum';

// Track action
trackDatadogAction('shipment_created', {
  shipmentId: shipment.id,
  status: shipment.status,
  origin: shipment.origin,
});

// Track error
trackDatadogError('API Error', {
  statusCode: error.response?.status,
  message: error.message,
  endpoint: error.config?.url,
});
```

---

## Monitoring Dashboards

### **1. Overview Dashboard**

Create in Datadog:

```
Title: Infamous Freight - Web App Performance
Widgets:
- Page Load Time (LCP) - target < 2.5s
- First Input Delay (FID) - target < 100ms
- Cumulative Layout Shift (CLS) - target < 0.1
- Error Rate - target < 1%
- Session Replay playback (sample)
```

### **2. Real User Metrics**

```
Query: @_dd.rum
Select:
- session {
    id
    metric.session_length
    metric.session_active_session_count
  }
- view {
    id
    metric.view_interaction_count
    metric.view_long_task_count
  }
- error {
    count
    status
    message
  }
```

### **3. Route Performance**

```
Query: @_dd.rum.view.name
Group by: path
Measure: duration
Alert: If P95 duration > 3s
```

---

## What Gets Tracked

### **Automatically Captured**
- ✅ Page views and navigation
- ✅ Web Vitals (LCP, FID, CLS)
- ✅ JavaScript errors with stack traces
- ✅ User interactions (clicks, inputs)
- ✅ Resource timings (API calls, images, CSS)
- ✅ Network requests (fetch, XHR)
- ✅ Session replays (20% of sessions)

### **Performance Monitoring**
```javascript
{
  "view": {
    "first_contentful_paint": 1200,  // ms
    "largest_contentful_paint": 1800,
    "cumulative_layout_shift": 0.05,
    "first_input_delay": 45,
    "interaction_to_next_paint": 120,
    "time_to_interactive": 2100
  },
  "resource": {
    "type": "XHR",
    "method": "GET",
    "status_code": 200,
    "duration": 245  // ms
  }
}
```

### **Error Tracking**
```javascript
{
  "error": {
    "type": "JavaScript Error",
    "message": "Cannot read property 'id' of undefined",
    "stack": "at ShipmentCard (shipment.tsx:42)",
    "source": "source"
  }
}
```

---

## Best Practices

### **1. Identify Sensitive Data**

By default, RUM masks user input and sensitive fields:

```typescript
// Automatically masked:
- password fields
- credit card numbers
- SSN/government IDs
- authentication tokens
```

To mask additional fields:

```typescript
datadogRum.init({
  ...,
  defaultPrivacyLevel: 'mask-user-input', // Mask all user input
  // Or custom patterns:
  allowedTracingUrls: [/api\.infamous-freight\.com/],
});
```

### **2. Control Session Replay**

```typescript
// Stop recording for sensitive pages
datadogRum.stopSessionReplay();

// Resume after sensitive operation
datadogRum.startSessionReplay();
```

### **3. Sample Appropriately**

```typescript
// Adjust based on traffic
const sessionSampleRate = process.env.NODE_ENV === 'production' ? 50 : 100;
const replaySampleRate = process.env.NODE_ENV === 'production' ? 10 : 50;
```

---

## Verification Checklist

```
□ Environment variables configured
□ RUM initialized in _app.tsx
□ User context set at login
□ Custom events tracked
□ Dashboard created
□ Error alerts configured
□ Session replay enabled
□ Performance budgets reviewed
□ Privacy settings approved
□ Production deployment approved
```

---

## Troubleshooting

### **Session Replay Not Recording**

**Symptoms**: No replay data in Datadog

**Solutions**:
```typescript
// Check if new sessions are being created
console.log(datadogRum.getSessionId());

// Verify sampling rate
console.log('Replay sampled:', datadogRum.getSessionReplaySampleRate());

// Check privacy settings
// May be masking too much content
```

### **Missing API Calls**

**Symptoms**: API requests not showing in RUM

**Solutions**:
```typescript
// Ensure API domain is in allowedTracingUrls
datadogRum.init({
  allowedTracingUrls: [/api\.infamous-freight\.com/],
});
```

### **High Memory Usage**

**Symptoms**: Browser becomes slow

**Solutions**:
```typescript
// Reduce session replay sampling
NEXT_PUBLIC_DD_SESSION_REPLAY_SAMPLE_RATE=5  // Lower from 20

// Reduce session sampling
NEXT_PUBLIC_DD_SESSION_SAMPLE_RATE=50  // Lower from 100
```

---

## Integration with Sentry

RUM and Sentry work together for complete observability:

| Tool | Captures | Use For |
|------|----------|---------|
| Datadog RUM | Browser performance, user sessions, frontend events | User experience, performance trends |
| Sentry | JavaScript errors, stack traces, release versions | Error tracking, debugging |

**Both receive and show**:
- JavaScript errors
- User context
- Release information

**Recommendation**: Use both. Datadog RUM for performance, Sentry for error tracking.

---

## Alerts & Notifications

### **Create Datadog Monitors**

**Monitor 1: High Error Rate**
```
Alert if: error.count > 100 in 5min windows
Notify: #infrastructure Slack channel
Severity: High
```

**Monitor 2: Slow Page Load**
```
Alert if: @view.largest_contentful_paint > 3000 for 15min
Notify: #performance Slack channel
Severity: Medium
```

**Monitor 3: High CLS**
```
Alert if: @view.cumulative_layout_shift > 0.1 for 10min
Notify: #frontend Slack channel
Severity: Low
```

---

## Cost Optimization

Datadog RUM charges per 1M page views. **Optimize**:

```typescript
// Reduce session replay sampling in non-production
sessionReplaySampleRate: process.env.NODE_ENV === 'production' ? 20 : 5,

// Reduce session sampling during off-peak
const offPeakHours = [0, 1, 2, 3, 4, 5];  // 12am-5am UTC
const sampleRate = offPeakHours.includes(new Date().getHours()) ? 10 : 50;
```

**Estimated Monthly Cost**:
- Development: $0 (free tier)
- Staging: $100-200/mo (5% sampling)
- Production: $500-1000/mo (20-50% sampling, 100K-200K daily page views)

---

## References

- 📖 [Datadog RUM Documentation](https://docs.datadoghq.com/real_user_monitoring)
- 📖 [Web Vitals Guide](https://web.dev/vitals)
- 📖 [Session Replay Documentation](https://docs.datadoghq.com/real_user_monitoring/session_replay)
- 📖 [Error Tracking](https://docs.datadoghq.com/real_user_monitoring/error_tracking)

---

**Status**: ✅ Ready for deployment  
**Next Step**: Integrate into _app.tsx and test in staging
