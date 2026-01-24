import { test, expect } from '@playwright/test';

test.describe('Soldiers CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to soldiers tab
    await page.click('button:has-text("חיילים")');
    // Wait for soldiers view to load by checking for the title
    await page.waitForSelector('text=ניהול חיילים', { timeout: 10000 });
  });

  test('should display 70 soldiers initially', async ({ page }) => {
    // Wait for soldiers to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Count soldier rows
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(70);
  });

  test('should create a new soldier', async ({ page }) => {
    // Click add soldier button
    await page.click('text=הוסף חייל');

    // Wait for form to appear
    await page.waitForSelector('text=הוספת חייל חדש');

    // Fill in the form using correct IDs
    await page.fill('input[id="name"]', 'בדיקה טסט');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');

    // Submit form
    await page.click('button:has-text("הוסף חייל")');

    // Wait for toast notification
    await page.waitForSelector('text=החייל נוסף בהצלחה', { timeout: 10000 });

    // Verify soldier appears in list
    await expect(page.locator('text=בדיקה טסט')).toBeVisible();

    // Count should now be 71
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(71);
  });

  test('should update an existing soldier', async ({ page }) => {
    // First create a soldier
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוספת חייל חדש');
    await page.fill('input[id="name"]', 'בדיקה טסט');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');
    await page.click('button:has-text("הוסף חייל")');
    await page.waitForSelector('text=החייל נוסף בהצלחה', { timeout: 10000 });

    // Find and click edit button for the test soldier (first button in actions column)
    const row = page.locator('tr:has-text("בדיקה טסט")');
    const editButton = row.locator('button').first();
    await editButton.click();

    // Update the name
    await page.fill('input[id="name"]', 'בדיקה עדכון');
    await page.click('button:has-text("שמור שינויים")');

    // Wait for update toast
    await page.waitForSelector('text=החייל עודכן בהצלחה', { timeout: 10000 });

    // Verify updated name appears
    await expect(page.locator('text=בדיקה עדכון')).toBeVisible();
    await expect(page.locator('text=בדיקה טסט')).not.toBeVisible();
  });

  test('should persist data after page refresh', async ({ page }) => {
    // Create a soldier
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוספת חייל חדש');
    await page.fill('input[id="name"]', 'בדיקה קבועה');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');
    await page.click('button:has-text("הוסף חייל")');
    await page.waitForSelector('text=החייל נוסף בהצלחה', { timeout: 10000 });

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify soldier still exists
    await expect(page.locator('text=בדיקה קבועה')).toBeVisible();

    // Clean up - delete the soldier
    const row = page.locator('tr:has-text("בדיקה קבועה")');

    // Set up dialog handler before clicking delete
    page.once('dialog', dialog => dialog.accept());

    // Click delete button (last button in actions)
    const deleteButton = row.locator('button').last();
    await deleteButton.click();

    // Wait for delete confirmation
    await page.waitForSelector('text=החייל נמחק בהצלחה', { timeout: 10000 });
  });

  test('should delete a soldier', async ({ page }) => {
    // Create a soldier first
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוספת חייל חדש');
    await page.fill('input[id="name"]', 'בדיקה למחיקה');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');
    await page.click('button:has-text("הוסף חייל")');
    await page.waitForSelector('text=החייל נוסף בהצלחה', { timeout: 10000 });

    // Get initial count
    const initialCount = await page.locator('tbody tr').count();

    // Delete the soldier
    const row = page.locator('tr:has-text("בדיקה למחיקה")');

    // Set up dialog handler before clicking delete
    page.once('dialog', dialog => dialog.accept());

    // Click delete button (last button in actions)
    const deleteButton = row.locator('button').last();
    await deleteButton.click();

    // Wait for delete toast
    await page.waitForSelector('text=החייל נמחק בהצלחה', { timeout: 10000 });

    // Verify soldier is gone
    await expect(page.locator('text=בדיקה למחיקה')).not.toBeVisible();

    // Verify count decreased by 1
    const finalCount = await page.locator('tbody tr').count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should add and remove constraints', async ({ page }) => {
    // Click on first soldier's constraints button
    await page.locator('button:has-text("אילוצים")').first().click();

    // Wait for constraint dialog (title includes soldier name)
    await page.waitForSelector('text=אילוצי');

    // Fill constraint dates
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];

    // Fill start and end dates
    await page.locator('input[type="date"]').first().fill(dateStr);
    await page.locator('input[type="date"]').nth(1).fill(dateStr);

    // Click add constraint button
    await page.click('button:has-text("הוסף אילוץ")');

    // Wait for success toast
    await page.waitForSelector('text=האילוץ נוסף בהצלחה', { timeout: 10000 });

    // Wait a bit for UI to update
    await page.waitForTimeout(500);

    // Remove the constraint - click the trash button
    const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
    await deleteButton.click();

    // Wait for removal toast
    await page.waitForSelector('text=האילוץ הוסר בהצלחה', { timeout: 10000 });

    // Close dialog
    await page.click('button:has-text("סגור")');
  });
});
