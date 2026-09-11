import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  test('redirects to login when accessing account without auth', async ({ page }) => {
    await page.goto('/account');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login(\?.*)?$/);
  });
});
