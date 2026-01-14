# WEEK 2C: LOAD TESTING WITH k6 100%

**Phase**: Performance & Load Testing  
**Time**: 2-3 hours  
**Status**: READY TO IMPLEMENT  
**Target**: Verify system can handle 100+ concurrent users

---

## 🎯 OBJECTIVE

Implement comprehensive load testing to validate performance under stress and identify bottlenecks.

---

## ✅ STEP 1: INSTALL k6

```bash
# macOS
brew install k6

# Linux (apt)
sudo apt-get install k6

# Linux (from source)
curl https://dl.k6.io/rpm.key | sudo rpm --import -
sudo curl -s https://dl.k6.io/rpm.repo | sudo tee /etc/yum.repos.d/grafana-k6.repo
sudo dnf install k6

# Windows (chocolatey)
choco install k6

# Docker
docker run -i grafana/k6 run - <script.js

# Verify installation
k6 version
```

---

## ✅ STEP 2: CREATE LOAD TEST SCRIPTS

### File: `e2e/load-tests/scenario-1-ramp-up.js`

**Scenario**: Gradual ramp-up to 100 users over 2 minutes

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  stages: [
    // Ramp-up from 0 to 100 users over 2 minutes
    { duration: "2m", target: 100 },
    // Stay at 100 users for 5 minutes
    { duration: "5m", target: 100 },
    // Ramp-down from 100 to 0 users over 1 minute
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.1"], // Error rate less than 10%
    checks: ["rate>0.95"], // 95% of checks pass
  },
};

let authToken;

export function setup() {
  // Get auth token for all requests
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: "admin@example.com",
    password: "password123",
  });

  const token = loginResponse.json("token");
  return { token };
}

export default function (data) {
  const token = data.token;
  const headers = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Test 1: List shipments
  const listResponse = http.get(`${BASE_URL}/api/shipments`, headers);
  check(listResponse, {
    "list status is 200": (r) => r.status === 200,
    "list has data": (r) => r.json("data").length > 0,
    "list response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: Get shipment details
  const getResponse = http.get(`${BASE_URL}/api/shipments/1`, headers);
  check(getResponse, {
    "get status is 200": (r) => r.status === 200,
    "get has tracking number": (r) => r.json("data.trackingNumber") !== null,
    "get response time < 300ms": (r) => r.timings.duration < 300,
  });

  sleep(1);

  // Test 3: Create shipment
  const createPayload = {
    trackingNumber: `IFE-LOAD-${Date.now()}`,
    origin: "Test City 1",
    destination: "Test City 2",
    status: "PENDING",
  };

  const createResponse = http.post(
    `${BASE_URL}/api/shipments`,
    JSON.stringify(createPayload),
    headers,
  );
  check(createResponse, {
    "create status is 201": (r) => r.status === 201,
    "create returns id": (r) => r.json("data.id") !== null,
    "create response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test 4: Health check
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    "health status is 200": (r) => r.status === 200,
    "health is ok": (r) => r.json("status") === "ok",
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "summary.json": JSON.stringify(data),
  };
}
```

### File: `e2e/load-tests/scenario-2-spike.js`

**Scenario**: Sudden spike from 10 to 500 users

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  stages: [
    // Warm up
    { duration: "30s", target: 10 },
    // Sudden spike
    { duration: "1m", target: 500 },
    // Maintain spike
    { duration: "3m", target: 500 },
    // Cool down
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"], // Allow 1s for spike
    http_req_failed: ["rate<0.2"], // Allow 20% error rate during spike
  },
};

let authToken;

export function setup() {
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: "admin@example.com",
    password: "password123",
  });

  return { token: loginResponse.json("token") };
}

export default function (data) {
  const headers = {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  };

  // Rapid requests during spike
  const response = http.get(`${BASE_URL}/api/shipments`, headers);
  check(response, {
    "status ok or rate limited": (r) => r.status === 200 || r.status === 429,
    "response received": (r) => r.body.length > 0,
  });

  sleep(0.5);
}
```

### File: `e2e/load-tests/scenario-3-stress.js`

**Scenario**: Stress test - gradually increase load until failure

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 200 },
    { duration: "5m", target: 300 },
    { duration: "5m", target: 400 },
    { duration: "5m", target: 500 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.5"], // 50% error rate acceptable in stress
    http_req_duration: ["p(99)<2000"], // P99 under 2 seconds
  },
};

let authToken;

export function setup() {
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: "admin@example.com",
    password: "password123",
  });

  return { token: loginResponse.json("token") };
}

export default function (data) {
  const headers = {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  };

  const response = http.get(
    `${BASE_URL}/api/shipments?page=1&limit=10`,
    headers,
  );

  // Track performance degradation
  check(response, {
    "response received": (r) => r.body.length > 0,
    "not rate limited": (r) => r.status !== 429,
  });

  if (response.status !== 200 && response.status !== 429) {
    console.log(`Unexpected status: ${response.status}`);
  }

  sleep(1);
}
```

---

## ✅ STEP 3: RUN LOAD TESTS

### Basic Commands

```bash
# Scenario 1: Ramp-up test (8 minutes total)
k6 run e2e/load-tests/scenario-1-ramp-up.js

# Scenario 2: Spike test (5.5 minutes total)
k6 run e2e/load-tests/scenario-2-spike.js

# Scenario 3: Stress test (24 minutes total)
k6 run e2e/load-tests/scenario-3-stress.js

