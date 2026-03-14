# Platoons Feature

## Overview

The Platoons feature allows organizing soldiers into platoons (מחלקות) for better management and scheduling.

## Features

### Platoon Management
- Create, edit, and delete platoons
- Each platoon has: name, commander (optional), description (optional), auto-assigned color
- View all platoons with soldier count

### Soldier Assignment
- Assign soldiers to platoons during creation or editing
- Optional - soldiers can remain without platoon
- Bulk reassignment during platoon deletion
- Auto-assign unassigned soldiers to platoons

### Visual Integration
- Platoon tabs in Soldiers page (All, per-platoon, No platoon)
- Platoon color badges in Schedule view assignment cells
- Platoon filter dropdown in Schedule view
- Platoon distribution statistics

## User Flows

### Creating First Platoons
1. Navigate to Soldiers page
2. Click "Manage Platoons" button
3. Click "Add Platoon"
4. Fill in name (required), commander and description (optional)
5. System auto-assigns color
6. After creating platoons, prompt appears to auto-assign existing soldiers

### Assigning Soldier to Platoon
1. Create or edit soldier
2. Select platoon from dropdown (or "No Platoon")
3. Save soldier

### Filtering Schedule by Platoon
1. Navigate to Schedule view
2. Use platoon filter dropdown in header
3. Select platoon to view only its assignments
4. Select "All Platoons" to reset filter

### Deleting Platoon with Soldiers
1. Open Platoon Management dialog
2. Click delete on platoon with soldiers
3. Dialog appears with reassignment options
4. Choose target platoon or "No Platoon"
5. Confirm - soldiers reassigned and platoon deleted

## API Endpoints

### Platoons
- `GET /platoons` - List all platoons with soldier counts
- `POST /platoons` - Create platoon (auto-assigns color)
- `PATCH /platoons/:id` - Update platoon
- `DELETE /platoons/:id` - Delete platoon (fails if has soldiers)
- `POST /platoons/auto-assign` - Distribute unassigned soldiers

### Soldiers
- `PATCH /soldiers/bulk-update` - Bulk update platoon assignment

## Technical Details

### Color Assignment
- 10 predefined colors in palette
- Auto-assigned on creation based on count
- Colors cycle after 10 platoons
- Cannot be manually changed

### Database Schema
- `platoons` table: id, name, commander, color, description, timestamps
- `soldiers.platoonId` column: nullable UUID foreign key
- ON DELETE SET NULL cascade

### Frontend State
- React Query for data fetching
- localStorage tracks if auto-assign prompt shown
- Tabs and filters use local state

## Future Enhancements
- Platoon-specific tasks
- Platoon rotation schedules
- Commander dashboard
- Performance metrics per platoon
