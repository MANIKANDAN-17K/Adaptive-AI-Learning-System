-- Migration: Create personality_profiles table
-- Requirements: 18.2, 18.7
-- Description: Creates the personality_profiles table with user_id (UUID, FK), tone_type (VARCHAR), confidence_level (VARCHAR), motivation_index (INTEGER)
--              Includes foreign key constraint to users.id with ON DELETE CASCADE

-- Create personality_profiles table
CREATE TABLE IF NOT EXISTS personality_profiles (
  user_id UUID PRIMARY KEY,
  tone_type VARCHAR(50) NOT NULL,
  confidence_level VARCHAR(20) NOT NULL,
  motivation_index INTEGER NOT NULL CHECK (motivation_index >= 0 AND motivation_index <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_personality_profiles_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create index on user_id for faster lookups (though it's already the PK)
-- This is implicit with PRIMARY KEY, but documenting for clarity

-- Add comments to table and columns
COMMENT ON TABLE personality_profiles IS 'Stores personality profile data from character analysis for personalized learning';
COMMENT ON COLUMN personality_profiles.user_id IS 'Foreign key reference to users table (one profile per user)';
COMMENT ON COLUMN personality_profiles.tone_type IS 'Preferred communication style derived from character analysis';
COMMENT ON COLUMN personality_profiles.confidence_level IS 'Initial confidence assessment (low, medium, high)';
COMMENT ON COLUMN personality_profiles.motivation_index IS 'Motivation score from 0-100';
COMMENT ON COLUMN personality_profiles.created_at IS 'Timestamp when the profile was first created';
COMMENT ON COLUMN personality_profiles.updated_at IS 'Timestamp when the profile was last updated';
