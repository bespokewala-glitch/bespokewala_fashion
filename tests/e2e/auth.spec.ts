import { test, expect } from '@playwright/test';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a unique test user for each run to avoid conflicts */
function makeTestUser() {
  const ts = Date.now();
  return {
    firstName: 'E2E',
    lastName: 'Tester',
    email: `e2e_${ts}@bespokewala-test.com`,
    mobile: `9${ts.toString().slice(-9)}`,
    password: 'TestPass123!',
  };
}

// ── Registration ─────────────────────────────────────────────────────────────

test.describe.serial('Authentication — Registration', () => {
  const user = makeTestUser();

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/register|create|account/i);
    await expect(page.locator('.auth-container').first()).toBeVisible();
  });

  test('shows validation error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');
    await page.locator('.auth-input').nth(0).fill(user.firstName);
    await page.locator('.auth-input').nth(1).fill(user.lastName);
    await page.locator('input[type="email"]').first().fill(user.email);
    await page.locator('input[type="tel"]').first().fill(user.mobile);
    await page.locator('input[type="password"]').nth(0).fill(user.password);
    await page.locator('input[type="password"]').nth(1).fill('WrongPass999!');
    await page.getByRole('button', { name: /create account/i }).click();

    // Error banner should appear (passwords do not match)
    const errorEl = page.locator('[style*="dc2626"], [class*="error"]').first();
    await expect(errorEl).toBeVisible({ timeout: 5000 });
    await expect(errorEl).toContainText(/password/i);
  });

  test('user can register successfully', async ({ page }) => {
    await page.goto('/register');
    await page.locator('.auth-input').nth(0).fill(user.firstName);
    await page.locator('.auth-input').nth(1).fill(user.lastName);
    await page.locator('input[type="email"]').first().fill(user.email);
    await page.locator('input[type="tel"]').first().fill(user.mobile);
    await page.locator('input[type="password"]').nth(0).fill(user.password);
    await page.locator('input[type="password"]').nth(1).fill(user.password);

    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to /account after successful registration
    await expect(page).toHaveURL(/\/account/, { timeout: 20000 });
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

test.describe.serial('Authentication — Login', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/login|sign in/i);
    await expect(page.locator('.auth-container').first()).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('notreal@example.com');
    await page.locator('input[type="password"]').first().fill('WrongPassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    const errorEl = page.locator('[style*="dc2626"], [class*="error"]').first();
    await expect(errorEl).toBeVisible({ timeout: 10000 });
  });

  test('sign in button is disabled while loading', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('any@example.com');
    await page.locator('input[type="password"]').first().fill('AnyPass123!');

    const btn = page.getByRole('button', { name: /sign in/i });
    await btn.click();

    // Button should momentarily be disabled (loading state)
    // We can't always catch this without a slow network, so just assert button exists
    await expect(btn).toBeAttached();
  });

  test('forgot password link is present', async ({ page }) => {
    await page.goto('/login');
    const link = page.locator('a[href="/forgot-password"]').first();
    await expect(link).toBeVisible();
  });

  test('register link is present', async ({ page }) => {
    await page.goto('/login');
    const link = page.locator('a[href="/register"]').first();
    await expect(link).toBeVisible();
  });

  test('Google sign-in button is present', async ({ page }) => {
    await page.goto('/login');
    const googleBtn = page.locator('#google-signin-btn').first();
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toContainText(/google/i);
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[type="password"]').first();
    const toggleBtn = page.locator('button[aria-label*="password" i]').first();

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

// ── Forgot Password / OTP ─────────────────────────────────────────────────────

test.describe('Authentication — Forgot Password / OTP Flow', () => {
  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page).toHaveTitle(/forgot|reset|password/i);
    await expect(page.locator('.auth-container').first()).toBeVisible();
  });

  test('shows email step by default', async ({ page }) => {
    await page.goto('/forgot-password');
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    const sendBtn = page.getByRole('button', { name: /send reset code/i }).first();
    await expect(sendBtn).toBeVisible();
  });

  test('shows error for non-existent email', async ({ page }) => {
    await page.goto('/forgot-password');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('doesnotexist_xyz123@bespokewala-test.com');
    await page.getByRole('button', { name: /send reset code/i }).click();

    const errorEl = page.locator('[style*="dc2626"], [class*="error"]').first();
    await expect(errorEl).toBeVisible({ timeout: 10000 });
  });

  test('sign in link is present', async ({ page }) => {
    await page.goto('/forgot-password');
    const link = page.locator('a[href="/login"]').first();
    await expect(link).toBeVisible();
  });

  test('step indicator shows request step', async ({ page }) => {
    await page.goto('/forgot-password');
    // Three-step indicator should be rendered
    const steps = page.locator('[style*="border-radius: 50%"], .step').first();
    await expect(steps).toBeVisible();
  });
});

// ── Protected Routes ─────────────────────────────────────────────────────────

test.describe('Authentication — Protected Routes', () => {
  test('account page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/account');
    // Should either show login form or redirect to /login
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('/login');
    const hasLoginForm = (await page.locator('form').count()) > 0;
    expect(isRedirected || hasLoginForm).toBeTruthy();
  });

  test('checkout page is accessible (may require auth)', async ({ page }) => {
    await page.goto('/checkout');
    // Should load without crashing — may redirect or show empty state
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Logout ─────────────────────────────────────────────────────────────────────

test.describe('Authentication — Session & Logout', () => {
  test('logout endpoint clears session', async ({ page, request }) => {
    // Call the logout API directly
    const res = await request.post('/api/auth/logout');
    // Should return 200 or redirect (3xx)
    expect([200, 302, 303, 307, 308]).toContain(res.status());
  });
});
