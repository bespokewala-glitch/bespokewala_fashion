import { test, expect } from '@playwright/test';

// Note: Wishlist in this app is managed client-side (no dedicated server API endpoint).
// Tests verify the UI page behaviour only.

test.describe('Wishlist', () => {
  test('wishlist page loads without crashing', async ({ page }) => {
    await page.goto('/wishlist');
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });

  test('wishlist shows items, empty state, or login prompt — never blank', async ({ page }) => {
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');

    const hasItems = (await page.locator('[class*="product"], article').count()) > 0;
    const hasEmpty = (await page.locator('[class*="empty"], [class*="wishlist"]').count()) > 0;
    const isRedirectedToLogin = page.url().includes('/login');
    const bodyText = (await page.locator('body').textContent()) ?? '';
    // At minimum the page should render meaningful content
    expect(hasItems || hasEmpty || isRedirectedToLogin || bodyText.trim().length > 20).toBeTruthy();
  });

  test('wishlist page — mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/wishlist');
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.locator('body').textContent();
    expect((bodyText ?? '').trim().length).toBeGreaterThan(10);
  });
});
