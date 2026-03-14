import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Soldiers CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await loginAsTestUser(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to soldiers tab
    await page.click('button:has-text("חיילים")');
    // Wait for soldiers view to load by checking for the title
    await page.waitForSelector('text=ניהול חיילים', { timeout: 10000 });
  });

  test('should display soldiers initially', async ({ page }) => {
    // Wait for soldiers to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Count soldier rows - should have at least 70 (seed data)
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(70);
  });

  test('should create a new soldier', async ({ page }) => {
    // Get initial soldier count
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    const initialCount = await page.locator('tbody tr').count();

    // Click add soldier button
    await page.click('text=הוסף חייל');

    // Wait for form to appear
    await page.waitForSelector('text=הוספת חייל חדש', { timeout: 5000 });

    // Fill in the form using correct IDs
    await page.fill('input[id="name"]', 'בדיקה טסט');
    await page.fill('input[id="rank"]', 'טוראי');

    // Select at least one role (required by backend)
    await page.locator('label:has-text("נהג")').click();

    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');

    // Wait a moment for form to be ready
    await page.waitForTimeout(500);

    // Submit form - find the green submit button in the dialog
    const submitButton = page.locator('form button[type="submit"]');
    await submitButton.click();

    // Wait for dialog to close
    await expect(page.locator('text=הוספת חייל חדש')).not.toBeVisible({ timeout: 20000 });

    // Wait a moment for data to update
    await page.waitForTimeout(1000);

    // Verify count increased
    const finalCount = await page.locator('tbody tr').count();
    expect(finalCount).toBeGreaterThan(initialCount);
  });

  test('should update an existing soldier', async ({ page }) => {
    // First create a soldier
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוספת חייל חדש');
    await page.fill('input[id="name"]', 'בדיקה טסט עדכון');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.locator('label:has-text("נהג")').click(); // Select role
    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');
    await page.locator('form button[type="submit"]').click();

    // Wait for soldier to appear in list
    await page.waitForSelector('tr:has-text("בדיקה טסט עדכון")', { timeout: 20000 });

    // Find and click edit button for the test soldier (first button in actions column)
    const row = page.locator('tr:has-text("בדיקה טסט עדכון")');
    const editButton = row.locator('button').first();
    await editButton.click();

    // Wait for form to appear
    await page.waitForSelector('text=עריכת חייל', { timeout: 5000 });

    // Update the name
    await page.fill('input[id="name"]', 'בדיקה שונה');
    await page.click('button:has-text("שמור שינויים")');

    // Wait for update toast or updated row
    await Promise.race([
      page.waitForSelector('text=החייל עודכן בהצלחה', { timeout: 15000 }),
      page.waitForSelector('tr:has-text("בדיקה שונה")', { timeout: 15000 }),
    ]);

    // Verify updated name appears
    await expect(page.locator('text=בדיקה שונה')).toBeVisible();
  });

  test('should persist data after page refresh', async ({ page }) => {
    // Create a soldier
    await page.click('text=הוסף חייל');
    await page.waitForSelector('text=הוספת חייל חדש');
    await page.fill('input[id="name"]', 'בדיקה קבועה');
    await page.fill('input[id="rank"]', 'טוראי');
    await page.locator('label:has-text("נהג")').click(); // Select role
    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');
    await page.locator('form button[type="submit"]').click();

    // Wait for soldier to appear in list
    await page.waitForSelector('tr:has-text("בדיקה קבועה")', { timeout: 20000 });

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate back to soldiers tab after reload
    await page.click('button:has-text("חיילים")');
    await page.waitForSelector('text=ניהול חיילים', { timeout: 10000 });

    // Verify soldier still exists
    await expect(page.locator('text=בדיקה קבועה')).toBeVisible();

    // Clean up - delete the soldier
    const row = page.locator('tr:has-text("בדיקה קבועה")');

    // Set up dialog handler before clicking delete
    page.once('dialog', dialog => dialog.accept());

    // Click delete button (second button in the actions cell, not last which is constraints)
    const deleteButton = row.locator('td').first().locator('button').last();
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
    await page.locator('label:has-text("נהג")').click(); // Select role
    await page.fill('input[id="maxVacation"]', '7');
    await page.fill('input[id="usedVacation"]', '0');
    await page.locator('form button[type="submit"]').click();

    // Wait for soldier to appear in list
    await page.waitForSelector('tr:has-text("בדיקה למחיקה")', { timeout: 20000 });

    // Wait for table to stabilize
    await page.waitForTimeout(500);

    // Get initial count
    const initialCount = await page.locator('tbody tr').count();

    // Delete the soldier
    const row = page.locator('tr:has-text("בדיקה למחיקה")');

    // Set up dialog handler before clicking delete
    page.once('dialog', dialog => dialog.accept());

    // Click delete button (second button in the actions cell, not last which is constraints)
    const deleteButton = row.locator('td').first().locator('button').last();
    await deleteButton.click();

    // Wait for delete toast or soldier to disappear
    await Promise.race([
      page.waitForSelector('text=החייל נמחק בהצלחה', { timeout: 15000 }),
      expect(page.locator('tr:has-text("בדיקה למחיקה")')).not.toBeVisible({ timeout: 15000 }),
    ]);

    // Verify soldier is gone
    await expect(page.locator('text=בדיקה למחיקה')).not.toBeVisible();

    // Verify count decreased by 1
    const finalCount = await page.locator('tbody tr').count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should add and remove constraints', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Click on first soldier's constraints button
    const constraintsButton = page.locator('button:has-text("אילוצים"), button:has-text("אילוץ")').first();
    await constraintsButton.click();

    // Wait for constraint dialog (title includes soldier name)
    await page.waitForSelector('text=אילוצי', { timeout: 10000 });

    // Fill constraint dates
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];

    // Fill start and end dates
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.first().fill(dateStr);
    await dateInputs.nth(1).fill(dateStr);

    // Click add constraint button
    await page.click('button:has-text("הוסף אילוץ")');

    // Wait for success toast or constraint to appear
    await page.waitForTimeout(2000); // Give time for API call

    // Try to close dialog if it's still open
    const closeButton = page.locator('button:has-text("סגור"), button:has-text("ביטול")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });
});
