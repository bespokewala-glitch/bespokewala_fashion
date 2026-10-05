import { test, expect } from '@playwright/test';

// ── Customer Account ──────────────────────────────────────────────────────────

test.describe('Customer Account', () => {
  test('account page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    const isOnLogin = url.includes('/login');
    const hasLoginForm = (await page.locator('form input[type="password"]').count()) > 0;
    expect(isOnLogin || hasLoginForm).toBeTruthy();
  });

  test('account page login redirect preserves redirect param', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/login')) {
      expect(url).toContain('redirect');
    }
  });
});

// ── Orders ─────────────────────────────────────────────────────────────────────

test.describe('Orders — API', () => {
  test('GET /api/user/orders requires authentication', async ({ request }) => {
    const res = await request.get('/api/user/orders');
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/orders/create-razorpay-order requires authentication', async ({ request }) => {
    const res = await request.post('/api/orders/create-razorpay-order', {
      data: { amount: 1000, currency: 'INR' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('PATCH /api/admin/orders/[id] requires admin auth', async ({ request }) => {
    const res = await request.patch('/api/admin/orders/000000000000000000000001', {
      data: { status: 'shipped' },
      headers: { 'Content-Type': 'application/json' },
    });
    // 400 = invalid ObjectId format, 401 = no auth, 403 = forbidden
    expect([400, 401, 403]).toContain(res.status());
  });
});

// ── Order Tracking ────────────────────────────────────────────────────────────

test.describe('Order Tracking', () => {
  test('track-order page loads', async ({ page }) => {
    await page.goto('/track-order');
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });

  test('track-order shows a form or message', async ({ page }) => {
    await page.goto('/track-order');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });

  test('GET /api/orders/track returns 400 with no order ID', async ({ request }) => {
    const res = await request.get('/api/orders/track');
    // Should require an order ID — 400 or 404
    expect([400, 404]).toContain(res.status());
  });
});

// ── Wishlist (client-side, no dedicated API) ───────────────────────────────────

test.describe('Wishlist', () => {
  test('wishlist page loads without crash', async ({ page }) => {
    await page.goto('/wishlist');
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });

  test('wishlist page shows items or empty state — not blank', async ({ page }) => {
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const hasItems = (await page.locator('[class*="product-card"], [class*="ProductCard"]').count()) > 0;
    const hasEmpty = (await page.locator('text=empty, text=wishlist, [class*="empty"]').count()) > 0;
    const hasLoginPrompt = page.url().includes('/login') || (await page.locator('text=sign in, text=login').count()) > 0;
    expect(hasItems || hasEmpty || hasLoginPrompt).toBeTruthy();
  });
});
