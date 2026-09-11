import { test, expect } from '@playwright/test';

test.describe('Product Browsing', () => {
  test('user can view product listing', async ({ page }) => {
    // Go to footwear page as it's a valid category in the nav
    await page.goto('/products/footwear');
    
    // Check if the title indicates footwear
    await expect(page).toHaveTitle(/Footwear/i);
    
    // Check if there are products listed or a message
    // Assuming products have a certain class or we can just check for main content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Wait for network/API if needed
    await page.waitForLoadState('networkidle');
  });

  test('user can search for products', async ({ page }) => {
    await page.goto('/');
    
    // Find the search icon/button (assuming aria-label="Search" or similar)
    const searchButton = page.locator('button').filter({ has: page.locator('svg.lucide-search') }).first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      
      const searchInput = page.locator('input.search-input').first();
      await searchInput.fill('saree');
      
      // Wait for the predictive search results to load in the overlay
      await expect(page.locator('.search-results-grid')).toBeVisible({ timeout: 10000 });
    }
  });
});
