import { test, expect } from '@playwright/test';

test.describe.serial('Authentication Flow', () => {
  let testEmail: string;
  let testPhone: string;
  const testPassword = 'TestPassword123!';

  test.beforeAll(() => {
    const ts = Date.now();
    testEmail = `testuser_${ts}@example.com`;
    testPhone = `99${ts.toString().slice(-8)}`;
  });

  test('user can register successfully', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.locator('.auth-input').nth(0).fill('E2E');
    await page.locator('.auth-input').nth(1).fill('TestUser');
    await page.locator('.auth-input').nth(2).fill(testEmail);
    await page.locator('.auth-input').nth(3).fill(testPhone);
    await page.locator('input[type="password"]').first().fill(testPassword);
    await page.locator('input[type="password"]').nth(1).fill(testPassword);
    
    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Check for success message or redirect to account/home
    await expect(page).toHaveURL(/.*(\/|\/account)$/, { timeout: 15000 });
  });

  test('user can login successfully', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.locator('input[type="text"]').first().fill(testEmail);
    await page.locator('input[type="password"]').first().fill(testPassword);
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for success message or redirect
    await expect(page).toHaveURL(/.*(\/|\/account)$/, { timeout: 15000 });
  });
});
