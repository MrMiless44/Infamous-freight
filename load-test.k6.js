/**
 * Load Test Script for Infæmous Freight API (k6)
 * Usage: k6 run load-test.k6.js
 *
 * Requires:
 * - k6 installed (brew install k6)
 * - API running (pnpm dev)
 * - Valid JWT token in K6_TOKEN env var
 */

import http from "k6/http";
import { check, group, sleep } from "k6";

const API_BASE = __ENV.API_BASE || "http://localhost:3001/api";
const JWT_TOKEN = __ENV.K6_TOKEN || "your-test-jwt-token-here";

export const options = {
  stages: [
    { duration: "2m", target: 10 }, // Ramp up to 10 users
    { duration: "5m", target: 50 }, // Ramp up to 50 users
    { duration: "5m", target: 100 }, // Ramp up to 100 users
    { duration: "3m", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"], // 95% under 500ms, 99% under 1s
    http_req_failed: ["rate<0.1"], // Error rate < 10%
  },
};

export default function () {
  const headers = {
    Authorization: `Bearer ${JWT_TOKEN}`,
    "Content-Type": "application/json",
  };

  group("Dispatch Endpoints", () => {
    // Get drivers list
    let res = http.get(`${API_BASE}/dispatch/drivers`, { headers });
    check(res, {
      "GET /dispatch/drivers returns 200": (r) => r.status === 200,
      "GET /dispatch/drivers response time < 500ms": (r) => r.timings.duration < 500,
    });

    // Get assignments
    res = http.get(`${API_BASE}/dispatch/assignments?status=pending`, { headers });
    check(res, {
      "GET /dispatch/assignments returns 200": (r) => r.status === 200,
      "GET /dispatch/assignments response time < 500ms": (r) => r.timings.duration < 500,
    });

    // Create assignment (POST)
    const assignmentPayload = JSON.stringify({
      shipmentId: `ship-${Math.random().toString(36).substr(2, 9)}`,
      driverId: `driver-${Math.random().toString(36).substr(2, 9)}`,
    });

    res = http.post(`${API_BASE}/dispatch/assignments`, assignmentPayload, { headers });
    check(res, {
      "POST /dispatch/assignments returns 2xx": (r) => r.status >= 200 && r.status < 300,
      "POST /dispatch/assignments response time < 1000ms": (r) => r.timings.duration < 1000,
    });
  });

  group("Health & Status", () => {
    let res = http.get(`${API_BASE}/health`);
    check(res, {
      "GET /health returns 200": (r) => r.status === 200,
      "GET /health response time < 100ms": (r) => r.timings.duration < 100,
    });
  });

  sleep(1);
}
