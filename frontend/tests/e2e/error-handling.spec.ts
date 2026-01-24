import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should show error message when backend is unavailable', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Navigate to soldiers - should load successfully first
    await page.click('text=חיילים');
    await page.waitForSelector('tbody tr', { timeout: 5000 });

    // Now we need to simulate backend failure
    // We'll use route interception to block API calls
    await page.route('http://localhost:3000/api/**', route => {
      route.abort('failed');
    });

    // Try to create a soldier (should fail)
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוסף חייל חדש');
    await page.fill('input[name="name"]', 'בדיקה שגיאה');
    await page.fill('input[name="rank"]', 'טוראי');
    await page.fill('input[name="maxVacationDays"]', '7');
    await page.fill('input[name="usedVacationDays"]', '0');
    await page.check('input[value="soldier"]');
    await page.click('button:has-text("שמור")');

    // Should show error toast
    await page.waitForSelector('text=שגיאה', { timeout: 5000 });

    // Clean up - unblock API calls
    await page.unroute('http://localhost:3000/api/**');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block API calls before page load
    await page.route('http://localhost:3000/api/**', route => {
      route.abort('failed');
    });

    await page.goto('/');

    // Click on soldiers tab
    await page.click('text=חיילים');

    // Should show error state with retry button
    await expect(page.locator('text=שגיאה בטעינת החיילים')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("נסה שוב")')).toBeVisible();

    // Unblock and retry
    await page.unroute('http://localhost:3000/api/**');
    await page.click('button:has-text("נסה שוב")');

    // Should load successfully now
    await page.waitForSelector('tbody tr', { timeout: 5000 });
  });

  test('should recover when backend becomes available', async ({ page }) => {
    await page.goto('/');

    // Block API temporarily
    await page.route('http://localhost:3000/api/**', route => {
      route.abort('failed');
    });

    // Try to load soldiers
    await page.click('text=חיילים');
    await page.waitForSelector('text=שגיאה בטעינת החיילים', { timeout: 5000 });

    // Unblock API (simulating backend coming back online)
    await page.unroute('http://localhost:3000/api/**');

    // Click retry
    await page.click('button:has-text("נסה שוב")');

    // Should load successfully
    await page.waitForSelector('tbody tr', { timeout: 5000 });
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });
});
