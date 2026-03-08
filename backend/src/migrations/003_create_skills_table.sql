-- Migration: Create skills table
-- Requirements: 18.3, 18.7
-- Description: Creates the skills table with id (UUID, PK), user_id (UUID, FK), skill_name (VARCHAR), goal (TEXT), timeline (INTEGER), created_at (TIMESTAMP)
--              Includes foreign key constraint to users.id with ON DELETE CASCADE

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  goal TEXT NOT NULL,
  timeline INTEGER NOT NULL CHECK (timeline > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_skills_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create index on user_id for faster lookups when querying skills by user
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);

-- Create index on created_at for sorting skills by creation date
CREATE INDEX IF NOT EXISTS idx_skills_created_at ON skills(created_at);

-- Add comments to table and columns
COMMENT ON TABLE skills IS 'Stores user skills and learning goals for the Adaptive AI Skill Mentor platform';
COMMENT ON COLUMN skills.id IS 'Unique identifier for the skill (UUID)';
COMMENT ON COLUMN skills.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN skills.skill_name IS 'Name of the skill the user wants to develop';
COMMENT ON COLUMN skills.goal IS 'User learning objective and desired outcome';
COMMENT ON COLUMN skills.timeline IS 'Expected completion time in days (must be positive)';
COMMENT ON COLUMN skills.created_at IS 'Timestamp when the skill was created';
