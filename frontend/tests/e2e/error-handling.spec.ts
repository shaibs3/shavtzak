import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should show error toast when create operation fails', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to soldiers - should load successfully first
    await page.click('button:has-text("חיילים")');
    await page.waitForSelector('text=ניהול חיילים', { timeout: 10000 });
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Now we need to simulate backend failure
    // We'll use route interception to block API calls
    await page.route('http://localhost:3000/api/**', route => {
      route.abort('failed');
    });

    // Try to create a soldier (should fail)
    await page.click('button:has-text("הוסף חייל")');
    await page.waitForSelector('text=הוספת חייל חדש');
    await page.fill('input[id="name"]', 'בדיקה שגיאה');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');
    await page.click('button:has-text("הוסף חייל")');

    // Should show error toast (look for "שגיאה" which appears in all error toasts)
    await expect(page.locator('text=שגיאה')).toBeVisible({ timeout: 10000 });

    // Clean up - unblock API calls
    await page.unroute('http://localhost:3000/api/**');
  });

  test('should handle initial load errors gracefully', async ({ page }) => {
    // Block API calls before page load
    await page.route('http://localhost:3000/api/**', route => {
      route.abort('failed');
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on soldiers tab
    await page.click('button:has-text("חיילים")');

    // Give it time to attempt loading and show error
    await page.waitForTimeout(2000);

    // Should show either error text or retry button
    const hasError = await page.locator('text=שגיאה').isVisible().catch(() => false);
    const hasRetry = await page.locator('button:has-text("נסה שוב")').isVisible().catch(() => false);

    expect(hasError || hasRetry).toBeTruthy();

    // Unblock and retry if retry button exists
    await page.unroute('http://localhost:3000/api/**');

    if (hasRetry) {
      await page.click('button:has-text("נסה שוב")');
      await page.waitForSelector('tbody tr', { timeout: 10000 });
    }
  });

  test('should recover when backend becomes available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to soldiers first (should work)
    await page.click('button:has-text("חיילים")');
    await page.waitForSelector('text=ניהול חיילים', { timeout: 10000 });

    // Block API temporarily
    await page.route('http://localhost:3000/api/**', route => {
      route.abort('failed');
    });

    // Try to create a soldier (will fail)
    await page.click('button:has-text("הוסף חייל")');
    await page.waitForSelector('text=הוספת חייל חדש');
    await page.fill('input[id="name"]', 'בדיקה התאוששות');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.fill('input[id="maxVacation"]', '5');
    await page.fill('input[id="usedVacation"]', '0');
    await page.click('button:has-text("הוסף חייל")');

    // Should show error
    await expect(page.locator('text=שגיאה')).toBeVisible({ timeout: 10000 });

    // Close dialog
    await page.click('button:has-text("ביטול")').catch(() => {
      // Dialog might auto-close on error
    });

    // Unblock API (simulating backend coming back online)
    await page.unroute('http://localhost:3000/api/**');

    // Try again - should work now
    await page.click('button:has-text("הוסף חייל")');
    await page.waitForSelector('text=הוספת חייל חדש');
    await page.fill('input[id="name"]', 'בדיקה הצלחה');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.fill('input[id="maxVacation"]', '5');
    await page.fill('input[id="usedVacation"]', '0');
    await page.click('button:has-text("הוסף חייל")');

    // Should succeed
    await expect(page.locator('text=החייל נוסף בהצלחה')).toBeVisible({ timeout: 10000 });
  });
});
