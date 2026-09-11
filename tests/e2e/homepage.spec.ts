import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Bespokewala/i);
    
    // Check if the header is visible
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    
    // Check for standard navigation links
    await expect(page.locator('a[href="/products/couture"]').first()).toBeAttached();
    await expect(page.locator('a[href="/products/footwear"]').first()).toBeAttached();
  });
});
