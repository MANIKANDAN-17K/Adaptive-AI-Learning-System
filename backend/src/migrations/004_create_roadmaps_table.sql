-- Migration: Create roadmaps table
-- Requirements: 18.4, 18.7
-- Description: Creates the roadmaps table with id (UUID, PK), skill_id (UUID, FK), structure_json (JSONB), mastery_threshold (FLOAT)
--              Includes foreign key constraint to skills.id with ON DELETE CASCADE

-- Create roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL UNIQUE,
  structure_json JSONB NOT NULL,
  mastery_threshold FLOAT NOT NULL CHECK (mastery_threshold >= 0 AND mastery_threshold <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_roadmaps_skill
    FOREIGN KEY (skill_id)
    REFERENCES skills(id)
    ON DELETE CASCADE
);

-- Create index on skill_id for faster lookups when querying roadmaps by skill
CREATE INDEX IF NOT EXISTS idx_roadmaps_skill_id ON roadmaps(skill_id);

-- Create GIN index on structure_json for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_roadmaps_structure_json ON roadmaps USING GIN (structure_json);

-- Add comments to table and columns
COMMENT ON TABLE roadmaps IS 'Stores personalized learning roadmaps with sequential nodes for each skill';
COMMENT ON COLUMN roadmaps.id IS 'Unique identifier for the roadmap (UUID)';
COMMENT ON COLUMN roadmaps.skill_id IS 'Foreign key reference to skills table (one roadmap per skill)';
COMMENT ON COLUMN roadmaps.structure_json IS 'Complete roadmap structure with nodes, thresholds, and learning content (JSONB format)';
COMMENT ON COLUMN roadmaps.mastery_threshold IS 'Default mastery threshold for nodes (0-100)';
COMMENT ON COLUMN roadmaps.created_at IS 'Timestamp when the roadmap was generated';
