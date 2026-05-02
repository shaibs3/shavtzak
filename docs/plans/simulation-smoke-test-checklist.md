# Post-Deployment Smoke Test Checklist

Manual verification checklist for Shavtzak scheduling system.
Run after each deployment to production or staging.

## Prerequisites

- [ ] Backend running and accessible
- [ ] Frontend loaded and authenticated
- [ ] Database seeded with sample data (70 soldiers, 3 tasks, 5 platoons)

---

## 1. Soldier Management

- [ ] Navigate to soldiers tab ("חיילים")
- [ ] Verify 70+ soldiers are listed
- [ ] Create a new soldier with name, rank, and roles
- [ ] Edit an existing soldier's roles
- [ ] Add a constraint (vacation) to a soldier
- [ ] Delete a soldier
- [ ] Verify platoon assignment is visible per soldier

## 2. Task Management

- [ ] Navigate to tasks tab ("משימות")
- [ ] Verify tasks are listed (morning, evening shifts)
- [ ] Create a new task with shift hours and required roles
- [ ] Edit a task's required roles
- [ ] Deactivate a task (toggle isActive)
- [ ] Re-activate the task

## 3. Schedule & Auto-Scheduling

- [ ] Navigate to schedule tab ("שיבוצים")
- [ ] Verify schedule grid loads with tasks as rows and days as columns
- [ ] Click "שיבוץ אוטומטי" (auto-schedule)
- [ ] Wait for "שיבוץ אוטומטי הושלם" toast
- [ ] Verify assignments appear in the grid as colored badges
- [ ] Navigate to next/previous week — verify assignments persist
- [ ] Click "היום" to return to current week

## 4. Assignment Rules Verification

- [ ] No soldier is assigned during a vacation/medical constraint
- [ ] Commander role slots are filled by soldiers with commander role
- [ ] Driver role slots are filled by soldiers with driver role
- [ ] No soldier has overlapping assignments
- [ ] Rest time between shifts is respected (check adjacent-day assignments)

## 5. Lock & Re-Schedule

- [ ] Click an assignment badge to open edit dialog
- [ ] Lock the assignment (toggle lock)
- [ ] Run auto-schedule again
- [ ] Verify the locked assignment was not moved or replaced

## 6. Analytics

- [ ] Navigate to analytics tab ("אנליטיקה")
- [ ] Verify platoon hours breakdown is visible
- [ ] Verify soldier hours data is displayed
- [ ] Check that data matches expected values after auto-scheduling

## 7. Settings

- [ ] Navigate to settings tab ("הגדרות")
- [ ] Verify operational start/end dates are displayed
- [ ] Update minimum base presence percentage
- [ ] Save settings and verify success toast
- [ ] Refresh page and verify settings persisted

## 8. Edge Cases

- [ ] Add a constraint to ALL soldiers for a specific date, run auto-schedule — verify no crash, slots shown as unfilled
- [ ] Create a task requiring a role no soldier has — verify unfilled slots reported
- [ ] Remove all soldiers from a platoon — verify analytics handles empty platoon
- [ ] Set operational period to a single day — verify schedule shows only that day

## 9. Data Persistence

- [ ] Run auto-schedule, note assignment count
- [ ] Refresh the page (F5)
- [ ] Verify assignment count matches pre-refresh

## 10. Error Handling

- [ ] Attempt to create a soldier with empty name — verify validation error
- [ ] Attempt to create a task with 0 shift duration — verify validation error
- [ ] Stop the backend, interact with the frontend — verify error messages shown

---

## Sign-Off

| Item | Status | Tester | Date |
|------|--------|--------|------|
| All checks passed | [ ] | | |
| Known issues documented | [ ] | | |
| Ready for users | [ ] | | |
