---
name: E2E Testing with Playwright
description: Write, run, and debug end-to-end tests using Playwright covering critical user workflows
applyTo:
  - e2e/**/*
keywords:
  - playwright
  - e2e
  - testing
  - automation
  - browser
  - integration
---

# E2E Testing Skill (Playwright)

## 📋 Quick Rules

1. **Framework**: Playwright (not Cypress)
2. **Language**: TypeScript
3. **Structure**: Test files in `e2e/` with `.spec.ts` extension
4. **Browsers**: Test on Chromium, Firefox, WebKit (parallelized)
5. **Fixtures**: Use Playwright fixtures for setup/teardown

## 📁 File Organization

```
e2e/
├── tests/
│   ├── auth.spec.ts          # Login, signup, logout flows
│   ├── shipments.spec.ts     # Shipment CRUD operations
│   ├── dashboard.spec.ts     # Dashboard features
│   └── performance.spec.ts   # Load times, metrics
├── fixtures/                  # Custom fixtures
├── helpers/                   # Utility functions
├── playwright.config.ts       # Configuration
└── package.json
```

## 🧪 Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    
    // Assert user is logged in
    const userName = await page.locator('text=John Doe');
    await expect(userName).toBeVisible();
  });
});
```

## 🎬 Custom Fixtures

```typescript
// e2e/fixtures/auth.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');
    await use(page);
  },
});
```

## 🚀 Running Tests

```bash
# Run all tests
pnpm e2e

# Run specific test file
pnpm e2e tests/auth.spec.ts

# Run in headed mode (see browser)
pnpm e2e --headed

# Debug mode (inspector)
pnpm e2e --debug

# Run on single browser
pnpm e2e --project=chromium
```

## 📊 Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4, // Parallel workers
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm web:dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## 🔍 Common Selectors & Actions

```typescript
// Navigation
await page.goto('/');
await page.click('a:has-text("Dashboard")');

// Form interactions
await page.fill('input[name="email"]', 'user@example.com');
await page.selectOption('select[name="status"]', 'active');
await page.check('input[type="checkbox"]');

// Wait conditions
await page.waitForURL('**/dashboard');
await page.waitForSelector('.shipment-card');
await page.waitForFunction(() => document.querySelectorAll('.item').length > 0);

// Assertions
await expect(page.locator('.success-message')).toBeVisible();
await expect(page.locator('table tbody tr')).toHaveCount(5);
await expect(page).toHaveTitle('Dashboard');
```

## 📈 Performance Testing

```typescript
test('shipment list loads in under 2 seconds', async ({ page }) => {
  const navigationPromise = page.waitForNavigation();
  await page.goto('/shipments');
  
  const navigationTiming = await page.evaluate(() => {
    const timing = window.performance.getEntriesByType('navigation')[0];
    return timing.duration;
  });
  
  expect(navigationTiming).toBeLessThan(2000);
});
```

## 🐛 Debugging Tips

1. **Use --debug flag**:
   ```bash
   pnpm e2e --debug
   ```

2. **Take screenshots on failure**:
   ```typescript
   await page.screenshot({ path: 'failure.png' });
   ```

3. **Trace recording** (replay in Trace Viewer):
   ```bash
   pnpm e2e --trace on
   ```

4. **Slow down execution**:
   ```typescript
   test.use({ slowMo: 1000 }); // 1s per action
   ```

## 🎯 Best Practices

- ✅ Use Page Object Model (POM) for reusable selectors
- ✅ Run tests in parallel for speed
- ✅ Use fixtures for common setup (auth, data)
- ✅ Test critical user paths first
- ✅ Use descriptive test names
- ✅ Wait for elements explicitly (avoid timeouts)

## 🔗 Resources

- [Playwright Docs](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-page)
- [Best Practices](https://playwright.dev/docs/best-practices)
