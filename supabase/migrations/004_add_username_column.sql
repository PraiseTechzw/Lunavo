-- Add username column to users table for anonymous usernames
-- This migration adds support for unique anonymous usernames

-- Step 1: Add username column (nullable initially to allow existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Step 2: Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Step 3: Add constraint to ensure username format (alphanumeric, underscore, hyphen, 3-20 chars)
-- Note: This is enforced at the application level, but we can add a check constraint too
ALTER TABLE users
ADD CONSTRAINT username_format_check 
CHECK (
  username IS NULL OR 
  (LENGTH(username) >= 3 AND LENGTH(username) <= 20 AND username ~ '^[a-z0-9_-]+$')
);

-- Note:
-- - Username is optional (nullable) to support existing users
-- - Username must be unique when provided
-- - Username format: 3-20 characters, lowercase alphanumeric, underscore, or hyphen only
-- - Index is created for fast username lookups during availability checks

