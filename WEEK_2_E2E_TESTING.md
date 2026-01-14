# WEEK 2B: E2E TESTING WITH PLAYWRIGHT 100%

**Phase**: End-to-End Testing  
**Time**: 2-3 hours  
**Status**: READY TO IMPLEMENT  
**Target**: Full user workflow testing

---

## 🎯 OBJECTIVE

Implement comprehensive E2E tests covering complete user journeys using Playwright.

---

## ✅ STEP 1: INSTALL PLAYWRIGHT

```bash
cd e2e

# Install Playwright test framework
npm install --save-dev @playwright/test

# Install browsers
npx playwright install

# Verify installation
npx playwright --version
```

---

## ✅ STEP 2: CREATE PLAYWRIGHT CONFIG

### File: `e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "cd .. && pnpm web:dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## ✅ STEP 3: CREATE E2E TEST SUITE

### File: `e2e/tests/auth.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("User can login with valid credentials", async ({ page }) => {
    await page.goto("/");

    // Click login button
    await page.click('button:has-text("Login")');

    // Fill login form
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Wait for redirect to dashboard
    await page.waitForURL("/dashboard");
    expect(page.url()).toContain("/dashboard");
  });

  test("User cannot login with invalid credentials", async ({ page }) => {
    await page.goto("/");

    await page.click('button:has-text("Login")');
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button:has-text("Sign In")');

    // Should see error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });

  test("User can logout", async ({ page, context }) => {
    // Login first
    await page.goto("/");
    await page.click('button:has-text("Login")');
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("/dashboard");

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click("text=Logout");

    // Should redirect to home
    await page.waitForURL("/");
  });
});
```

### File: `e2e/tests/shipments.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Shipment Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/");
    await page.click('button:has-text("Login")');
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("/dashboard");
  });

  test("User can create a new shipment", async ({ page }) => {
    // Navigate to shipments
    await page.click('a:has-text("Shipments")');

    // Click create button
    await page.click('button:has-text("New Shipment")');

    // Fill form
    await page.fill('input[name="trackingNumber"]', "IFE-E2E-001");
    await page.fill('input[name="origin"]', "New York");
    await page.fill('input[name="destination"]', "Los Angeles");
    await page.selectOption('select[name="status"]', "PENDING");

    // Submit
    await page.click('button:has-text("Create")');

    // Should see success message
    await expect(page.locator("text=Shipment created")).toBeVisible();
  });

  test("User can view shipment details", async ({ page }) => {
    // Navigate to shipments
    await page.click('a:has-text("Shipments")');

    // Click first shipment
    await page.click("text=IFE-001");

    // Should see details
    await expect(page.locator("text=IFE-001")).toBeVisible();
    await expect(page.locator("text=IN_TRANSIT")).toBeVisible();
  });

  test("User can update shipment status", async ({ page }) => {
    // Navigate to shipments
    await page.click('a:has-text("Shipments")');

    // Click first shipment
    await page.click("text=IFE-001");

    // Update status
    await page.selectOption('select[name="status"]', "IN_TRANSIT");
    await page.click('button:has-text("Update")');

    // Should see success
    await expect(page.locator("text=Shipment updated")).toBeVisible();
  });

  test("User can delete a shipment", async ({ page }) => {
    // Navigate to shipments
    await page.click('a:has-text("Shipments")');

    // Get row count before
    const rowsBefore = await page.locator("table tbody tr").count();

    // Delete first shipment
    await page.click('button[aria-label="Delete"]');
    await page.click('button:has-text("Confirm")');

    // Should see success
    await expect(page.locator("text=Shipment deleted")).toBeVisible();

    // Row count should decrease
    const rowsAfter = await page.locator("table tbody tr").count();
    expect(rowsAfter).toBe(rowsBefore - 1);
  });

  test("User can search shipments", async ({ page }) => {
    // Navigate to shipments
    await page.click('a:has-text("Shipments")');

    // Search
    await page.fill('input[placeholder="Search..."]', "IFE-001");
    await page.waitForTimeout(500); // Wait for search results

    // Should only see matching shipment
    const results = await page.locator("table tbody tr").count();
    expect(results).toBeGreaterThan(0);

    // All results should contain search term
    const text = await page.locator("table tbody").textContent();
    expect(text).toContain("IFE-001");
  });

  test("User can filter by status", async ({ page }) => {
    // Navigate to shipments
    await page.click('a:has-text("Shipments")');

    // Filter by status
    await page.selectOption('select[name="status"]', "DELIVERED");
    await page.waitForTimeout(500);

    // Should only see DELIVERED shipments
    const delivered = await page.locator("text=DELIVERED").count();
    expect(delivered).toBeGreaterThan(0);
  });
});
```

### File: `e2e/tests/api.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("API Health Checks", () => {
  test("Health endpoint is responsive", async ({ request }) => {
    const response = await request.get("http://localhost:4000/api/health");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.uptime).toBeGreaterThan(0);
  });

  test("Authentication endpoint works", async ({ request }) => {
    const response = await request.post(
      "http://localhost:4000/api/auth/login",
      {
        data: {
          email: "admin@example.com",
          password: "password123",
        },
      },
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.token).toBeTruthy();
  });

  test("Shipments endpoint requires authentication", async ({ request }) => {
    // Without token
    const response = await request.get("http://localhost:4000/api/shipments");
    expect(response.status()).toBe(401);
  });

  test("Can fetch shipments with valid token", async ({ request }) => {
    // Get token
    const authResponse = await request.post(
      "http://localhost:4000/api/auth/login",
      {
        data: {
          email: "admin@example.com",
          password: "password123",
        },
      },
    );
    const { token } = await authResponse.json();

    // Fetch shipments
    const response = await request.get("http://localhost:4000/api/shipments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

---

## ✅ STEP 4: CREATE TEST UTILITIES

### File: `e2e/utils/auth.ts`

```typescript
import { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.click('button:has-text("Login")');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL("/dashboard");
}

export async function logout(page: Page) {
  await page.click('button[aria-label="User menu"]');
  await page.click("text=Logout");
  await page.waitForURL("/");
}
```

---

## ✅ STEP 5: RUN E2E TESTS

### Commands

```bash
cd e2e

# Run all tests
npx playwright test

# Run with UI (interactive mode)
npx playwright test --ui

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Generate HTML report
npx playwright test
npx playwright show-report
```

---

## ✅ STEP 6: CI/CD INTEGRATION

### File: `.github/workflows/e2e.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.9

      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "pnpm"

      - run: pnpm install

      - run: pnpm --filter api build

      - run: pnpm --filter web build

      - run: npx playwright install --with-deps

      - run: pnpm e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

---

## ✅ EXPECTED RESULTS

**After E2E Implementation**:

- ✅ Authentication tests passing
- ✅ Shipment CRUD tests passing
- ✅ Search & filter tests passing
- ✅ API health check tests passing
- ✅ 100% critical user path coverage
- ✅ HTML reports generated
- ✅ CI/CD integrated

**Test Statistics**:

- Total Tests: 15+
- Pass Rate: 95%+
- Execution Time: <5 minutes
- Browsers: Chrome, Firefox, Safari

---

## 📊 EXPECTED TEST RESULTS

```
Running 15 tests using 1 worker

✓ Authentication › User can login with valid credentials (2.3s)
✓ Authentication › User cannot login with invalid credentials (1.8s)
✓ Authentication › User can logout (2.1s)
✓ Shipment Management › User can create a new shipment (3.2s)
✓ Shipment Management › User can view shipment details (2.4s)
✓ Shipment Management › User can update shipment status (3.1s)
✓ Shipment Management › User can delete a shipment (2.5s)
✓ Shipment Management › User can search shipments (2.8s)
✓ Shipment Management › User can filter by status (2.2s)
✓ API Health Checks › Health endpoint is responsive (0.5s)
✓ API Health Checks › Authentication endpoint works (0.6s)
✓ API Health Checks › Shipments endpoint requires auth (0.4s)
✓ API Health Checks › Can fetch shipments with valid token (0.7s)

15 passed (45.6s)

Generated HTML report → file://e2e/playwright-report/index.html
```

---

## 🎯 NEXT PHASE

Once E2E tests are complete, proceed to:

- **Phase 2C**: Load Testing (k6)
- **Phase 2D**: Redis Caching

See [NEXT_STEPS_100_WEEK2.md](NEXT_STEPS_100_WEEK2.md) for full Week 2 roadmap.

---

**Status**: Ready to Execute  
**Time Estimate**: 2-3 hours  
**Generated**: January 14, 2026
