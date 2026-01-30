# Operational Period Feature

## Overview

The Operational Period feature allows you to define a specific time window during which the system operates. This is useful for managing rotations during specific exercises, operations, or training periods.

## How It Works

### Setting the Operational Period

1. Navigate to the Settings page
2. Find the "Operational Period" section
3. Set both dates:
   - **Start Date**: First day of the operational period
   - **End Date**: Last day of the operational period
4. Click "Save Changes"

### Rules and Validation

- Both dates must be set together (you cannot set only one)
- End date must be after the start date
- The system validates these rules when you save

### Effects on the Schedule

Once an operational period is configured:

1. **Schedule Navigation**
   - Week selector only allows weeks within the operational period
   - You cannot navigate to weeks outside the defined range
   - Week navigation buttons (Previous/Next) respect the boundaries

2. **Assignment Filtering**
   - Only assignments within the operational period are displayed
   - Assignments outside the period are automatically filtered out
   - This ensures you only see relevant data for your operation

3. **API Behavior**
   - `GET /assignments` endpoint filters by operational period automatically
   - Date range queries are constrained to the operational period
   - Invalid date ranges return appropriate error messages

## Use Cases

### Training Exercise
Set a 3-month operational period for a training cycle:
- Start: 2026-02-01
- End: 2026-05-31

### Short-Term Operation
Define a 2-week operational window:
- Start: 2026-03-01
- End: 2026-03-14

### Removing Operational Period
To remove the operational period restriction:
1. Clear both date fields in Settings
2. Save changes
3. The system will return to unrestricted date navigation

## Technical Details

### Database Schema
- `operationalStartDate`: DATE column (nullable)
- `operationalEndDate`: DATE column (nullable)
- Stored in the `settings` table

### API Endpoints

**Get Settings**
```
GET /settings
```
Returns current operational period configuration.

**Update Settings**
```
PATCH /settings
{
  "operationalStartDate": "2026-02-01",
  "operationalEndDate": "2026-05-31"
}
```

### Frontend Integration
- Settings form includes date pickers for operational period
- Schedule view enforces date boundaries in navigation
- Automatic filtering of assignments by date range

## Best Practices

1. **Plan Ahead**: Set the operational period before creating assignments
2. **Buffer Time**: Consider adding a few days buffer on each end
3. **Clear Communication**: Inform all users of the active operational period
4. **Regular Updates**: Review and update the period as operations evolve

## Troubleshooting

**Cannot navigate to a specific week**
- Verify the operational period includes that week
- Check Settings to confirm dates are configured correctly

**Assignments not appearing**
- Ensure assignment dates fall within the operational period
- Verify the operational period is set correctly in Settings

**Cannot save operational period**
- Confirm both dates are filled in
- Verify end date is after start date
- Check for any validation error messages
