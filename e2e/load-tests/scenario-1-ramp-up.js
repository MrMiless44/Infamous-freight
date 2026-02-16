import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";

/**
 * k6 Load Test - Ramp-up Scenario
 * Gradually increases users from 0 to 100 over 2 minutes
 * Maintains 100 users for 5 minutes
 * Ramps down to 0 over 1 minute
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const API_TIMEOUT = "10s";

// Custom metrics
const errorRate = new Rate("errors");
const requestDuration = new Trend("request_duration");
const shipmentListDuration = new Trend("shipment_list_duration");
const shipmentCreateDuration = new Trend("shipment_create_duration");
const successRate = new Rate("success");
const activeRequests = new Gauge("active_requests");

export const options = {
  stages: [
    // Ramp-up: 0 to 100 users over 2 minutes
    { duration: "2m", target: 100, name: "Ramp-up" },
    // Sustain: Stay at 100 users for 5 minutes
    { duration: "5m", target: 100, name: "Sustain" },
    // Ramp-down: 100 to 0 users over 1 minute
    { duration: "1m", target: 0, name: "Ramp-down" },
  ],
  thresholds: {
    // 95% of requests must complete within 500ms
    request_duration: ["p(95)<500"],
    // Error rate must be less than 5%
    errors: ["rate<0.05"],
    // 95% of checks must pass
    checks: ["rate>0.95"],
  },
};

// Setup: Get auth token once for all VUs
export function setup() {
  console.log("🔐 Setting up test data...");

  // Login to get token
  const loginPayload = JSON.stringify({
    email: "admin@example.com",
    password: "password123",
  });

  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { "Content-Type": "application/json" },
    timeout: API_TIMEOUT,
  });

  check(loginResponse, {
    "login status is 200": (r) => r.status === 200,
    "login response has token": (r) => r.json("token") !== undefined,
  });

  const token = loginResponse.json("token");
  console.log(`✅ Auth token obtained`);

  return { token };
}

// Main test function
export default function (data) {
  const token = data.token;
  const headers = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: API_TIMEOUT,
  };

  // Test 1: List shipments (GET)
  const listStart = Date.now();
  const listResponse = http.get(`${BASE_URL}/api/shipments`, headers);
  const listDuration = Date.now() - listStart;

  shipmentListDuration.add(listDuration);
  requestDuration.add(listDuration);
  activeRequests.add(1);

  const listChecksPassed = check(listResponse, {
    "list shipments - status 200": (r) => r.status === 200,
    "list shipments - has data": (r) => {
      const body = r.json();
      return body.data && Array.isArray(body.data);
    },
    "list shipments - response time < 500ms": (r) => r.timings.duration < 500,
  });

  errorRate.add(!listChecksPassed);
  successRate.add(listChecksPassed);

  sleep(0.5);

  // Test 2: Create shipment (POST)
  const createPayload = JSON.stringify({
    trackingNumber: `IFE-LOAD-${Date.now()}-${Math.random()}`,
    origin: "Los Angeles, CA",
    destination: "New York, NY",
    status: "pending",
  });

  const createStart = Date.now();
  const createResponse = http.post(`${BASE_URL}/api/shipments`, createPayload, headers);
  const createDuration = Date.now() - createStart;

  shipmentCreateDuration.add(createDuration);
  requestDuration.add(createDuration);
  activeRequests.add(1);

  const createChecksPassed = check(createResponse, {
    "create shipment - status 201": (r) => r.status === 201,
    "create shipment - has id": (r) => r.json("data.id") !== undefined,
    "create shipment - response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  errorRate.add(!createChecksPassed);
  successRate.add(createChecksPassed);

  sleep(1);

  // Test 3: Get single shipment (GET)
  const getStart = Date.now();
  const getResponse = http.get(`${BASE_URL}/api/shipments?limit=1`, headers);
  const getDuration = Date.now() - getStart;

  requestDuration.add(getDuration);
  activeRequests.add(1);

  const getChecksPassed = check(getResponse, {
    "get shipments - status 200": (r) => r.status === 200,
    "get shipments - response time < 500ms": (r) => r.timings.duration < 500,
  });

  errorRate.add(!getChecksPassed);
  successRate.add(getChecksPassed);

  sleep(0.5);
}

// Teardown (runs after all VUs complete)
export function teardown(data) {
  console.log("📊 Test completed!");
}
