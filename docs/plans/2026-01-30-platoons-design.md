# Platoons (מחלקות) Feature Design

## Overview

Add platoon management to the military scheduling system. Soldiers belong to platoons (typically 3), with full CRUD operations and visual representation throughout the system.

## Goals

- Enable platoon management (create, edit, delete)
- Associate soldiers with platoons (optional)
- Display platoon information in soldiers page and schedule view
- Filter schedule by platoon
- Auto-assign colors for visual distinction

---

## Part 1: Data Model (Backend)

### Platoons Table

New table `platoons`:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Platoon name |
| `commander` | VARCHAR(100) | NULLABLE | Commander name |
| `color` | VARCHAR(7) | NOT NULL | Hex color code |
| `description` | TEXT | NULLABLE | Free text description |
| `createdAt` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL | Last update timestamp |

### Soldiers Table Update

Add column:
- `platoonId` (UUID, NULLABLE, FOREIGN KEY → `platoons.id`)
- `ON DELETE SET NULL` - when platoon deleted, soldiers remain with null platoonId

### Auto Color Assignment

**Color Palette (10 colors):**
```typescript
const PLATOON_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63'  // Pink
];
```

When creating a new platoon:
1. Count existing platoons
2. Assign `PLATOON_COLORS[count % 10]`
3. If more than 10 platoons exist, colors repeat

---

## Part 2: API Endpoints (Backend)

### Platoons API

**`GET /platoons`**
- Returns: Array of all platoons with soldier count
- Response: `{ id, name, commander, color, description, soldierCount }`

**`POST /platoons`**
- Body: `{ name (required), commander?, description? }`
- Auto-assigns color based on existing platoon count
- Returns: Created platoon

**`PATCH /platoons/:id`**
- Body: `{ name?, commander?, description? }`
- Note: Color cannot be changed (auto-managed)
- Returns: Updated platoon

**`DELETE /platoons/:id`**
- Checks if platoon has soldiers
- If yes: Returns 409 Conflict with `{ soldierCount, availablePlatoons[] }`
- If no: Deletes platoon
- Frontend handles reassignment before deletion

**`POST /platoons/auto-assign`**
- Body: `{ platoonIds: string[] }`
- Takes all soldiers with `platoonId = null`
- Distributes evenly (round-robin) among specified platoons
- Returns: `{ assignedCount }`

### Soldiers API Updates

**`POST /soldiers`**
- Add optional `platoonId` field to body

**`PATCH /soldiers/:id`**
- Can update `platoonId` (including setting to null)

**`PATCH /soldiers/bulk-update`** (new)
- Body: `{ soldierIds: string[], platoonId: string | null }`
- Used for bulk reassignment during platoon deletion
- Returns: `{ updatedCount }`

---

## Part 3: Frontend Components & UI

### Soldiers Page - Tab Structure

**Tabs Component:**
1. **"הכל"** tab - shows all soldiers
2. **Platoon tabs** - one tab per platoon showing only its soldiers
3. **"ללא מחלקה"** tab - shows soldiers with `platoonId = null`
4. **"+"** button - opens Platoon Management Dialog

Each platoon tab displays:
- Platoon name with color badge
- Number of soldiers in parentheses
- Example: `מחלקה א' 🟢 (15)`

### Platoon Management Dialog

**Layout:**
- List of all platoons with:
  - Color badge
  - Name, Commander
  - Soldier count
  - Edit and Delete buttons
- "הוסף מחלקה" button at bottom

**Create/Edit Platoon Form:**
- Name (required)
- Commander (optional)
- Description (optional)
- Color: Display only, auto-assigned, cannot edit

**Delete Platoon Flow:**
If platoon has soldiers:
1. Show confirmation dialog with soldier count
2. Two options:
   - "העבר את X החיילים למחלקה..." (dropdown of other platoons)
   - "השאר את החיילים ללא מחלקה"
