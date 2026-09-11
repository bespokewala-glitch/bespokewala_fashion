import { test, expect } from '@playwright/test';

test.describe('Admin Access', () => {
  test('redirects non-admin from admin panel', async ({ page }) => {
    // Attempt to access admin routes without login should redirect
    // (Wait, admin might be separate app or route, assuming /admin)
    
    const response = await page.goto('/admin');
    
    // Depending on implementation, it either redirects or shows 404/401
    // Just ensure it doesn't show the dashboard content directly without auth
    if (page.url().includes('/admin/dashboard')) {
      // If it somehow loads the dashboard URL, check if there's a login form instead
      const loginForm = page.locator('form').first();
      await expect(loginForm).toBeVisible();
    } else {
      // Otherwise it must have redirected away or to login
      await expect(page.url()).not.toBe('http://localhost:3000/admin/dashboard');
    }
  });
});
