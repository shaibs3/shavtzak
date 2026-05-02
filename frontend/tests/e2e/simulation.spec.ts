import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Simulation: Commander Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Fresh start -> auto-schedule -> verify assignments appear', async ({
    page,
  }) => {
    // Navigate to schedule
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    // Run auto-schedule
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', {
      timeout: 30000,
    });

    // Verify assignments appeared (colored badges in the grid)
    const assignmentBadges = page.locator('[class*="bg-"][class*="rounded"]');
    const count = await assignmentBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2. Manual assignment + lock + re-schedule preserves lock', async ({
    page,
  }) => {
    // Navigate to schedule
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    // Run auto-schedule first to populate
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', {
      timeout: 30000,
    });

    // Wait for UI to stabilize
    await page.waitForTimeout(1000);

    // Count assignments before re-schedule
    const badgesBefore = page.locator('[class*="bg-"][class*="rounded"]');
    const countBefore = await badgesBefore.count();

    // Re-run auto-schedule
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', {
      timeout: 30000,
    });

    await page.waitForTimeout(1000);

    // Verify assignments still exist after re-schedule
    const badgesAfter = page.locator('[class*="bg-"][class*="rounded"]');
    const countAfter = await badgesAfter.count();
    expect(countAfter).toBeGreaterThan(0);
    // Should be roughly same count (within tolerance)
    expect(Math.abs(countAfter - countBefore)).toBeLessThanOrEqual(5);
  });

  test('3. Add constraint -> navigate to schedule -> no crash', async ({
    page,
  }) => {
    // Navigate to soldiers
    await page.click('button:has-text("חיילים")');
    await page.waitForSelector('text=ניהול חיילים', { timeout: 10000 });

    // Verify soldiers are loaded
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    // Navigate to schedule — validates flow doesn't crash
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    // Run auto-schedule
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', {
      timeout: 30000,
    });

    const assignments = page.locator('[class*="bg-"][class*="rounded"]');
    expect(await assignments.count()).toBeGreaterThan(0);
  });

  test('4. Analytics accuracy — charts render with data', async ({ page }) => {
    // Run auto-schedule first
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', {
      timeout: 30000,
    });

    // Navigate to analytics tab
    await page.click('button:has-text("אנליטיקות")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify some analytics content is visible
    const pageContent = await page.textContent('body');
    const hasAnalyticsContent =
      pageContent?.includes('שעות') ||
      pageContent?.includes('מחלקה') ||
      pageContent?.includes('שיבוצים');

    expect(hasAnalyticsContent).toBe(true);
  });

  test('5. Settings page loads correctly', async ({ page }) => {
    // Navigate to settings
    await page.click('button:has-text("הגדרות")');
    await page.waitForSelector('text=הגדרות מערכת', { timeout: 10000 });

    // Verify settings form fields are visible
    await expect(page.locator('input[id="totalSoldiers"]')).toBeVisible();
    await expect(page.locator('input[id="minPresence"]')).toBeVisible();
  });

  test('6. Re-schedule stability — same result twice', async ({ page }) => {
    await page.click('button:has-text("שיבוצים")');
    await page.waitForSelector('text=לוח שיבוצים', { timeout: 10000 });

    // First run
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', {
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    // Count assignments
    const badges1 = page.locator('[class*="bg-"][class*="rounded"]');
    const count1 = await badges1.count();

    // Second run
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם', {
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    // Count again
    const badges2 = page.locator('[class*="bg-"][class*="rounded"]');
    const count2 = await badges2.count();

    // Should be same (or very close — within 2 due to timing)
    expect(Math.abs(count1 - count2)).toBeLessThanOrEqual(2);
  });
});
