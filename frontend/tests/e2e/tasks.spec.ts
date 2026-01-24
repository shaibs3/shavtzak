import { test, expect } from '@playwright/test';

test.describe('Tasks CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to tasks tab
    await page.click('button:has-text("משימות")');
    // Wait for tasks view to load
    await page.waitForSelector('text=ניהול משימות', { timeout: 10000 });
  });

  test('should display existing tasks', async ({ page }) => {
    // Should see at least the 2 seeded tasks
    await page.waitForSelector('text=משמרת בוקר');
    await page.waitForSelector('text=משמרת ערב');
  });

  test('should create a new task', async ({ page }) => {
    await page.click('text=הוסף משימה');
    await page.waitForSelector('text=הוספת משימה חדשה');

    // Fill task form
    await page.fill('input[id="name"]', 'משמרת בדיקה');
    await page.fill('input[id="description"]', 'תיאור בדיקה');
    await page.fill('input[id="shiftStartHour"]', '18');
    await page.fill('input[id="shiftDuration"]', '8');
    await page.fill('input[id="restTime"]', '12');

    // Submit
    await page.click('button:has-text("הוסף משימה")');
    await page.waitForSelector('text=המשימה נוספה בהצלחה');

    // Verify task appears
    await expect(page.locator('text=משמרת בדיקה')).toBeVisible();
  });

  test('should update a task', async ({ page }) => {
    // Create a task first
    await page.click('text=הוסף משימה');
    await page.waitForSelector('text=הוספת משימה חדשה');
    await page.fill('input[id="name"]', 'משמרת עדכון');
    await page.fill('input[id="shiftStartHour"]', '20');
    await page.fill('input[id="shiftDuration"]', '8');
    await page.fill('input[id="restTime"]', '12');
    await page.click('button:has-text("הוסף משימה")');
    await page.waitForSelector('text=המשימה נוספה בהצלחה');

    // Edit the task - find card with this task and click edit button
    const card = page.locator('div.bg-card:has-text("משמרת עדכון")');
    await card.locator('button:has-text("עריכה")').click();

    // Update name
    await page.fill('input[id="name"]', 'משמרת מעודכנת');
    await page.click('button:has-text("שמור שינויים")');
    await page.waitForSelector('text=המשימה עודכנה בהצלחה');

    // Verify update
    await expect(page.locator('text=משמרת מעודכנת')).toBeVisible();
  });

  test('should toggle task active status', async ({ page }) => {
    // Find first task toggle (Switch component)
    const toggle = page.locator('button[role="switch"]').first();

    // Get initial state
    const initialState = await toggle.getAttribute('data-state');

    // Toggle
    await toggle.click();

    // Wait for update
    await page.waitForSelector('text=המשימה עודכנה בהצלחה');

    // Verify state changed
    const newState = await toggle.getAttribute('data-state');
    expect(newState).not.toBe(initialState);
  });

  test('should delete a task', async ({ page }) => {
    // Create a task to delete
    await page.click('text=הוסף משימה');
    await page.waitForSelector('text=הוספת משימה חדשה');
    await page.fill('input[id="name"]', 'משמרת למחיקה');
    await page.fill('input[id="shiftStartHour"]', '22');
    await page.fill('input[id="shiftDuration"]', '6');
    await page.fill('input[id="restTime"]', '12');
    await page.click('button:has-text("הוסף משימה")');
    await page.waitForSelector('text=המשימה נוספה בהצלחה');

    // Delete the task
    const card = page.locator('div.bg-card:has-text("משמרת למחיקה")');

    // Set up dialog handler before clicking delete
    page.once('dialog', dialog => dialog.accept());

    await card.locator('button:has-text("מחיקה")').click();

    // Wait for deletion
    await page.waitForSelector('text=המשימה נמחקה בהצלחה');

    // Verify task is gone
    await expect(page.locator('text=משמרת למחיקה')).not.toBeVisible();
  });
});
