import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

/**
 * k6 Load Test - Spike Scenario
 * Tests API behavior under sudden traffic spike
 * Starts with 10 users, spikes to 500 users instantly,
 * then returns to 10 users
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const API_TIMEOUT = "10s";

// Custom metrics
const errorRate = new Rate("spike_errors");
const requestDuration = new Trend("spike_request_duration");
const successRate = new Rate("spike_success");

export const options = {
  stages: [
    // Warm up: 10 users for 1 minute
    { duration: "1m", target: 10, name: "Warm-up" },
    // Spike: Jump to 500 users instantly
    { duration: "30s", target: 500, name: "Spike" },
    // Cool down: Return to 10 users
    { duration: "1m", target: 10, name: "Cool-down" },
  ],
  thresholds: {
    spike_request_duration: ["p(95)<1000", "p(99)<2000"],
    spike_errors: ["rate<0.1"],
  },
};

// Setup
export function setup() {
  const loginPayload = JSON.stringify({
    email: "admin@example.com",
    password: "password123",
  });

  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { "Content-Type": "application/json" },
    timeout: API_TIMEOUT,
  });

  const token = loginResponse.json("token");
  return { token };
}

// Main test
export default function (data) {
  const token = data.token;
  const headers = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: API_TIMEOUT,
  };

  // Heavy operation: List with pagination
  const listResponse = http.get(
    `${BASE_URL}/api/shipments?page=1&limit=50&sort=-createdAt`,
    headers,
  );

  requestDuration.add(listResponse.timings.duration);

  const listChecksPassed = check(listResponse, {
    "spike list - status 200": (r) => r.status === 200,
    "spike list - response time < 2000ms": (r) => r.timings.duration < 2000,
  });

  errorRate.add(!listChecksPassed);
  successRate.add(listChecksPassed);

  sleep(Math.random() * 2);
}
