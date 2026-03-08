-- Migration: Create sessions table
-- Requirements: 18.5, 18.7
-- Description: Creates the sessions table with id (UUID, PK), skill_id (UUID, FK), recap_summary (TEXT), mastery_score (FLOAT), confidence_level (VARCHAR), last_activity (TIMESTAMP)
--              Includes foreign key constraint to skills.id with ON DELETE CASCADE

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL,
  recap_summary TEXT,
  mastery_score FLOAT CHECK (mastery_score >= 0 AND mastery_score <= 100),
  confidence_level VARCHAR(50),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_sessions_skill
    FOREIGN KEY (skill_id)
    REFERENCES skills(id)
    ON DELETE CASCADE
);

-- Create index on skill_id for faster lookups when querying sessions by skill
CREATE INDEX IF NOT EXISTS idx_sessions_skill_id ON sessions(skill_id);

-- Create index on last_activity for sorting sessions by recent activity
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity DESC);

-- Add comments to table and columns
COMMENT ON TABLE sessions IS 'Stores learning session data including mastery scores, confidence levels, and recap summaries';
COMMENT ON COLUMN sessions.id IS 'Unique identifier for the session (UUID)';
COMMENT ON COLUMN sessions.skill_id IS 'Foreign key reference to skills table';
COMMENT ON COLUMN sessions.recap_summary IS 'Summary of the session for generating recaps when resuming';
COMMENT ON COLUMN sessions.mastery_score IS 'Current mastery score (0-100) calculated as (accuracy × 0.7) + (speed × 0.3)';
COMMENT ON COLUMN sessions.confidence_level IS 'Derived confidence level (low, medium, high) based on language tone and performance';
COMMENT ON COLUMN sessions.last_activity IS 'Timestamp of the last interaction in this session';
COMMENT ON COLUMN sessions.created_at IS 'Timestamp when the session was created';
