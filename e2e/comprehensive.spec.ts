/**
 * E2E Testing Strategy - Playwright
 *
 * Critical user journeys to test:
 * 1. Authentication flow
 * 2. Shipment creation & tracking
 * 3. Payment processing
 * 4. AI voice commands
 */

import { test, expect } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:4000";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

test.describe("End-to-End: Freight Management Platform", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test("User can log in and view dashboard", async ({ page }) => {
    // Navigate to login
    await page.click('a:has-text("Sign In")');

    // Fill credentials
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");

    // Submit
    await page.click('button:has-text("Sign In")');

    // Verify redirect to dashboard
    await page.waitForURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("User can create and track shipment", async ({ page }) => {
    // Login first
    await loginUser(page);

    // Navigate to shipments
    await page.click('a:has-text("Shipments")');

    // Create new shipment
    await page.click('button:has-text("New Shipment")');

    // Fill form
    await page.fill('input[placeholder="Origin"]', "New York");
    await page.fill('input[placeholder="Destination"]', "Los Angeles");
    await page.selectOption('select[name="driverId"]', "driver-1");

    // Submit
    await page.click('button:has-text("Create Shipment")');

    // Verify shipment created
    await expect(page.locator("text=Shipment created successfully")).toBeVisible();
    await expect(page.locator("text=TRACK")).toBeVisible();
  });

  test("Shipment updates in real-time via WebSocket", async ({ page, context }) => {
    // Login and navigate to shipments
    await loginUser(page);
    await page.goto(`${APP_URL}/shipments/TRACK001`);

    // Open second tab to simulate status update
    const page2 = await context.newPage();
    const response = await page2.request.post(`${API_URL}/api/shipments/TRACK001`, {
      data: { status: "in_transit" },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });

    expect(response.status()).toBe(200);

    // Verify real-time update on first page
    await expect(page.locator("text=In Transit")).toBeVisible({
      timeout: 5000,
    });

    await page2.close();
  });

  test("Payment processing flow", async ({ page }) => {
    await loginUser(page);

    // Navigate to billing
    await page.click('a:has-text("Billing")');

    // Click upgrade
    await page.click('button:has-text("Upgrade to Premium")');

    // Fill Stripe form
    const frameHandle = await page.$('iframe[title*="Stripe"]');
    const frame = await frameHandle.contentFrame();
    await frame.fill('[placeholder="Card number"]', "4242 4242 4242 4242");
    await frame.fill('[placeholder="MM / YY"]', "12 / 25");
    await frame.fill('[placeholder="CVC"]', "123");

    // Submit
    await page.click('button:has-text("Complete Purchase")');

    // Verify success
    await expect(page.locator("text=Payment successful")).toBeVisible();
  });

  test("Accessibility compliance", async ({ page }) => {
    const accessibilityScanner = require("@axe-core/react");

    // Scan page for a11y issues
    const results = await page.evaluate(() => {
      return window.axe.run();
    });

    // Only warnings allowed, no violations
    expect(results.violations).toHaveLength(0);
    expect(results.incomplete.length).toBeLessThan(3);
  });

  test("Performance: Page loads under 3 seconds", async ({ page }) => {
    const startTime = Date.now();

    await page.goto(APP_URL);
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });
});

// Helper function
async function loginUser(page) {
  await page.goto(`${APP_URL}/login`);
  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button:has-text("Sign In")');
  await page.waitForURL("/dashboard");
}

function getAuthToken() {
  // In real scenario, retrieve from localStorage or test setup
  return "test-token";
}
