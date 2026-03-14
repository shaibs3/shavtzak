# Platoons Feature - Integration Testing Checklist

This document provides a comprehensive manual testing checklist for the platoons feature. Use this guide to verify all functionality works correctly before deployment.

## Prerequisites

Before starting the tests, ensure:
- [ ] Backend server is running (`cd backend && npm run start:dev`)
- [ ] Frontend dev server is running (`cd frontend && npm run dev`)
- [ ] Database is clean or in a known state
- [ ] You have admin access to the application

## Test Suite Overview

1. Platoon CRUD Operations
2. Auto-Assign Functionality
3. Soldier-Platoon Assignment
4. Schedule View Integration
5. Delete with Reassignment Flow

---

## 1. Platoon CRUD Flow Testing

### 1.1 Create Platoons

**Objective:** Verify that platoons can be created successfully with proper validation.

- [ ] Navigate to the Soldiers page
- [ ] Click "Manage Platoons" button
- [ ] Verify the platoon management dialog opens

**Create First Platoon:**
- [ ] Click "Add Platoon" or "+" button
- [ ] Enter name: "מחלקה א'" (Platoon A)
- [ ] Verify a color is automatically assigned
- [ ] Click "Save" or confirm
- [ ] Verify platoon appears in the list with the correct name and color

**Create Second Platoon:**
- [ ] Click "Add Platoon" again
- [ ] Enter name: "מחלקה ב'" (Platoon B)
- [ ] Verify a different color is automatically assigned
- [ ] Click "Save" or confirm
- [ ] Verify platoon appears in the list

**Create Third Platoon:**
- [ ] Click "Add Platoon" again
- [ ] Enter name: "מחלקה ג'" (Platoon C)
- [ ] Verify a different color is automatically assigned (all 3 colors should be distinct)
- [ ] Click "Save" or confirm
- [ ] Verify platoon appears in the list

**Validation Testing:**
- [ ] Try to create a platoon with an empty name
- [ ] Verify validation error appears
- [ ] Try to create a platoon with a duplicate name
- [ ] Verify appropriate error message

### 1.2 Read/View Platoons

**Objective:** Verify platoons are displayed correctly.

- [ ] Close and reopen the "Manage Platoons" dialog
- [ ] Verify all 3 platoons are still visible
- [ ] Verify each platoon shows:
  - Correct name
  - Assigned color indicator
  - Edit/Delete action buttons
- [ ] Verify platoons are listed in a logical order (e.g., creation order or alphabetical)

### 1.3 Update Platoons

**Objective:** Verify platoon information can be modified.

**Edit Platoon Name:**
- [ ] Click "Edit" button on "מחלקה ב'"
- [ ] Change name to "מחלקה ב' - מעודכן" (Platoon B - Updated)
- [ ] Click "Save"
- [ ] Verify the name updates immediately in the list
- [ ] Verify the color remains the same

**Edit Platoon Color:**
- [ ] Click "Edit" button on "מחלקה א'"
- [ ] Change the color to a different one
- [ ] Click "Save"
- [ ] Verify the color updates immediately in the list
- [ ] Verify the name remains the same

**Cancel Edit:**
- [ ] Click "Edit" button on "מחלקה ג'"
- [ ] Make some changes
- [ ] Click "Cancel"
- [ ] Verify no changes were saved

### 1.4 Delete Platoons (Empty)

**Objective:** Verify empty platoons can be deleted.

- [ ] Create a test platoon named "מחלקה זמנית" (Temporary Platoon)
- [ ] Immediately delete it (before assigning any soldiers)
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify platoon is removed from the list

---

## 2. Auto-Assign Functionality Testing

### 2.1 First-Time Auto-Assign Prompt

**Objective:** Verify auto-assign prompt appears when first platoon is created with existing soldiers.

**Setup:**
- [ ] Ensure you have at least 6 soldiers in the system without platoon assignments
- [ ] Delete all existing platoons if any

**Test Auto-Assign Prompt:**
- [ ] Navigate to Soldiers page
- [ ] Click "Manage Platoons"
- [ ] Create a new platoon
- [ ] Verify auto-assign prompt/dialog appears after creating the first platoon
- [ ] Verify prompt message explains auto-assignment functionality
- [ ] Verify prompt shows "Yes, auto-assign" and "No, I'll assign manually" options

