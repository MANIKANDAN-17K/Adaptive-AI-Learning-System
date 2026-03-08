-- Migration: Add mentor_mode_preference to sessions table
-- Requirements: 5.2, 5.3
-- Description: Adds mentor_mode_preference column to sessions table to persist user's selected mentor mode

-- Add mentor_mode_preference column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS mentor_mode_preference VARCHAR(50) DEFAULT 'Professional';

-- Add check constraint to ensure only valid mentor modes
ALTER TABLE sessions
ADD CONSTRAINT check_mentor_mode_preference 
CHECK (mentor_mode_preference IN ('Professional', 'Friendly', 'Supportive', 'Challenger'));

-- Add comment to column
COMMENT ON COLUMN sessions.mentor_mode_preference IS 'User-selected mentor interaction style (Professional, Friendly, Supportive, or Challenger)';
