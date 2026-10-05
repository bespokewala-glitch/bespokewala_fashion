import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test env — fall back to .env if .env.test doesn't exist
dotenv.config({ path: '.env.test', override: false });
dotenv.config({ path: '.env', override: false });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially to avoid shared-state issues
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    // Always use port 3000 — dev server must be running (or webServer below starts it)
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Explicit timeouts — prevents 1ms "instant fail" when browser hasn't fully loaded
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },

  projects: [
    // ── Desktop Chromium ──────────────────────────────────────────────────────
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // ── Mobile Safari ────────────────────────────────────────────────────────
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Reuse the already-running dev server on port 3000.
  // If nothing is running, Playwright starts `npm run dev` automatically.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
