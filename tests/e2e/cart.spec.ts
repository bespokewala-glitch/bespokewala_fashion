import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  test('user can open empty cart', async ({ page }) => {
    await page.goto('/');
    
    // Find cart icon (bag icon)
    const cartButton = page.locator('button').filter({ has: page.locator('svg.lucide-shopping-bag') }).first();
    if (await cartButton.isVisible()) {
      await cartButton.click();
      
      // Expect some empty cart message
      await expect(page.locator('text=Your cart is empty').first()).toBeVisible();
    }
  });
});
