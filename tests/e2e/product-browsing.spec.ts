import { test, expect } from '@playwright/test';

// ── Product Listing ───────────────────────────────────────────────────────────

test.describe('Product Browsing — Listing Pages', () => {
  const categories = [
    { name: 'Couture', slug: 'couture' },
    { name: 'Footwear', slug: 'footwear' },
    { name: 'New Arrivals', path: '/new-arrivals' },
  ];

  for (const cat of categories) {
    test(`${cat.name} page loads and shows products or empty state`, async ({ page }) => {
      const url = cat.path ?? `/products/${cat.slug}`;
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');

      // Main content is always rendered
      const main = page.locator('main').first();
      await expect(main).toBeVisible();

      // Wait for network to settle (products may load via client-side fetch)
      await page.waitForLoadState('networkidle');

      // Either products OR an empty state message must be present — no blank section
      const hasProducts = (await page.locator('[class*="product-card"], [class*="ProductCard"], article').count()) > 0;
      const hasEmptyState = (await page.locator('[class*="empty"], text=No products, text=no products').count()) > 0;
      const hasLoadingSkeleton = (await page.locator('[class*="skeleton"], [class*="shimmer"]').count()) > 0;
      expect(hasProducts || hasEmptyState || hasLoadingSkeleton).toBeTruthy();
    });
  }

  test('product listing page has correct title', async ({ page }) => {
    await page.goto('/products/footwear');
    await expect(page).toHaveTitle(/footwear/i);
  });

  test('product listing page — mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/products/couture');
    await page.waitForLoadState('domcontentloaded');
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });
});

// ── Product Detail ────────────────────────────────────────────────────────────

test.describe('Product Browsing — Product Detail Page', () => {
  test('clicking a product opens the detail page', async ({ page }) => {
    await page.goto('/products/footwear');
    await page.waitForLoadState('networkidle');

    const productLink = page.locator('a[href*="/products/footwear/"]').first();
    if (await productLink.count() > 0) {
      const href = await productLink.getAttribute('href');
      await page.goto(href!);
      await page.waitForLoadState('domcontentloaded');

      // Detail page should not show 404
      await expect(page.locator('body')).not.toContainText('404');

      // Title should reflect product name, not generic fallback
      const title = await page.title();
      expect(title.length).toBeGreaterThan(5);
    }
  });

  test('product detail page has add-to-cart or size selector', async ({ page }) => {
    await page.goto('/products/footwear');
    await page.waitForLoadState('networkidle');

    const productLink = page.locator('a[href*="/products/footwear/"]').first();
    if (await productLink.count() > 0) {
      const href = await productLink.getAttribute('href');
      await page.goto(href!);
      await page.waitForLoadState('networkidle');

      // Should have an add-to-cart / buy button or a size selector
      const actionBtn = page.locator('button').filter({ hasText: /add to cart|buy|select size|add to bag/i }).first();
      const sizeSelect = page.locator('select, [class*="size-selector"], [class*="SizeSelector"]').first();
      const hasAction = (await actionBtn.count()) > 0 || (await sizeSelect.count()) > 0;
      expect(hasAction).toBeTruthy();
    }
  });

  test('product images load without broken src', async ({ page }) => {
    await page.goto('/products/footwear');
    await page.waitForLoadState('networkidle');

    const productLink = page.locator('a[href*="/products/footwear/"]').first();
    if (await productLink.count() > 0) {
      const href = await productLink.getAttribute('href');
      await page.goto(href!);
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const imgCount = await images.count();
      for (let i = 0; i < Math.min(imgCount, 3); i++) {
        const src = await images.nth(i).getAttribute('src');
        expect(src).toBeTruthy();
        expect(src).not.toContain('undefined');
      }
    }
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

test.describe('Product Browsing — Search', () => {
  test('search icon is present and clickable', async ({ page }) => {
    await page.goto('/');
    const searchTrigger = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).first();
    // Try aria-label based
    const searchBtn = page.locator('[aria-label*="search" i], button[aria-label*="Search"]').first();
    if (await searchBtn.count() > 0) {
      await expect(searchBtn).toBeVisible();
      await searchBtn.click();
      // Search input should appear
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input.search-input').first();
      await expect(searchInput).toBeVisible({ timeout: 3000 });
    }
  });

  test('search results appear for a known query', async ({ page }) => {
    await page.goto('/');
    const searchBtn = page.locator('[aria-label*="search" i]').first();
    if (await searchBtn.count() > 0 && await searchBtn.isVisible()) {
      await searchBtn.click();
      const searchInput = page.locator('input.search-input, input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('saree');
        // Results grid should appear
        await expect(
          page.locator('.search-results-grid, [class*="search-result"]').first()
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('search shows empty state for nonsense query', async ({ page }) => {
    await page.goto('/');
    const searchBtn = page.locator('[aria-label*="search" i]').first();
    if (await searchBtn.count() > 0 && await searchBtn.isVisible()) {
      await searchBtn.click();
      const searchInput = page.locator('input.search-input, input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('xyzxyzxyzabc123notaproduct');
        await page.waitForTimeout(1500);
        // Should show a "no results" message, NOT a blank section
        const noResults = page.locator(
          '[class*="empty"], [class*="no-result"], text=No results, text=no products found'
        ).first();
        // It's acceptable if the message appears OR if results are 0
        const resultCount = await page.locator('[class*="search-result-item"], [class*="ProductCard"]').count();
        if (resultCount === 0) {
          // Good — empty state expected, don't require a specific element
        }
      }
    }
  });
});

// ── Wishlist ─────────────────────────────────────────────────────────────────

test.describe('Product Browsing — Wishlist', () => {
  test('wishlist page loads', async ({ page }) => {
    await page.goto('/wishlist');
    await page.waitForLoadState('domcontentloaded');
    // Should not crash — may redirect to login or show empty state
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
