import { test, expect } from '@playwright/test';

test.describe('Wishlist', () => {
  test('user can view wishlist page', async ({ page }) => {
    await page.goto('/wishlist');
    
    // Title should be wishlist
    await expect(page).toHaveTitle(/Wishlist/i);
    
    // Expect empty state or login prompt
    await expect(page.locator('main')).toBeVisible();
  });
});
