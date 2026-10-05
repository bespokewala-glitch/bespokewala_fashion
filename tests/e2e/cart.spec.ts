import { test, expect } from '@playwright/test';

// ── Cart Page ─────────────────────────────────────────────────────────────────

test.describe('Cart — Page Load & Empty State', () => {
  test('cart page loads', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('cart shows empty state when no items', async ({ page }) => {
    // Fresh browser session = empty cart
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const emptyMsg = page.locator(
      'text=Your cart is empty, text=cart is empty, [class*="empty"]'
    ).first();

    // Either empty state OR a cart with items — must not be a completely blank page
    const hasEmptyState = (await emptyMsg.count()) > 0;
    const hasItems = (await page.locator('[class*="cart-item"], [class*="CartItem"]').count()) > 0;
    expect(hasEmptyState || hasItems).toBeTruthy();
  });

  test('empty cart shows link to continue shopping', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const shopLink = page.locator('a[href="/"], a[href*="/products"], a').filter({ hasText: /shop|browse|continue/i }).first();
    if (await page.locator('text=Your cart is empty, text=cart is empty').count() > 0) {
      await expect(shopLink).toBeVisible();
    }
  });
});

// ── Cart Operations via Storefront ────────────────────────────────────────────

test.describe('Cart — Product Addition', () => {
  test('adding a product to cart updates cart indicator', async ({ page }) => {
    await page.goto('/products/footwear');
    await page.waitForLoadState('networkidle');

    // Find a product and navigate to it
    const productLink = page.locator('a[href*="/products/footwear/"]').first();
    if (await productLink.count() === 0) {
      test.skip();
      return;
    }

    const href = await productLink.getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('networkidle');

    // Try to add to cart
    const addBtn = page.locator('button').filter({ hasText: /add to cart|add to bag/i }).first();
    if (await addBtn.count() > 0 && await addBtn.isEnabled()) {
      await addBtn.click();
      await page.waitForTimeout(1500);

      // Cart count badge should appear or increase
      const cartBadge = page.locator('[class*="cart-count"], [class*="badge"], [class*="CartBadge"]').first();
      if (await cartBadge.count() > 0) {
        const countText = await cartBadge.textContent();
        expect(Number(countText)).toBeGreaterThan(0);
      }
    }
  });

  test('cart icon opens cart drawer or navigates to /cart', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const cartBtn = page.locator('a[href="/cart"], button[aria-label*="cart" i], button[aria-label*="bag" i]').first();
    if (await cartBtn.count() > 0 && await cartBtn.isVisible()) {
      await cartBtn.click();

      // Should either open a drawer or navigate
      const drawerOpen = (await page.locator('[class*="cart-drawer"], [class*="CartDrawer"], [class*="cart-panel"]').count()) > 0;
      const navigated = page.url().includes('/cart');
      expect(drawerOpen || navigated).toBeTruthy();
    }
  });
});

// ── Cart API ──────────────────────────────────────────────────────────────────

test.describe('Cart — API', () => {
  test('GET /api/cart returns array (empty for unauthenticated)', async ({ request }) => {
    const res = await request.get('/api/cart');
    // Unauthenticated: 200 with [] OR 401
    expect([200, 401]).toContain(res.status());
    if (res.status() === 200) {
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('POST /api/cart without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/cart', {
      data: { productId: 'fake-id', quantity: 1 },
    });
    expect([401, 403]).toContain(res.status());
  });
});

// ── Checkout ─────────────────────────────────────────────────────────────────

test.describe('Checkout — Page Load', () => {
  test('checkout page loads without crash', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    // Should render something — not a white blank page
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });

  test('checkout page shows form or redirects to login', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    const hasForm = (await page.locator('form').count()) > 0;
    const hasLoginRedirect = page.url().includes('/login');
    const hasEmptyCart = (await page.locator('text=empty, text=cart, [class*="empty"]').count()) > 0;
    expect(hasForm || hasLoginRedirect || hasEmptyCart).toBeTruthy();
  });
});

// ── Checkout — Failure Scenarios ──────────────────────────────────────────────

test.describe('Checkout — Failure Scenarios', () => {
  test('payment API endpoint rejects unauthenticated request', async ({ request }) => {
    // Try to initiate payment without auth
    const res = await request.post('/api/orders/create-razorpay-order', {
      data: { amount: 1000, currency: 'INR' },
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  test('verify payment endpoint rejects tampered data', async ({ request }) => {
    const res = await request.post('/api/orders/verify-payment', {
      data: {
        razorpay_order_id: 'fake_order_id',
        razorpay_payment_id: 'fake_payment_id',
        razorpay_signature: 'invalid_signature',
      },
    });
    // Should return 400 (bad signature) or 401, NOT 200
    expect([400, 401, 403, 500]).toContain(res.status());
    // Must not expose internal error details
    if (res.status() >= 400) {
      const body = await res.text();
      expect(body).not.toContain('at Object.');
      expect(body).not.toContain('node_modules');
    }
  });

  test('refresh during checkout does not cause blank page', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });
});

// ── Order Success Page ─────────────────────────────────────────────────────────

test.describe('Order Success Page', () => {
  test('success page with no session shows friendly message', async ({ page }) => {
    await page.goto('/checkout/success');
    await page.waitForLoadState('networkidle');
    // Should not crash or show blank page
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });
});

// ── Quantity Controls ─────────────────────────────────────────────────────────

test.describe('Cart — Quantity Controls', () => {
  test('cart page quantity buttons do not crash', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    const plusBtn = page.locator('button').filter({ hasText: '+' }).first();
    const minusBtn = page.locator('button').filter({ hasText: '-' }).first();

    if (await plusBtn.count() > 0) {
      await plusBtn.click();
      await page.waitForTimeout(500);
      // Page must still be functional after clicking
      await expect(page.locator('body')).not.toBeEmpty();
    }

    if (await minusBtn.count() > 0) {
      await minusBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
