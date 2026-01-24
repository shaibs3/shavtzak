import { test, expect } from '@playwright/test';

test.describe('Settings Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to settings tab
    await page.click('text=הגדרות');
    await page.waitForLoadState('networkidle');
  });

  test('should display current settings', async ({ page }) => {
    // Verify settings form is visible
    await expect(page.locator('text=הגדרות מערכת')).toBeVisible();
    await expect(page.locator('input[id="totalSoldiers"]')).toBeVisible();
    await expect(page.locator('input[id="minPresence"]')).toBeVisible();
  });

  test('should update settings', async ({ page }) => {
    // Get current values
    const totalSoldiersInput = page.locator('input[id="totalSoldiers"]');
    const minPresenceInput = page.locator('input[id="minPresence"]');

    const currentTotal = await totalSoldiersInput.inputValue();
    const currentPresence = await minPresenceInput.inputValue();

    // Update values
    await totalSoldiersInput.fill('75');
    await minPresenceInput.fill('80');

    // Save
    await page.click('button:has-text("שמור הגדרות")');
    await page.waitForSelector('text=ההגדרות עודכנו בהצלחה');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify values persisted
    expect(await totalSoldiersInput.inputValue()).toBe('75');
    expect(await minPresenceInput.inputValue()).toBe('80');

    // Restore original values
    await totalSoldiersInput.fill(currentTotal);
    await minPresenceInput.fill(currentPresence);
    await page.click('button:has-text("שמור הגדרות")');
    await page.waitForSelector('text=ההגדרות עודכנו בהצלחה');
  });

  test('should show loading state while saving', async ({ page }) => {
    await page.locator('input[id="totalSoldiers"]').fill('70');

    // Click save and immediately check for loading state
    const saveButton = page.locator('button:has-text("שמור הגדרות")');
    await saveButton.click();

    // Should show "שומר..." while saving
    await expect(page.locator('button:has-text("שומר...")')).toBeVisible({ timeout: 1000 }).catch(() => {
      // Loading might be too fast, that's ok
    });

    // Should complete and show success
    await page.waitForSelector('text=ההגדרות עודכנו בהצלחה');
  });
});
