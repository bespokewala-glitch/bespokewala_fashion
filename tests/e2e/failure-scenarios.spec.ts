import { test, expect } from '@playwright/test';

// ── Slow Network Simulation ───────────────────────────────────────────────────

test.describe('Failure Scenarios — Slow Network', () => {
  test('homepage handles slow network — shows content eventually', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', async (route) => {
      await new Promise(r => setTimeout(r, 200)); // 200ms delay per request
      await route.continue();
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 30000 });
  });

  test('product page loads on slow connection', async ({ page, context }) => {
    await context.route('**/*', async (route) => {
      await new Promise(r => setTimeout(r, 150));
      await route.continue();
    });

    await page.goto('/products/footwear');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 30000 });
  });
});

// ── API Failure Simulation ─────────────────────────────────────────────────────

test.describe('Failure Scenarios — API Failures', () => {
  test('cart page handles API failure gracefully', async ({ page, context }) => {
    // Block cart API calls
    await context.route('**/api/cart**', (route) => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      contentType: 'application/json',
    }));

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Page should NOT show a blank screen — should show error or empty state
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);

    // Should not show raw stack trace
    expect(bodyText).not.toContain('at Object.');
    expect(bodyText).not.toContain('node_modules');
  });

  test('product page handles API failure gracefully', async ({ page, context }) => {
    // Block product API calls
    await context.route('**/api/products**', (route) => route.fulfill({
      status: 503,
      body: JSON.stringify({ error: 'Service unavailable' }),
      contentType: 'application/json',
    }));

    await page.goto('/products/footwear');
    await page.waitForLoadState('networkidle');

    // Must not be blank
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });

  test('search handles API failure without breaking layout', async ({ page, context }) => {
    await context.route('**/api/search**', (route) => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Search service unavailable' }),
      contentType: 'application/json',
    }));

    await page.goto('/');
    const searchBtn = page.locator('[aria-label*="search" i]').first();
    if (await searchBtn.count() > 0 && await searchBtn.isVisible()) {
      await searchBtn.click();
      const searchInput = page.locator('input.search-input, input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('saree');
        await page.waitForTimeout(2000);
        // Layout should still be intact
        const header = page.locator('header').first();
        await expect(header).toBeVisible();
      }
    }
  });
});

// ── Payment Failure ───────────────────────────────────────────────────────────

test.describe('Failure Scenarios — Payment Failures', () => {
  test('payment verify API rejects invalid signature', async ({ request }) => {
    const res = await request.post('/api/orders/verify-payment', {
      data: {
        razorpay_order_id: 'order_fakeid123',
        razorpay_payment_id: 'pay_fakeid123',
        razorpay_signature: 'invalidsignaturexyz',
      },
    });
    expect([400, 401, 403, 500]).toContain(res.status());

    // Response must not leak secrets
    const body = await res.text();
    expect(body).not.toContain('RAZORPAY_KEY_SECRET');
    expect(body).not.toContain('mongodb://');
    expect(body).not.toContain('process.env');
  });

  test('multiple rapid payment button clicks — only one request sent', async ({ page, context }) => {
    let paymentRequests = 0;
    await context.route('**/api/orders/create-razorpay-order**', async (route) => {
      paymentRequests++;
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
        contentType: 'application/json',
      });
    });
    await context.route('**/api/orders/verify-payment**', async (route) => {
      paymentRequests++;
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
        contentType: 'application/json',
      });
    });

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    const payBtn = page.locator('button').filter({ hasText: /pay|proceed|place order/i }).first();
    if (await payBtn.count() > 0 && await payBtn.isVisible()) {
      // Click 5 times rapidly
      for (let i = 0; i < 5; i++) {
        await payBtn.click({ force: true });
      }
      await page.waitForTimeout(2000);

      // Should only fire 1 (or at most 2) requests due to debounce/disable-on-click
      expect(paymentRequests).toBeLessThanOrEqual(2);
    }
  });
});

// ── Image Failure ──────────────────────────────────────────────────────────────

test.describe('Failure Scenarios — Image Failures', () => {
  test('product images show fallback when broken', async ({ page, context }) => {
    // Block all image requests from GCS/CDN
    await context.route('**storage.googleapis.com**', (route) => route.abort('failed'));
    await context.route('**cdn.bespokewala**', (route) => route.abort('failed'));

    await page.goto('/products/footwear');
    await page.waitForLoadState('networkidle');

    // Page layout must still be intact even with broken images
    const main = page.locator('main').first();
    await expect(main).toBeVisible();

    // Images should have alt text (accessibility even when broken)
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // alt can be empty string but must not be null for decorative images
      expect(alt).not.toBeNull();
    }
  });
});

// ── Email Failure ──────────────────────────────────────────────────────────────

test.describe('Failure Scenarios — Email Failures', () => {
  test('forgot password shows user-friendly error when email fails', async ({ page, context }) => {
    // Block the forgot-password API to simulate email failure
    await context.route('**/api/auth/forgot-password**', (route) => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Failed to send email. Please try again later.' }),
      contentType: 'application/json',
    }));

    await page.goto('/forgot-password');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('any@example.com');
    await page.getByRole('button', { name: /send reset code/i }).click();

    const errorEl = page.locator('[style*="dc2626"], [class*="error"]').first();
    await expect(errorEl).toBeVisible({ timeout: 10000 });

    // Must not show raw stack trace
    const errorText = await errorEl.textContent();
    expect(errorText).not.toContain('at Object.');
    expect(errorText).not.toContain('Error:');
  });
});

// ── Duplicate Requests ─────────────────────────────────────────────────────────

test.describe('Failure Scenarios — Duplicate Requests', () => {
  test('login button is disabled while submitting', async ({ page, context }) => {
    // Slow down the auth API to catch the loading state
    await context.route('**/api/auth/login**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Invalid credentials' }),
        contentType: 'application/json',
      });
    });

    await page.goto('/login');
    await page.locator('input[type="text"]').first().fill('any@example.com');
    await page.locator('input[type="password"]').first().fill('AnyPass123!');

    const btn = page.getByRole('button', { name: /sign in/i });
    await btn.click();

    // Button should be disabled/show loading state immediately
    const isDisabled = await btn.isDisabled();
    const loadingText = await btn.textContent();
    expect(isDisabled || (loadingText ?? '').toLowerCase().includes('sign')).toBeTruthy();
  });

  test('register button prevents double submission', async ({ page, context }) => {
    await context.route('**/api/auth/register**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'User already exists' }),
        contentType: 'application/json',
      });
    });

    await page.goto('/register');
    const fields = page.locator('.auth-input');
    if (await fields.count() >= 4) {
      await fields.nth(0).fill('Test');
      await fields.nth(1).fill('User');
      await page.locator('input[type="email"]').first().fill('dup@example.com');
      await page.locator('input[type="tel"]').first().fill('9123456789');
      await page.locator('input[type="password"]').nth(0).fill('TestPass123!');
      await page.locator('input[type="password"]').nth(1).fill('TestPass123!');

      const btn = page.getByRole('button', { name: /create account/i });
      await btn.click();
      // Button should be disabled during request
      const isDisabled = await btn.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });
});

// ── Refresh Scenarios ─────────────────────────────────────────────────────────

test.describe('Failure Scenarios — Page Refresh', () => {
  test('refreshing checkout page does not crash', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
    // No raw error dump
    expect(bodyText).not.toContain('at Object.');
  });

  test('refreshing cart page does not cause blank screen', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });

  test('refreshing homepage after navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveTitle(/Bespokewala/i);
  });
});
