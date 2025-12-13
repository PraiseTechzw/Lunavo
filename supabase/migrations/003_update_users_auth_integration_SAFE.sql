-- SAFE Update users table to integrate with Supabase Auth
-- This version only removes password_hash and adds the foreign key
-- Use this if you want to keep existing data structure

-- Step 1: Remove password_hash column (Supabase Auth handles passwords)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Step 2: Add foreign key constraint to auth.users (if it doesn't exist)
-- This makes the users.id reference auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_id_fkey' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Remove default from id column (IDs should come from auth.users)
ALTER TABLE users ALTER COLUMN id DROP DEFAULT IF EXISTS;

-- Note: 
-- - Existing user IDs must match auth.users IDs for this to work
-- - For new users, create them through Supabase Auth first, then create the user record
-- - The password_hash column is removed as Supabase Auth handles authentication