### 2.2 Auto-Assign Execution

**Objective:** Verify soldiers are distributed evenly when auto-assign is triggered.

- [ ] Click "Yes, auto-assign" in the prompt
- [ ] Wait for the auto-assign operation to complete
- [ ] Verify success message appears
- [ ] Close the platoon management dialog

**Verify Distribution:**
- [ ] Check that platoon tabs appear on the Soldiers page
- [ ] Verify soldiers are distributed across all platoons
- [ ] Count soldiers in each platoon tab
- [ ] Verify distribution is relatively even (difference of at most 1 soldier between platoons)
- [ ] Verify "All Soldiers" or "כל החיילים" tab shows all soldiers
- [ ] Verify each platoon tab shows only its assigned soldiers

### 2.3 Manual Assignment Option

**Objective:** Verify manual assignment option works correctly.

**Setup:**
- [ ] Create a fresh test environment or reset platoon assignments
- [ ] Create platoons

**Test Manual Assignment:**
- [ ] When auto-assign prompt appears, click "No, I'll assign manually"
- [ ] Verify prompt closes without auto-assigning
- [ ] Verify all soldiers remain in "No Platoon" or "Unassigned" state
- [ ] Verify you can manually assign soldiers (covered in next section)

---

## 3. Soldier-Platoon Assignment Testing

### 3.1 Create New Soldier with Platoon

**Objective:** Verify new soldiers can be assigned to platoons during creation.

- [ ] Navigate to Soldiers page
- [ ] Click "Add Soldier" or "+" button
- [ ] Fill in required soldier information:
  - Name: "חייל בדיקה" (Test Soldier)
  - Military ID
  - Other required fields
- [ ] Locate the "Platoon" dropdown field
- [ ] Verify all existing platoons appear in the dropdown
- [ ] Select "מחלקה א'" from the dropdown
- [ ] Save the soldier
- [ ] Verify success message appears

**Verify Assignment:**
- [ ] Navigate to the "מחלקה א'" tab
- [ ] Verify "חייל בדיקה" appears in the list
- [ ] Verify the soldier does NOT appear in other platoon tabs
- [ ] Verify the soldier appears in the "All Soldiers" tab

### 3.2 Edit Existing Soldier's Platoon

**Objective:** Verify soldier platoon assignments can be changed.

**Change Platoon:**
- [ ] Click "Edit" on "חייל בדיקה"
- [ ] Change platoon from "מחלקה א'" to "מחלקה ב'"
- [ ] Save the changes
- [ ] Verify the soldier now appears in "מחלקה ב'" tab
- [ ] Verify the soldier no longer appears in "מחלקה א'" tab

**Remove Platoon Assignment:**
- [ ] Click "Edit" on "חייל בדיקה"
- [ ] Select "No Platoon" or clear the platoon selection
- [ ] Save the changes
- [ ] Verify the soldier appears in "Unassigned" or "No Platoon" section/tab
- [ ] Verify the soldier still appears in "All Soldiers" tab

### 3.3 Bulk Assignment

**Objective:** Verify multiple soldiers can be assigned to platoons efficiently.

- [ ] Select multiple soldiers from the list (if bulk selection is available)
- [ ] Use bulk action menu to assign to a platoon
- [ ] Select "מחלקה ג'"
- [ ] Confirm the action
- [ ] Verify all selected soldiers now appear in "מחלקה ג'" tab

---

## 4. Schedule View Integration Testing

### 4.1 Platoon Badges Display

**Objective:** Verify platoon information is visible in the schedule view.

- [ ] Navigate to the Schedule page
- [ ] Verify the schedule grid loads correctly
- [ ] Locate soldiers with platoon assignments

**Badge Verification:**
- [ ] Verify a badge/indicator appears next to each soldier's name
- [ ] Verify the badge shows the platoon color
- [ ] Verify hovering over or clicking the badge shows platoon name
- [ ] Verify soldiers without platoons have no badge or a neutral indicator
- [ ] Verify badges are visually consistent and easy to identify

