// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const env = require('./src/config/env');

/**
 * Tests run against production (there is no staging), so we keep the load low:
 * 2 workers, Chromium only, and tracker requests blocked (see src/fixtures/test.js).
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: env.WORKERS,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: env.BASE_URL,
    viewport: { width: 1366, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    headless : true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } },
    },
  ],
});
