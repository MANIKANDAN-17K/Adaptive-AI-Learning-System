-- ============================================================================
-- COMPLETE DATABASE MIGRATION SCRIPT
-- Adaptive AI Skill Mentor
-- ============================================================================
-- 
-- This script applies all database migrations in the correct order.
-- Run this in your Supabase SQL Editor to set up the complete database schema.
--
-- IMPORTANT: This script is idempotent - it can be run multiple times safely.
-- ============================================================================

-- Migration 001: Create users table
-- Requirements: 18.1
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON TABLE users IS 'Stores user account information for the Adaptive AI Skill Mentor platform';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user (UUID)';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';

-- Migration 007: Add password_hash to users table
-- Requirements: 1.1, 1.2
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for user authentication';

-- Migration 002: Create personality_profiles table
-- Requirements: 18.2, 18.7
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

COMMENT ON TABLE personality_profiles IS 'Stores personality profile data from character analysis for personalized learning';
COMMENT ON COLUMN personality_profiles.user_id IS 'Foreign key reference to users table (one profile per user)';
COMMENT ON COLUMN personality_profiles.tone_type IS 'Preferred communication style derived from character analysis';
COMMENT ON COLUMN personality_profiles.confidence_level IS 'Initial confidence assessment (low, medium, high)';
COMMENT ON COLUMN personality_profiles.motivation_index IS 'Motivation score from 0-100';

-- Migration 003: Create skills table
-- Requirements: 18.3, 18.7
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

CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_created_at ON skills(created_at);

COMMENT ON TABLE skills IS 'Stores user skills and learning goals for the Adaptive AI Skill Mentor platform';
COMMENT ON COLUMN skills.id IS 'Unique identifier for the skill (UUID)';
COMMENT ON COLUMN skills.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN skills.skill_name IS 'Name of the skill the user wants to develop';
COMMENT ON COLUMN skills.goal IS 'User learning objective and desired outcome';
COMMENT ON COLUMN skills.timeline IS 'Expected completion time in days (must be positive)';

-- Migration 004: Create roadmaps table
-- Requirements: 18.4, 18.7
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

CREATE INDEX IF NOT EXISTS idx_roadmaps_skill_id ON roadmaps(skill_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_structure_json ON roadmaps USING GIN (structure_json);

COMMENT ON TABLE roadmaps IS 'Stores personalized learning roadmaps with sequential nodes for each skill';
COMMENT ON COLUMN roadmaps.id IS 'Unique identifier for the roadmap (UUID)';
COMMENT ON COLUMN roadmaps.skill_id IS 'Foreign key reference to skills table (one roadmap per skill)';
COMMENT ON COLUMN roadmaps.structure_json IS 'Complete roadmap structure with nodes, thresholds, and learning content (JSONB format)';
COMMENT ON COLUMN roadmaps.mastery_threshold IS 'Default mastery threshold for nodes (0-100)';

-- Migration 005: Create sessions table
-- Requirements: 18.5, 18.7
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

CREATE INDEX IF NOT EXISTS idx_sessions_skill_id ON sessions(skill_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity DESC);

COMMENT ON TABLE sessions IS 'Stores learning session data including mastery scores, confidence levels, and recap summaries';
COMMENT ON COLUMN sessions.id IS 'Unique identifier for the session (UUID)';
COMMENT ON COLUMN sessions.skill_id IS 'Foreign key reference to skills table';
COMMENT ON COLUMN sessions.recap_summary IS 'Summary of the session for generating recaps when resuming';
COMMENT ON COLUMN sessions.mastery_score IS 'Current mastery score (0-100) calculated as (accuracy × 0.7) + (speed × 0.3)';
COMMENT ON COLUMN sessions.confidence_level IS 'Derived confidence level (low, medium, high) based on language tone and performance';

-- Migration 008: Add mentor_mode_preference to sessions table
-- Requirements: 5.2, 5.3
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS mentor_mode_preference VARCHAR(50) DEFAULT 'Professional';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_mentor_mode_preference'
  ) THEN
    ALTER TABLE sessions
    ADD CONSTRAINT check_mentor_mode_preference 
    CHECK (mentor_mode_preference IN ('Professional', 'Friendly', 'Supportive', 'Challenger'));
  END IF;
END $$;

COMMENT ON COLUMN sessions.mentor_mode_preference IS 'User-selected mentor interaction style (Professional, Friendly, Supportive, or Challenger)';

-- Migration 006: Create performance_logs table
-- Requirements: 18.6, 18.7
CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  accuracy FLOAT NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  speed FLOAT NOT NULL CHECK (speed >= 0 AND speed <= 100),
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_performance_logs_session
    FOREIGN KEY (session_id)
    REFERENCES sessions(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_performance_logs_session_id ON performance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp ON performance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_session_timestamp ON performance_logs(session_id, timestamp DESC);

COMMENT ON TABLE performance_logs IS 'Stores performance metrics for each learning interaction to enable adaptive adjustments';
COMMENT ON COLUMN performance_logs.id IS 'Unique identifier for the performance log entry (UUID)';
COMMENT ON COLUMN performance_logs.session_id IS 'Foreign key reference to sessions table';
COMMENT ON COLUMN performance_logs.accuracy IS 'Correctness score (0-100) for the learning interaction';
COMMENT ON COLUMN performance_logs.speed IS 'Response speed score (0-100) for the learning interaction';
COMMENT ON COLUMN performance_logs.attempts IS 'Number of attempts made for the task (must be positive)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the migration was successful

-- Check all tables exist
SELECT 'Tables Created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'personality_profiles', 'skills', 'roadmaps', 'sessions', 'performance_logs')
ORDER BY table_name;

-- Check foreign key constraints
SELECT 'Foreign Key Constraints:' as status;
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('personality_profiles', 'skills', 'roadmaps', 'sessions', 'performance_logs')
ORDER BY tc.table_name;

-- Check indexes
SELECT 'Indexes Created:' as status;
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'personality_profiles', 'skills', 'roadmaps', 'sessions', 'performance_logs')
ORDER BY tablename, indexname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Database migration completed successfully!' as message;
SELECT 'All tables, constraints, and indexes have been created.' as details;
SELECT 'You can now start the backend server and begin using the application.' as next_step;
