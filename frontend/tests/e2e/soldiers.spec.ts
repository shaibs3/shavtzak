import { test, expect } from '@playwright/test';

test.describe('Soldiers CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to soldiers tab
    await page.click('text=חיילים');
    await page.waitForLoadState('networkidle');
  });

  test('should display 70 soldiers initially', async ({ page }) => {
    // Wait for soldiers to load
    await page.waitForSelector('tbody tr', { timeout: 5000 });

    // Count soldier rows
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(70);
  });

  test('should create a new soldier', async ({ page }) => {
    // Click add soldier button
    await page.click('text=הוסף חייל');

    // Wait for form to appear
    await page.waitForSelector('text=הוסף חייל חדש');

    // Fill in the form
    await page.fill('input[name="name"]', 'בדיקה טסט');
    await page.fill('input[name="rank"]', 'טוראי');
    await page.fill('input[name="maxVacationDays"]', '7');
    await page.fill('input[name="usedVacationDays"]', '0');

    // Select a role (soldier)
    await page.check('input[value="soldier"]');

    // Submit form
    await page.click('button:has-text("שמור")');

    // Wait for toast notification
    await page.waitForSelector('text=החייל נוסף בהצלחה', { timeout: 5000 });

    // Verify soldier appears in list
    await expect(page.locator('text=בדיקה טסט')).toBeVisible();

    // Count should now be 71
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(71);
  });

  test('should update an existing soldier', async ({ page }) => {
    // First create a soldier
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוסף חייל חדש');
    await page.fill('input[name="name"]', 'בדיקה טסט');
    await page.fill('input[name="rank"]', 'טוראי');
    await page.fill('input[name="maxVacationDays"]', '7');
    await page.fill('input[name="usedVacationDays"]', '0');
    await page.check('input[value="soldier"]');
    await page.click('button:has-text("שמור")');
    await page.waitForSelector('text=החייל נוסף בהצלחה');

    // Find and click edit button for the test soldier
    const row = page.locator('tr:has-text("בדיקה טסט")');
    await row.locator('button[aria-label="ערוך"]').first().click();

    // Update the name
    await page.fill('input[name="name"]', 'בדיקה עדכון');
    await page.click('button:has-text("שמור")');

    // Wait for update toast
    await page.waitForSelector('text=החייל עודכן בהצלחה');

    // Verify updated name appears
    await expect(page.locator('text=בדיקה עדכון')).toBeVisible();
    await expect(page.locator('text=בדיקה טסט')).not.toBeVisible();
  });

  test('should persist data after page refresh', async ({ page }) => {
    // Create a soldier
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוסף חייל חדש');
    await page.fill('input[name="name"]', 'בדיקה קבועה');
    await page.fill('input[name="rank"]', 'טוראי');
    await page.fill('input[name="maxVacationDays"]', '7');
    await page.fill('input[name="usedVacationDays"]', '0');
    await page.check('input[value="soldier"]');
    await page.click('button:has-text("שמור")');
    await page.waitForSelector('text=החייל נוסף בהצלחה');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify soldier still exists
    await expect(page.locator('text=בדיקה קבועה')).toBeVisible();

    // Clean up - delete the soldier
    const row = page.locator('tr:has-text("בדיקה קבועה")');
    await row.locator('button[aria-label="מחק"]').first().click();
    await page.click('button:has-text("אישור")');
  });

  test('should delete a soldier', async ({ page }) => {
    // Create a soldier first
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוסף חייל חדש');
    await page.fill('input[name="name"]', 'בדיקה למחיקה');
    await page.fill('input[name="rank"]', 'טוראי');
    await page.fill('input[name="maxVacationDays"]', '7');
    await page.fill('input[name="usedVacationDays"]', '0');
    await page.check('input[value="soldier"]');
    await page.click('button:has-text("שמור")');
    await page.waitForSelector('text=החייל נוסף בהצלחה');

    // Get initial count
    const initialCount = await page.locator('tbody tr').count();

    // Delete the soldier
    const row = page.locator('tr:has-text("בדיקה למחיקה")');
    await row.locator('button[aria-label="מחק"]').first().click();

    // Confirm deletion in dialog
    await page.click('button:has-text("אישור")');

    // Wait for delete toast
    await page.waitForSelector('text=החייל נמחק בהצלחה');

    // Verify soldier is gone
    await expect(page.locator('text=בדיקה למחיקה')).not.toBeVisible();

    // Verify count decreased by 1
    const finalCount = await page.locator('tbody tr').count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should add and remove constraints', async ({ page }) => {
    // Click on first soldier's constraints button
    await page.locator('button:has-text("אילוצים")').first().click();

    // Wait for constraint dialog
    await page.waitForSelector('text=אילוצי');

    // Add a constraint
    await page.selectOption('select[name="type"]', 'vacation');
    await page.fill('input[type="date"]').first().fill('2026-02-01');
    await page.fill('input[type="date"]').nth(1).fill('2026-02-03');
    await page.fill('input[name="reason"]', 'בדיקה');
    await page.click('button:has-text("הוסף אילוץ")');

    // Wait for success toast
    await page.waitForSelector('text=המגבלה נוספה בהצלחה');

    // Verify constraint appears in list
    await expect(page.locator('text=בדיקה')).toBeVisible();

    // Remove the constraint
    await page.locator('button[aria-label="מחק אילוץ"]').first().click();

    // Wait for removal toast
    await page.waitForSelector('text=המגבלה הוסרה בהצלחה');

    // Close dialog
    await page.click('button:has-text("סגור")');
  });
});
