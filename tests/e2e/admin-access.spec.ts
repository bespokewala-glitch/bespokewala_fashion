import { test, expect } from '@playwright/test';

// ── Admin Access Control ──────────────────────────────────────────────────────

test.describe('Admin — Access Control', () => {
  test('unauthenticated user is redirected away from /admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    // Should redirect to login or show a login form — never the raw dashboard
    const url = page.url();
    const hasPasswordField = (await page.locator('input[type="password"]').count()) > 0;
    const notOnDashboard = !url.includes('/admin/dashboard');
    expect(notOnDashboard || hasPasswordField).toBeTruthy();
  });

  test('dashboard route without session redirects to login', async ({ page }) => {
    await page.goto('/dashboard/campaigns');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    const redirectedToLogin = url.includes('/login');
    const hasLoginForm = (await page.locator('form input[type="password"]').count()) > 0;
    expect(redirectedToLogin || hasLoginForm).toBeTruthy();
  });

  test('products admin route requires auth', async ({ page }) => {
    await page.goto('/dashboard/products');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    // Should NOT remain on dashboard/products without auth
    expect(url).not.toContain('/dashboard/products');
  });

  test('orders admin route requires auth', async ({ page }) => {
    await page.goto('/dashboard/orders');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    expect(url).not.toContain('/dashboard/orders');
  });
});

// ── API Security ──────────────────────────────────────────────────────────────

test.describe('Admin — API Security', () => {
  test('GET /api/admin/orders requires admin auth', async ({ request }) => {
    const res = await request.get('/api/admin/orders');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/admin/users requires admin auth', async ({ request }) => {
    const res = await request.get('/api/admin/users');
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/products (admin-only mutation) requires admin auth', async ({ request }) => {
    // Product creation uses requireAdmin — unauthenticated → 401
    const res = await request.post('/api/products', {
      data: { name: 'Injected Product', price: 0 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('DELETE /api/products/[id] requires admin auth', async ({ request }) => {
    const res = await request.delete('/api/products/000000000000000000000001');
    // 401 no auth, 403 forbidden, or 404 if route handles non-admin as 404
    expect([401, 403, 404]).toContain(res.status());
  });

  test('PATCH /api/admin/orders/[id] requires admin auth', async ({ request }) => {
    const res = await request.patch('/api/admin/orders/000000000000000000000001', {
      data: { status: 'shipped' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 401, 403]).toContain(res.status());
  });
});

// ── Error Response Safety ─────────────────────────────────────────────────────

test.describe('Admin — Error Response Safety', () => {
  test('API errors do not leak stack traces or secrets', async ({ request }) => {
    const res = await request.post('/api/products', {
      data: {},
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token-xyz',
      },
    });
    const body = await res.text();
    expect(body).not.toContain('at Object.');
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('MONGODB_URI');
    expect(body).not.toContain('process.env');
  });

  test('404 route returns branded page with content', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz-123');
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(20);
    expect(bodyText).toMatch(/not found|404|page|bespokewala/i);
  });
});

// ── Public Assets ─────────────────────────────────────────────────────────────

test.describe('Admin — Content & Public Assets', () => {
  test('sitemap.xml is accessible and valid', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<urlset');
  });

  test('robots.txt is accessible', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.toLowerCase()).toContain('user-agent');
  });
});