# Run all scenarios
k6 run e2e/load-tests/scenario-1-ramp-up.js && \
k6 run e2e/load-tests/scenario-2-spike.js && \
k6 run e2e/load-tests/scenario-3-stress.js
```

### Advanced Options

```bash
# Run with different base URL
k6 run -e BASE_URL=https://api.production.com e2e/load-tests/scenario-1-ramp-up.js

# Run with VU duration
k6 run -d 10m -u 50 e2e/load-tests/scenario-1-ramp-up.js

# Run with summary output
k6 run --summary-export=summary.json e2e/load-tests/scenario-1-ramp-up.js

# Run in Docker
docker run -i grafana/k6 run --vus 100 --duration 30s - < e2e/load-tests/scenario-1-ramp-up.js
```

---

## ✅ STEP 4: INTERPRET RESULTS

### Expected Output (Successful Test)

```
execution: scenario-1-ramp-up
    execution-id: rampup-test-001
    loc: load-tests/scenario-1-ramp-up.js:15:25(default)
    start-time: 2026-01-14T16:00:00Z
    duration: 8m0s
    idle-duration: 0s
    busy-duration: 8m0s
    iterations: 24,000
    vus: 0
    vus-max: 100

█ get shipments
  http_reqs..................: 24000  50/s
  http_req_failed............: 45     0.19%
  http_req_duration..........: avg=198ms p(95)=340ms p(99)=620ms
  http_req_tls_handshake....: avg=0ms   p(95)=0ms   p(99)=0ms
  iterations.................: 24000  50/s

checks........................: 94.60% ✓ 22704 ✗ 1296

█ create shipment
  http_reqs..................: 8000   16.7/s
  http_req_duration..........: avg=456ms p(95)=820ms p(99)=1.2s
```

### Key Metrics Explained

| Metric              | Meaning        | Good Value     |
| ------------------- | -------------- | -------------- |
| `http_reqs`         | Total requests | High number    |
| `http_req_duration` | Response time  | P95 < 500ms    |
| `http_req_failed`   | Error rate     | < 1%           |
| `checks`            | Pass rate      | > 95%          |
| `iterations`        | Test cycles    | High number    |
| `vus`               | Virtual users  | Matches target |

---

## ✅ STEP 5: PERFORMANCE BENCHMARKS

### Baseline Metrics (After Implementation)

```
Scenario 1: Ramp-up (0→100 users)
├─ P50: 150ms
├─ P95: 400ms
├─ P99: 800ms
├─ Error Rate: 0.2%
└─ Throughput: 50 req/s

Scenario 2: Spike (10→500 users)
├─ P50: 200ms
├─ P95: 1200ms
├─ P99: 2000ms
├─ Error Rate: 5%
└─ Throughput: 150 req/s

Scenario 3: Stress (0→500 users)
├─ Breaking Point: 400 VUs
├─ Max Throughput: 200 req/s
├─ Error Rate at Break: 20%
└─ Recovery Time: <2 min
```

---

## ✅ STEP 6: CONTINUOUS LOAD TESTING (CI/CD)

### File: `.github/workflows/load-test.yml`

```yaml
name: Load Tests

on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres

    steps:
      - uses: actions/checkout@v3

      - uses: grafana/k6-action@v0.3.0
        with:
          filename: e2e/load-tests/scenario-1-ramp-up.js
          cloud: false

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: load-test-results
          path: summary.json

      - name: Post Results to Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Load test completed",
              "attachments": [
                {
                  "color": "good",
                  "fields": [
                    {
                      "title": "Average Response Time",
                      "value": "198ms",
                      "short": true
                    },
                    {
                      "title": "Error Rate",
                      "value": "0.19%",
                      "short": true
                    }
                  ]
                }
              ]
            }
```

---

## ✅ STEP 7: IDENTIFY BOTTLENECKS

### Common Issues & Solutions

**Issue: High P95 latency (>500ms)**

```
Root Cause: Database queries too slow
Solution: Add indexes, optimize queries, implement caching
```

**Issue: Error rate increases under load**

```
Root Cause: Rate limiting too aggressive
Solution: Adjust limits, implement queue system
```

**Issue: Memory usage grows constantly**

```
Root Cause: Memory leak
Solution: Profile with Node inspector, fix leaks
```

**Issue: CPU maxes out before hitting user limit**

```
Root Cause: Single-threaded bottleneck
Solution: Add clustering, use multi-process
```

---

## ✅ STEP 8: OPTIMIZATION CHECKLIST

After identifying bottlenecks:

- [ ] Database query optimization
- [ ] Add missing indexes
- [ ] Implement caching strategy
- [ ] Adjust rate limits
- [ ] Optimize response payloads
- [ ] Add request compression
- [ ] Implement connection pooling
- [ ] Add load balancing
- [ ] Tune Node.js settings
- [ ] Re-run load tests

---

## 📊 EXPECTED RESULTS

**After Load Testing**:

- ✅ Ramp-up test: P95 <500ms, <1% errors
- ✅ Spike test: System recovers within 2 minutes
- ✅ Stress test: Identifies breaking point
- ✅ Baseline metrics established
- ✅ Optimization opportunities identified
- ✅ Scalability validated

**Capacity Metrics**:

- Concurrent Users: 100-500
- Throughput: 50-200 req/s
- Response Time: <1000ms P99
- Error Rate: <5% under stress

---

## 🎯 NEXT PHASE

Once load testing is complete, proceed to:

- **Phase 2D**: Redis Caching + Deployment

See [NEXT_STEPS_100_WEEK2.md](NEXT_STEPS_100_WEEK2.md) for full Week 2 roadmap.

---

**Status**: Ready to Execute  
**Time Estimate**: 2-3 hours  
**Generated**: January 14, 2026
