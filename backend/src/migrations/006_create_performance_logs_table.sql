-- Migration: Create performance_logs table
-- Requirements: 18.6, 18.7
-- Description: Creates the performance_logs table with session_id (UUID, FK), accuracy (FLOAT), speed (FLOAT), attempts (INTEGER), timestamp (TIMESTAMP)
--              Includes foreign key constraint to sessions.id with ON DELETE CASCADE

-- Create performance_logs table
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

-- Create index on session_id for faster lookups when querying performance logs by session
CREATE INDEX IF NOT EXISTS idx_performance_logs_session_id ON performance_logs(session_id);

-- Create index on timestamp for sorting performance logs chronologically
CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp ON performance_logs(timestamp DESC);

-- Create composite index for session_id and timestamp for efficient performance trend queries
CREATE INDEX IF NOT EXISTS idx_performance_logs_session_timestamp ON performance_logs(session_id, timestamp DESC);

-- Add comments to table and columns
COMMENT ON TABLE performance_logs IS 'Stores performance metrics for each learning interaction to enable adaptive adjustments';
COMMENT ON COLUMN performance_logs.id IS 'Unique identifier for the performance log entry (UUID)';
COMMENT ON COLUMN performance_logs.session_id IS 'Foreign key reference to sessions table';
COMMENT ON COLUMN performance_logs.accuracy IS 'Correctness score (0-100) for the learning interaction';
COMMENT ON COLUMN performance_logs.speed IS 'Response speed score (0-100) for the learning interaction';
COMMENT ON COLUMN performance_logs.attempts IS 'Number of attempts made for the task (must be positive)';
COMMENT ON COLUMN performance_logs.timestamp IS 'Timestamp when the performance was recorded';
