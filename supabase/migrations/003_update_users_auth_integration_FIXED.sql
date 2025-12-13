-- Update users table to integrate with Supabase Auth
-- This version safely handles foreign key dependencies

-- IMPORTANT: This migration assumes you're starting fresh or have synced user IDs
-- If you have existing users, their IDs must match auth.users IDs

-- Step 1: Remove password_hash column (Supabase Auth handles passwords)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Step 2: Drop the default value from id (IDs should come from auth.users, not be auto-generated)
ALTER TABLE users ALTER COLUMN id DROP DEFAULT IF EXISTS;

-- Step 3: Add foreign key constraint to auth.users
-- Note: This will fail if existing user IDs don't match auth.users IDs
-- For new installations, this is fine. For existing data, sync IDs first.
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_id_fkey' 
    AND conrelid = 'users'::regclass
  ) THEN
    -- Try to add the foreign key constraint
    BEGIN
      ALTER TABLE users 
      ADD CONSTRAINT users_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'Foreign key constraint added successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not add foreign key constraint. Existing user IDs may not match auth.users IDs. Error: %', SQLERRM;
      RAISE WARNING 'You may need to sync existing user IDs with auth.users first.';
    END;
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Step 4: Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Note: 
-- - If you get an error about foreign key constraint, your existing user IDs don't match auth.users
-- - For a fresh database, this will work fine
-- - For existing data, you'll need to either:
--   1. Delete existing users and recreate them through Supabase Auth
--   2. Manually sync IDs between users table and auth.users