3. Execute bulk update on soldiers
4. Then delete platoon

### Create/Edit Soldier Form

Add dropdown for platoon selection:
- First option: "ללא מחלקה"
- Other options: List of platoons with color badge
- Example: `🟢 מחלקה א'`

---

## Part 4: Schedule View Integration

### Display in Assignment Cells

Each assignment cell in schedule shows:
```
[Soldier Name] · [Role] [Platoon Badge]
```

Example: `דני כהן · נהג 🟢`

Badge styling:
- Small circular badge with platoon color
- 8px diameter
- Positioned after role name
- Only shown if soldier has platoon

### Platoon Filter

Add filter control in schedule header:
- Multi-select dropdown: "סנן לפי מחלקה"
- Options: All platoons + "ללא מחלקה"
- Can select multiple platoons
- "נקה סינון" button to reset
- When active: Only show assignments from selected platoons

### Statistics Card

Add new card in statistics section:
**"התפלגות לפי מחלקות"**
- Shows distribution: How many soldiers from each platoon are assigned this week
- Visual representation with platoon colors
- Example:
  ```
  🟢 מחלקה א': 12 שיבוצים
  🔵 מחלקה ב': 15 שיבוצים
  🟠 מחלקה ג': 10 שיבוצים
  ⚪ ללא מחלקה: 3 שיבוצים
  ```

---

## Part 5: Migration & Initial Data

### Database Migration

Steps:
1. Create `platoons` table with all columns
2. Add `platoonId` column to `soldiers` table (nullable)
3. Add foreign key constraint with `ON DELETE SET NULL`
4. Create index on `soldiers.platoonId` for performance

Migration file: `TIMESTAMP-AddPlatoons.ts`

### Handling Existing Soldiers

**First-Time Platoon Creation:**
After manager creates platoons for the first time, show prompt:
```
נמצאו X חיילים ללא מחלקה.
האם לחלק אותם אוטומטית בין המחלקות?

[כן, חלק אוטומטית] [לא, אשבץ ידנית]
```

If "Yes":
- Call `POST /platoons/auto-assign` with all platoon IDs
- Distribute soldiers evenly using round-robin
- Show success message: "X חיילים חולקו בין Y מחלקות"

If "No":
- Soldiers remain with `platoonId = null`
- Manager can assign manually through edit soldier form

---

## Implementation Notes

### YAGNI Principles

**Not including in v1:**
- Platoon-specific tasks (future feature)
- Custom color selection (auto-assign only)
- Platoon hierarchy or sub-platoons
- Platoon statistics/reports (beyond basic count)
- Historical platoon assignments

### Validation Rules

**Platoon Name:**
- Required
- Unique across all platoons
- Max 100 characters
- No special validation (Hebrew/English both OK)

**Commander Name:**
- Optional
- Max 100 characters
- Not validated against soldier list (free text)

**Platoon Deletion:**
- Cannot delete if has soldiers (must reassign first)
- Frontend enforces this with dialog flow

### Testing Coverage

**Backend:**
- Unit tests for platoon CRUD operations
- Unit tests for auto-color assignment
- Unit tests for bulk soldier update
- E2E test for delete-with-reassignment flow

**Frontend:**
- Component tests for tabs filtering
- Component tests for platoon dialog
- Integration test for create-assign-filter flow

---

## Success Criteria

- [ ] Manager can create/edit/delete platoons
- [ ] Soldiers can be assigned to platoons (optional)
- [ ] Soldiers page shows tabs per platoon
- [ ] Schedule view shows platoon badges
- [ ] Schedule view allows filtering by platoon
- [ ] Existing soldiers can be auto-assigned to new platoons
- [ ] Deleting platoon prompts for soldier reassignment
- [ ] Colors auto-assign and remain consistent

## Future Enhancements

- Platoon-specific tasks (tasks assigned to entire platoon)
- Platoon rotation schedules
- Platoon commander dashboard
- Platoon performance metrics
