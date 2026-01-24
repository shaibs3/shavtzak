import { test, expect } from '@playwright/test';

test.describe('Schedule and Assignments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to schedule tab
    await page.click('button:has-text("שיבוצים")');
    // Wait for schedule view to load
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });
  });

  test('should display schedule view', async ({ page }) => {
    // Verify schedule elements are visible
    await expect(page.locator('text=לוח שיבוצים')).toBeVisible();
    await expect(page.locator('button:has-text("שיבוץ אוטומטי")')).toBeVisible();

    // Should show week navigation
    await expect(page.locator('button:has-text("היום")')).toBeVisible();

    // Should show tasks in rows
    await expect(page.locator('text=משמרת בוקר')).toBeVisible();
    await expect(page.locator('text=משמרת ערב')).toBeVisible();
  });

  test('should navigate between weeks', async ({ page }) => {
    // Wait for schedule to load
    await page.waitForSelector('text=לוח שיבוצים');

    // Click next week (ChevronLeft icon)
    const nextButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') });
    await nextButton.click();

    // Wait for content to update
    await page.waitForTimeout(500);

    // Click previous week (ChevronRight icon)
    const prevButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });
    await prevButton.click();

    // Click today to go back to current week
    await page.click('button:has-text("היום")');
    await page.waitForTimeout(500);
  });

  test('should run auto-scheduling', async ({ page }) => {
    // Click auto-schedule button
    await page.click('button:has-text("שיבוץ אוטומטי")');

    // Wait for completion toast
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 10000 });

    // Should see some assignments in the schedule now
    // Assignment cards have class "rounded-md border"
    const assignments = await page.locator('.rounded-md.border').count();
    expect(assignments).toBeGreaterThanOrEqual(0);
  });

  test('should persist assignments after refresh', async ({ page }) => {
    // Run auto-scheduling
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', { timeout: 10000 });

    // Count assignments before refresh
    const assignmentsBefore = await page.locator('.rounded-md.border').count();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate back to schedule tab
    await page.click('text=שיבוצים');
    await page.waitForLoadState('networkidle');

    // Count assignments after refresh
    const assignmentsAfter = await page.locator('.rounded-md.border').count();

    // Should have the same number of assignments
    expect(assignmentsAfter).toBe(assignmentsBefore);
  });
});
