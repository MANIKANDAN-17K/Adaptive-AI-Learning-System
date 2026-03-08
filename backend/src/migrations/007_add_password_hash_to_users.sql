-- Migration: Add password_hash to users table
-- Requirements: 1.1, 1.2
-- Description: Adds password_hash column to users table for authentication

-- Add password_hash column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add comment to column
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for user authentication';
