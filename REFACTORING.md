# Show Structure Refactoring

This refactoring implements a new structure for managing shows and shifts in the Rep Volunteers system.

## What's Changed

### Database Structure

1. **Shows Table**: Now only contains show information (name), not specific dates
   - `id` - Primary key
   - `name` - Show name (unique)
   - `created_at` - When the show was created

2. **Show Dates Table**: Contains specific performance dates for each show
   - `id` - Primary key
   - `show_id` - References shows table
   - `date` - Performance date
   - `start_time` - Show start time
   - `end_time` - Show end time

3. **Shifts Table**: Updated to reference show dates and renamed time fields
   - `id` - Primary key
   - `show_date_id` - References show_dates table (instead of shows)
   - `role` - Role name
   - `arrive_time` - When volunteers should arrive (renamed from start_time)
   - `depart_time` - When volunteers can leave (renamed from end_time)

### New Features

#### Show Management
- Create a show with a name and multiple performance dates
- View shows with expandable date listings
- Shows can have multiple performance dates

#### Shift Management
- **Bulk Shift Creation**: Select multiple show dates and roles to create many shifts at once
- **Default Roles**: Pre-defined list of common roles with checkboxes:
  - FOH Manager
  - FOH 2IC
  - Usher #1 (Remain FOH)
  - Usher #2 (Can watch show)
  - Usher #3 (Can watch show)
  - Usher #4 (Can watch show)
  - Usher #5 (Can watch show)
  - Tea & Coffee #1
  - Tea & Coffee #2
  - Raffle
  - Box Office
- **Custom Roles**: Add custom roles as needed
- **Time-based Creation**: Only enter arrive and depart times (not full datetime)
- **Next Day Warning**: Automatically detects when depart time is before arrive time and saves as next day

#### User Interface Improvements
- Clearer labeling: "Arrive Time" and "Depart Time" instead of "Start" and "End"
- Calendar-based date selection for shows
- Checkbox-based role selection
- Visual indicators for next-day shifts
- Better organization of show and shift information

## Migration

To migrate from the old structure to the new one:

```bash
deno run --allow-net --allow-env --allow-read migrate.ts
```

This will:
1. Backup existing data
2. Create new table structure
3. Migrate existing shows and shifts to the new format
4. Preserve all volunteer assignments

## API Changes

### New Endpoints
- `GET /admin/api/shows` - List all shows with summary information
- `GET /admin/api/shows/:showId/dates` - Get performance dates for a specific show
- `GET /admin/api/shifts/default-roles` - Get list of default roles
- `GET /admin/api/shifts` - List all shifts with enhanced information

### Modified Endpoints
- `POST /admin/api/shows` - Now accepts `{ name, dates: [...] }` format
- `POST /admin/api/shifts` - Now accepts bulk creation with multiple dates and roles

## Benefits

1. **Better Organization**: Shows are now logical groupings of performances
2. **Bulk Operations**: Create multiple shifts across dates and roles efficiently
3. **Reporting**: Can report on shows as a whole or individual performances
4. **User Experience**: Clearer terminology and workflow for volunteers
5. **Flexibility**: Easy to add new roles and handle complex scheduling scenarios
