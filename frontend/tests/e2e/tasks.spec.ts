import { test, expect } from '@playwright/test';

test.describe('Tasks CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to tasks tab
    await page.click('text=משימות');
    await page.waitForLoadState('networkidle');
  });

  test('should display existing tasks', async ({ page }) => {
    // Should see at least the 2 seeded tasks
    await page.waitForSelector('text=משמרת בוקר');
    await page.waitForSelector('text=משמרת ערב');
  });

  test('should create a new task', async ({ page }) => {
    await page.click('text=הוסף משימה');
    await page.waitForSelector('text=הוסף משימה חדשה');

    // Fill task form
    await page.fill('input[name="name"]', 'משמרת בדיקה');
    await page.fill('textarea[name="description"]', 'תיאור בדיקה');
    await page.fill('input[name="shiftStartHour"]', '18');
    await page.fill('input[name="shiftDuration"]', '8');
    await page.fill('input[name="restTimeBetweenShifts"]', '12');

    // Add required role
    await page.click('button:has-text("הוסף תפקיד")');
    await page.selectOption('select[name="role"]', 'soldier');
    await page.fill('input[name="count"]', '2');

    // Submit
    await page.click('button:has-text("שמור")');
    await page.waitForSelector('text=המשימה נוספה בהצלחה');

    // Verify task appears
    await expect(page.locator('text=משמרת בדיקה')).toBeVisible();
  });

  test('should update a task', async ({ page }) => {
    // Create a task first
    await page.click('text=הוסף משימה');
    await page.waitForSelector('text=הוסף משימה חדשה');
    await page.fill('input[name="name"]', 'משמרת עדכון');
    await page.fill('input[name="shiftStartHour"]', '20');
    await page.fill('input[name="shiftDuration"]', '8');
    await page.fill('input[name="restTimeBetweenShifts"]', '12');
    await page.click('button:has-text("הוסף תפקיד")');
    await page.selectOption('select[name="role"]', 'soldier');
    await page.fill('input[name="count"]', '1');
    await page.click('button:has-text("שמור")');
    await page.waitForSelector('text=המשימה נוספה בהצלחה');

    // Edit the task
    const card = page.locator('div:has-text("משמרת עדכון")').first();
    await card.locator('button:has-text("עריכה")').click();

    // Update name
    await page.fill('input[name="name"]', 'משמרת מעודכנת');
    await page.click('button:has-text("שמור")');
    await page.waitForSelector('text=המשימה עודכנה בהצלחה');

    // Verify update
    await expect(page.locator('text=משמרת מעודכנת')).toBeVisible();
  });

  test('should toggle task active status', async ({ page }) => {
    // Find first task toggle
    const toggle = page.locator('button[role="switch"]').first();

    // Get initial state
    const isChecked = await toggle.getAttribute('data-state') === 'checked';

    // Toggle
    await toggle.click();

    // Wait for update
    await page.waitForSelector('text=המשימה עודכנה בהצלחה');

    // Verify state changed
    const newState = await toggle.getAttribute('data-state');
    expect(newState).not.toBe(isChecked ? 'checked' : 'unchecked');
  });

  test('should delete a task', async ({ page }) => {
    // Create a task to delete
    await page.click('text=הוסף משימה');
    await page.waitForSelector('text=הוסף משימה חדשה');
    await page.fill('input[name="name"]', 'משמרת למחיקה');
    await page.fill('input[name="shiftStartHour"]', '22');
    await page.fill('input[name="shiftDuration"]', '6');
    await page.fill('input[name="restTimeBetweenShifts"]', '12');
    await page.click('button:has-text("הוסף תפקיד")');
    await page.selectOption('select[name="role"]', 'soldier');
    await page.fill('input[name="count"]', '1');
    await page.click('button:has-text("שמור")');
    await page.waitForSelector('text=המשימה נוספה בהצלחה');

    // Delete the task
    const card = page.locator('div:has-text("משמרת למחיקה")').first();
    await card.locator('button:has-text("מחיקה")').click();

    // Confirm deletion
    await page.click('button:has-text("אישור")');
    await page.waitForSelector('text=המשימה נמחקה בהצלחה');

    // Verify task is gone
    await expect(page.locator('text=משמרת למחיקה')).not.toBeVisible();
  });
});
