# Migration 008: Add Mentor Mode Preference to Sessions

## Overview
This migration adds the `mentor_mode_preference` column to the `sessions` table to persist the user's selected mentor interaction style.

## Requirements
- Requirements: 5.2, 5.3
- Task: 23.2 Implement mode change handler

## Changes
- Adds `mentor_mode_preference` VARCHAR(50) column with default value 'Professional'
- Adds CHECK constraint to ensure only valid mentor modes are stored
- Valid values: 'Professional', 'Friendly', 'Supportive', 'Challenger'

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Log in to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `008_add_mentor_mode_to_sessions.sql`
4. Paste and execute in the SQL Editor

### Option 2: Supabase CLI
```bash
# Copy the migration file to your Supabase migrations directory
cp backend/src/migrations/008_add_mentor_mode_to_sessions.sql supabase/migrations/

# Push to remote
supabase db push
```

## Verification
After applying the migration, verify with:

```sql
-- Check that the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'sessions' AND column_name = 'mentor_mode_preference';

-- Check the constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'check_mentor_mode_preference';
```

## Rollback
If you need to rollback this migration:

```sql
-- Remove the constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS check_mentor_mode_preference;

-- Remove the column
ALTER TABLE sessions DROP COLUMN IF EXISTS mentor_mode_preference;
```

## Related Files
- Backend endpoint: `backend/src/routes/sessions.ts` (PUT /api/sessions/:sessionId/mentor-mode)
- Frontend component: `frontend/src/components/LearningSession.tsx` (handleMentorModeChange)
- API client: `frontend/src/services/apiClient.ts` (updateMentorMode method)
- Type definition: `backend/src/types.ts` (Session interface)
