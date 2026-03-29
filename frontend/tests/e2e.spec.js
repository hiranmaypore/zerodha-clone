import { test, expect } from '@playwright/test';

// Use a unique but consistent user for this run
const timestamp = Date.now();
const TEST_USER = {
  name: 'E2E Tester',
  email: `e2e-${timestamp}@zerodha.clone`,
  password: 'Password123!'
};

test.describe('Trading Platform E2E Flow', () => {
  test.describe.configure({ mode: 'serial' });


  test.beforeEach(async ({ page }) => {
    // Disable tour
    await page.addInitScript(() => {
      window.localStorage.setItem('onboarding_complete', 'true');
    });
  });

  test('Signup Flow', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to Sign Up tab
    const signupTab = page.getByRole('button', { name: 'Sign Up', exact: true });
    await expect(signupTab).toBeVisible();
    await signupTab.click();

    // Fill form using placeholders (since labels aren't linked with id/htmlFor)
    await page.getByPlaceholder('John Doe').fill(TEST_USER.name);
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('••••••••').fill(TEST_USER.password);
    
    // Click submit
    const submitBtn = page.getByRole('button', { name: /Open Demo Account/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 20000 });
    
    // Verify we are on dashboard by checking for the Balance card
    await expect(page.locator('text=Balance').first()).toBeVisible({ timeout: 10000 });
  });

  test('Order Execution Flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('••••••••').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*dashboard/);

    // Wait for any stock to load (TCS or RELIANCE)
    await expect(page.locator('text=Balance').first()).toBeVisible({ timeout: 15000 });

    // Place Order on whatever stock is selected (usually TCS or RELIANCE)
    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill('1'); 

    // Click Buy button - use the exact text from the screenshot
    const buyBtn = page.getByRole('button', { name: /BUY (CNC|MIS|MARKET)/i });
    await expect(buyBtn).toBeVisible();
    await buyBtn.click();

    // Success Toast - search for the success message with flexibility
    await expect(page.locator('text=/order placed!/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('Portfolio Verification Flow', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('••••••••').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*dashboard/);
    
    // Navigate to Portfolio (sidebar link)
    const portfolioLink = page.getByRole('link', { name: 'Portfolio' });
    await expect(portfolioLink).toBeVisible();
    await portfolioLink.click();
    await expect(page).toHaveURL(/.*holdings/);

    // Verify presence of balance card as a proxy for successful page load
    await expect(page.locator('text=Balance').first()).toBeVisible({ timeout: 15000 });
  });
});
