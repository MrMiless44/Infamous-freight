// e2e/tests/api.test.js - Comprehensive API E2E Tests
const TestRunner = require("../test-runner");

const runner = new TestRunner();

// Test 1: Health Check
runner.test("GET /api/health - Health check returns OK", async (t) => {
  const res = await t.request("GET", "/api/health");
  t.expect(res.status).toBe(200);
  t.expect(res.data.status).toBe("ok");
  t.expect(res.data).toHaveProperty("uptime");
});

// Test 2: Authentication Required
runner.test("GET /api/shipments - Requires authentication", async (t) => {
  const originalToken = t.token;
  t.token = null; // Remove token
  const res = await t.request("GET", "/api/shipments");
  t.expect(res.status).toBe(401);
  t.expect(res.data).toHaveProperty("error");
  t.token = originalToken; // Restore token
});

// Test 3: List Shipments
runner.test("GET /api/shipments - Returns shipment list", async (t) => {
  const res = await t.request("GET", "/api/shipments");
  t.expect(res.status).toBe(200);
  t.expect(res.data.success).toBe(true);
  t.expect(res.data).toHaveProperty("data");
  t.expect(res.data).toHaveProperty("pagination");
  t.expect(Array.isArray(res.data.data)).toBeTruthy();
});

// Test 4: Pagination
runner.test("GET /api/shipments?page=1&limit=2 - Pagination works", async (t) => {
  const res = await t.request("GET", "/api/shipments?page=1&limit=2");
  t.expect(res.status).toBe(200);
  t.expect(res.data.data.length).toBe(2);
  t.expect(res.data.pagination.page).toBe(1);
  t.expect(res.data.pagination.limit).toBe(2);
});

// Test 5: Filtering by Status
runner.test("GET /api/shipments?status=PENDING - Filter by status", async (t) => {
  const res = await t.request("GET", "/api/shipments?status=PENDING");
  t.expect(res.status).toBe(200);
  if (res.data.data.length > 0) {
    res.data.data.forEach((shipment) => {
      t.expect(shipment.status).toBe("PENDING");
    });
  }
});

// Test 6: Search Functionality
runner.test("GET /api/shipments?search=Seattle - Search works", async (t) => {
  const res = await t.request("GET", "/api/shipments?search=Seattle");
  t.expect(res.status).toBe(200);
  if (res.data.data.length > 0) {
    const hasSeattle = res.data.data.some(
      (s) => s.origin?.includes("Seattle") || s.destination?.includes("Seattle"),
    );
    t.expect(hasSeattle).toBeTruthy();
  }
});

// Test 7: Sorting
runner.test("GET /api/shipments?sortBy=createdAt&order=asc - Sorting works", async (t) => {
  const res = await t.request("GET", "/api/shipments?sortBy=createdAt&order=asc");
  t.expect(res.status).toBe(200);
  const dates = res.data.data.map((s) => new Date(s.createdAt).getTime());
  for (let i = 1; i < dates.length; i++) {
    t.expect(dates[i]).toBeGreaterThan(dates[i - 1] - 1);
  }
});

// Test 8: Get Single Shipment - Valid
runner.test("GET /api/shipments/1 - Returns single shipment", async (t) => {
  const res = await t.request("GET", "/api/shipments/1");
  t.expect(res.status).toBe(200);
  t.expect(res.data.success).toBe(true);
  t.expect(res.data.data).toHaveProperty("id");
  t.expect(res.data.data.id).toBe(1);
});

// Test 9: Get Single Shipment - Not Found
runner.test("GET /api/shipments/99999 - Returns 404 for non-existent shipment", async (t) => {
  const res = await t.request("GET", "/api/shipments/99999");
  t.expect(res.status).toBe(404);
  t.expect(res.data).toHaveProperty("error");
});

// Test 10: Create Shipment - Valid
runner.test("POST /api/shipments - Creates new shipment", async (t) => {
  const newShipment = {
    trackingNumber: `TEST-${Date.now()}`,
    status: "PENDING",
    origin: "Test City",
    destination: "Test Destination",
    weight: 100,
    value: 5000,
  };

  const res = await t.request("POST", "/api/shipments", newShipment);
  t.expect(res.status).toBe(201);
  t.expect(res.data.success).toBe(true);
  t.expect(res.data.data).toHaveProperty("id");
  t.expect(res.data.data.trackingNumber).toBe(newShipment.trackingNumber);

  // Store ID for later tests
  global.testShipmentId = res.data.data.id;
});

// Test 11: Create Shipment - Invalid Data
runner.test("POST /api/shipments - Rejects invalid data", async (t) => {
  const invalidShipment = {
    // Missing required fields
    trackingNumber: "INVALID",
  };

  const res = await t.request("POST", "/api/shipments", invalidShipment);
  t.expect([400, 422].includes(res.status)).toBeTruthy();
});

// Test 12: Update Shipment - Valid
runner.test("PUT /api/shipments/:id - Updates shipment", async (t) => {
  if (!global.testShipmentId) {
    throw new Error("Test shipment not created");
  }

  const updates = {
    status: "IN_TRANSIT",
  };

  const res = await t.request("PUT", `/api/shipments/${global.testShipmentId}`, updates);
  t.expect(res.status).toBe(200);
  t.expect(res.data.success).toBe(true);
  t.expect(res.data.data.status).toBe("IN_TRANSIT");
});

// Test 13: Update Shipment - Not Found
runner.test("PUT /api/shipments/99999 - Returns 404 for non-existent shipment", async (t) => {
  const res = await t.request("PUT", "/api/shipments/99999", { status: "DELIVERED" });
  t.expect(res.status).toBe(404);
});

// Test 14: Delete Shipment - Valid
runner.test("DELETE /api/shipments/:id - Deletes shipment", async (t) => {
  if (!global.testShipmentId) {
    throw new Error("Test shipment not created");
  }

  const res = await t.request("DELETE", `/api/shipments/${global.testShipmentId}`);
  t.expect(res.status).toBe(200);
  t.expect(res.data.success).toBe(true);

  // Verify deletion
  const verifyRes = await t.request("GET", `/api/shipments/${global.testShipmentId}`);
  t.expect(verifyRes.status).toBe(404);
});

// Test 15: Delete Shipment - Not Found
runner.test("DELETE /api/shipments/99999 - Returns 404 for non-existent shipment", async (t) => {
  const res = await t.request("DELETE", "/api/shipments/99999");
  t.expect(res.status).toBe(404);
});

// Test 16: CORS Headers
runner.test("GET /api/shipments - Returns CORS headers", async (t) => {
  const res = await t.request("GET", "/api/shipments");
  t.expect(res.headers).toHaveProperty("access-control-allow-origin");
});

// Test 17: Security Headers
runner.test("GET /api/health - Returns security headers", async (t) => {
  const res = await t.request("GET", "/api/health");
  t.expect(res.headers).toHaveProperty("x-content-type-options");
});

// Test 18: Rate Limiting (Basic Check)
runner.test("Rate limiting - Multiple requests work", async (t) => {
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(t.request("GET", "/api/health"));
  }
  const results = await Promise.all(promises);
  results.forEach((res) => {
    t.expect(res.status).toBe(200);
  });
});

// Run all tests
runner
  .run()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Test runner error:", err);
    process.exit(1);
  });
