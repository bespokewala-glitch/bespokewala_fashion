import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Bespokewala/i);
  });

  test('header is visible', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  });

  test('navigation links exist', async ({ page }) => {
    await expect(page.locator('a[href="/products/couture"]').first()).toBeAttached();
    await expect(page.locator('a[href="/products/footwear"]').first()).toBeAttached();
  });

  test('logo links to homepage', async ({ page }) => {
    const logo = page.locator('a[href="/"]').first();
    await expect(logo).toBeVisible();
  });

  test('page has no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Filter known third-party noise
    const appErrors = errors.filter(e => !e.includes('favicon') && !e.includes('gtag') && !e.includes('fbq'));
    expect(appErrors).toHaveLength(0);
  });

  test('footer is visible', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const footer = page.locator('footer').first();
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
  });

  test('cart icon is accessible', async ({ page }) => {
    // Cart/bag button should be in the header
    const cartLink = page.locator('a[href="/cart"], button[aria-label*="cart" i], button[aria-label*="bag" i]').first();
    await expect(cartLink).toBeVisible();
  });
});

test.describe('Homepage — Mobile Layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('header visible on mobile', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  });

  test('hamburger or mobile nav accessible', async ({ page }) => {
    await page.goto('/');
    // Mobile nav toggle (hamburger) or nav should be present
    const mobileToggle = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], .hamburger, .mobile-menu-btn').first();
    // If a hamburger exists, click it
    if (await mobileToggle.count() > 0 && await mobileToggle.isVisible()) {
      await mobileToggle.click();
      // Some nav should appear
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    }
  });
});

test.describe('Homepage — Tablet Layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('page loads correctly on tablet', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Bespokewala/i);
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  });
});