**Multiple Views:**
- [ ] Switch between different schedule views (daily, weekly, etc.)
- [ ] Verify badges appear correctly in all views
- [ ] Verify badges don't overlap with other UI elements
- [ ] Verify badges are responsive on different screen sizes

### 4.2 Platoon Filter Functionality

**Objective:** Verify schedule can be filtered by platoon.

**Filter UI:**
- [ ] Locate the platoon filter dropdown/selector
- [ ] Verify "All Platoons" option is available
- [ ] Verify all existing platoons appear in the filter list
- [ ] Verify platoon colors are shown in the filter list

**Filter by Specific Platoon:**
- [ ] Select "מחלקה א'" from the filter
- [ ] Verify only assignments for soldiers in "מחלקה א'" are displayed
- [ ] Verify assignments for soldiers in other platoons are hidden
- [ ] Verify the schedule updates immediately without page reload

**Filter Multiple Platoons:**
- [ ] Select "מחלקה ב'" from the filter
- [ ] Verify only "מחלקה ב'" assignments show
- [ ] Switch to "All Platoons"
- [ ] Verify all assignments reappear

**Filter Persistence:**
- [ ] Select a platoon filter
- [ ] Navigate to another page
- [ ] Return to Schedule page
- [ ] Verify filter selection is maintained (if this is intended behavior)

### 4.3 Distribution Statistics

**Objective:** Verify platoon statistics are accurate and helpful.

- [ ] Locate the distribution statistics card/panel
- [ ] Verify it shows assignment counts per platoon
- [ ] Verify statistics update when filter changes
- [ ] Verify percentages or ratios are calculated correctly
- [ ] Verify "Unassigned" soldiers are tracked separately

**Statistics Accuracy:**
- [ ] Manually count assignments for "מחלקה א'"
- [ ] Compare with the count shown in statistics
- [ ] Verify they match
- [ ] Repeat for other platoons

---

## 5. Delete with Reassignment Flow Testing

### 5.1 Delete Platoon with Assigned Soldiers

**Objective:** Verify proper handling when deleting platoons that have soldiers.

**Setup:**
- [ ] Ensure "מחלקה א'" has at least 3 soldiers assigned
- [ ] Note the exact soldiers assigned for verification

**Attempt Deletion:**
- [ ] Navigate to "Manage Platoons"
- [ ] Click "Delete" button on "מחלקה א'"
- [ ] Verify a warning/confirmation dialog appears
- [ ] Verify dialog message explains that soldiers need to be reassigned
- [ ] Verify dialog shows the number of soldiers currently in the platoon

### 5.2 Reassign to Another Platoon

**Objective:** Verify soldiers can be moved to another platoon during deletion.

- [ ] In the deletion dialog, verify a "Reassign to" dropdown appears
- [ ] Verify dropdown lists all OTHER platoons (not the one being deleted)
- [ ] Select "מחלקה ב'" as the target platoon
- [ ] Click "Confirm" or "Delete and Reassign"
- [ ] Verify success message appears
- [ ] Close the dialog

**Verify Reassignment:**
- [ ] Navigate to Soldiers page
- [ ] Go to "מחלקה ב'" tab
- [ ] Verify the 3 soldiers from "מחלקה א'" now appear here
- [ ] Verify "מחלקה א'" tab no longer exists
- [ ] Verify platoon counts are updated correctly

### 5.3 Reassign to "No Platoon"

**Objective:** Verify soldiers can be unassigned during platoon deletion.

**Setup:**
- [ ] Create a new test platoon "מחלקה זמנית 2"
- [ ] Assign 2 soldiers to it

**Delete and Unassign:**
- [ ] Click "Delete" on "מחלקה זמנית 2"
- [ ] In the deletion dialog, select "No Platoon" or "Unassign" option
- [ ] Confirm deletion
- [ ] Verify success message

**Verify Unassignment:**
- [ ] Check "Unassigned" or "No Platoon" section
- [ ] Verify the 2 soldiers appear there
- [ ] Verify they have no platoon badge
- [ ] Verify "מחלקה זמנית 2" is deleted

### 5.4 Cancel Deletion

**Objective:** Verify deletion can be safely cancelled.

