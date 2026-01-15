import { test, expect } from "@playwright/test";

test.describe("Authentication Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login page", async ({ page }) => {
    await expect(page).toHaveTitle(/Login|Auth/i);
    await expect(page.locator("button:has-text('Login')")).toBeVisible();
  });

  test("should login with valid credentials", async ({ page }) => {
    // Click login button
    await page.click("button:has-text('Login')");

    // Fill email
    await page.fill('input[name="email"]', "admin@example.com");

    // Fill password
    await page.fill('input[name="password"]', "password123");

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard|\/shipments/);
    await expect(page).toHaveURL(/dashboard|shipments/);
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.click("button:has-text('Login')");

    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button:has-text("Sign In")');

    // Should see error message
    await expect(page.locator("text=/Invalid|Error/i")).toBeVisible();
  });

  test("should handle empty form submission", async ({ page }) => {
    await page.click("button:has-text('Login')");

    // Try to submit empty form
    await page.click('button:has-text("Sign In")');

    // Should show validation errors
    await expect(page.locator("text=/required|Please/i")).toBeVisible();
  });

  test("should logout successfully", async ({ page, context }) => {
    // Login first
    await page.click("button:has-text('Login')");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/dashboard|shipments/);

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click("text=Logout");

    // Should redirect to login
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
