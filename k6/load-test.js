/**
 * Load Testing Scripts (k6)
 * Performance and load testing for API endpoints
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const duration = new Trend("request_duration");
const apiRequestCount = new Counter("api_requests");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 virtual users
    { duration: "1m", target: 50 }, // Ramp up to 50 virtual users
    { duration: "2m", target: 50 }, // Stay at 50 virtual users
    { duration: "30s", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    errors: ["rate<0.1"],
  },
};

const API_BASE = __ENV.API_URL || "http://localhost:4000/api";
const JWT_TOKEN = __ENV.JWT_TOKEN || "your-jwt-token";

/**
 * Authentication test
 */
export function testAuth() {
  group("Authentication", () => {
    const payload = JSON.stringify({
      email: `test-${Date.now()}@example.com`,
      password: "SecurePassword123!",
    });

    const params = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = http.post(`${API_BASE}/auth/login`, payload, params);

    check(res, {
      "login status is 200": (r) => r.status === 200,
      "login returns token": (r) => r.json("data.token") !== undefined,
    });

    duration.add(res.timings.duration);
    apiRequestCount.add(1);
    if (res.status !== 200) errorRate.add(1);
  });
}

/**
 * Shipments API test
 */
export function testShipments() {
  group("Shipments", () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    };

    // List shipments
    const listRes = http.get(`${API_BASE}/shipments?limit=20`, { headers });
    check(listRes, {
      "list shipments status is 200": (r) => r.status === 200,
      "list returns data array": (r) => Array.isArray(r.json("data")),
    });

    duration.add(listRes.timings.duration);
    apiRequestCount.add(1);
    if (listRes.status !== 200) errorRate.add(1);

    // Create shipment
    const createPayload = JSON.stringify({
      reference: `SHIP-${Date.now()}`,
      origin: "New York",
      destination: "Los Angeles",
    });

    const createRes = http.post(`${API_BASE}/shipments`, createPayload, { headers });
    check(createRes, {
      "create shipment status is 201": (r) => r.status === 201,
      "response has shipment id": (r) => r.json("data.id") !== undefined,
    });

    duration.add(createRes.timings.duration);
    apiRequestCount.add(1);
    if (createRes.status !== 201) errorRate.add(1);

    if (createRes.status === 201) {
      const shipmentId = createRes.json("data.id");

      // Get single shipment
      const getRes = http.get(`${API_BASE}/shipments/${shipmentId}`, { headers });
      check(getRes, {
        "get shipment status is 200": (r) => r.status === 200,
      });

      duration.add(getRes.timings.duration);
      apiRequestCount.add(1);
      if (getRes.status !== 200) errorRate.add(1);
    }
  });

  sleep(1);
}

/**
 * Health check test
 */
export function testHealth() {
  group("Health", () => {
    const res = http.get(`${API_BASE}/health`);

    check(res, {
      "health status is 200": (r) => r.status === 200,
      "health returns status": (r) => r.json("status") !== undefined,
    });

    duration.add(res.timings.duration);
    apiRequestCount.add(1);
    if (res.status !== 200) errorRate.add(1);
  });
}

/**
 * Rate limiting test
 */
export function testRateLimiting() {
  group("Rate Limiting", () => {
    const headers = {
      Authorization: `Bearer ${JWT_TOKEN}`,
    };

    // Hit rate limit
    for (let i = 0; i < 150; i++) {
      const res = http.get(`${API_BASE}/shipments`, { headers });

      if (i > 100) {
        check(res, {
          "rate limit kicks in": (r) => r.status === 429,
        });
      }

      if (res.status === 429) {
        errorRate.add(1);
        break;
      }
    }
  });

  sleep(2); // Wait before retrying
}

/**
 * Stress test
 */
export function testStress() {
  testAuth();
  testShipments();
  testHealth();
}

/**
 * Main test function
 */
export default function () {
  testHealth();
  testAuth();
  testShipments();
}
