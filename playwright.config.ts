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
    // Base URL for the running dev server
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Use a fresh browser context (no persistent cookies between tests unless set)
    storageState: undefined,
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

  // Start the Next.js dev server automatically for E2E tests
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
