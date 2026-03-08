-- Migration: Add conversation history and behavior metadata to sessions table
-- Description: Adds columns to store conversation memory and behavior analysis data

-- Add conversation_history column to store last 5 exchanges
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS conversation_history JSONB DEFAULT '[]'::jsonb;

-- Add behavior_metadata column to store user behavior analysis
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS behavior_metadata JSONB DEFAULT '{}'::jsonb;

-- Add mentor_mode_preference column if it doesn't exist
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS mentor_mode_preference VARCHAR(50);

-- Add comments
COMMENT ON COLUMN sessions.conversation_history IS 'Stores last 5 user-assistant message exchanges for conversation memory';
COMMENT ON COLUMN sessions.behavior_metadata IS 'Stores behavior analysis data (tone, confidence, slang level, language)';
COMMENT ON COLUMN sessions.mentor_mode_preference IS 'User-selected mentor mode preference (Professional, Friendly, Supportive, Challenger)';

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_sessions_conversation_history ON sessions USING GIN (conversation_history);
CREATE INDEX IF NOT EXISTS idx_sessions_behavior_metadata ON sessions USING GIN (behavior_metadata);