- [ ] Click "Delete" on any platoon with soldiers
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel" or close the dialog
- [ ] Verify platoon is NOT deleted
- [ ] Verify all soldiers remain in their original platoon

---

## 6. Edge Cases and Error Handling

### 6.1 Network Error Handling

- [ ] Disconnect network or stop backend server
- [ ] Try to create a platoon
- [ ] Verify appropriate error message appears
- [ ] Verify UI doesn't break
- [ ] Reconnect network
- [ ] Verify operations work again

### 6.2 Concurrent Updates

- [ ] Open application in two browser tabs
- [ ] Edit the same platoon in both tabs
- [ ] Save in first tab
- [ ] Save in second tab
- [ ] Verify conflict is handled gracefully (last write wins or conflict detection)

### 6.3 Data Validation

- [ ] Try to create platoon with very long name (>100 characters)
- [ ] Verify validation error or truncation
- [ ] Try to create platoon with special characters
- [ ] Verify they are handled correctly
- [ ] Try to create platoon with RTL/LTR mixed text
- [ ] Verify text displays correctly

### 6.4 Permission Testing

- [ ] Log in as a user with limited permissions (if applicable)
- [ ] Verify appropriate features are disabled/hidden
- [ ] Verify read-only access works correctly

---

## 7. Performance Testing

### 7.1 Large Dataset Handling

- [ ] Test with 100+ soldiers
- [ ] Verify platoon tabs load quickly
- [ ] Verify filtering is responsive
- [ ] Verify no lag when switching tabs

### 7.2 Auto-Assign Performance

- [ ] Test auto-assign with 100+ soldiers
- [ ] Verify operation completes within reasonable time (<5 seconds)
- [ ] Verify UI remains responsive during operation

---

## 8. Cross-Browser Testing

Test the complete flow in multiple browsers:

### Chrome/Edge
- [ ] All CRUD operations work
- [ ] UI displays correctly
- [ ] No console errors

### Firefox
- [ ] All CRUD operations work
- [ ] UI displays correctly
- [ ] No console errors

### Safari
- [ ] All CRUD operations work
- [ ] UI displays correctly
- [ ] No console errors

---

## 9. Responsive Design Testing

### Desktop (1920x1080)
- [ ] All dialogs display correctly
- [ ] Tables are properly formatted
- [ ] No horizontal scrolling needed

### Tablet (768x1024)
- [ ] All features accessible
- [ ] Dialogs fit on screen
- [ ] Touch interactions work

### Mobile (375x667)
- [ ] Navigation works
- [ ] Forms are usable
- [ ] Tables are scrollable or reorganized

---

## 10. Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all platoon management controls
- [ ] Verify focus indicators are visible
- [ ] Verify Enter/Space keys work for buttons
- [ ] Verify Escape key closes dialogs

### Screen Reader
- [ ] Test with screen reader enabled
- [ ] Verify all labels are announced
- [ ] Verify form fields have proper labels
- [ ] Verify error messages are announced

### Color Contrast
- [ ] Verify platoon colors meet contrast requirements
- [ ] Verify badges are readable
- [ ] Verify text on colored backgrounds is legible

---

## Testing Completion Checklist

After completing all tests above:

- [ ] All test sections completed successfully
- [ ] Any issues found have been documented
- [ ] Critical bugs have been fixed and retested
- [ ] Performance is acceptable
- [ ] User experience is smooth and intuitive
- [ ] Documentation is accurate and complete

---

## Issues Log

Use this section to document any issues found during testing:

| Issue # | Severity | Description | Steps to Reproduce | Status |
|---------|----------|-------------|-------------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Severity Levels:**
- Critical: Feature is broken, blocks other tests
- High: Major functionality doesn't work as expected
- Medium: Feature works but has noticeable issues
- Low: Minor UI/UX issues, cosmetic problems

---

## Test Sign-off

**Tested By:** _______________
**Date:** _______________
**Test Environment:**
- Backend Version: _______________
- Frontend Version: _______________
- Database: _______________

**Overall Assessment:**
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Needs major fixes
- [ ] Not ready for deployment

**Additional Notes:**

---

*This checklist should be reviewed and executed before merging the platoons feature to the main branch.*
