-- Update users table to integrate with Supabase Auth
-- Run this if you've already run 001_initial_schema.sql
-- This migration safely updates the users table without losing data

-- Step 1: Drop all foreign key constraints that reference users table
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE replies DROP CONSTRAINT IF EXISTS replies_author_id_fkey;
ALTER TABLE replies DROP CONSTRAINT IF EXISTS replies_author_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reviewed_by_fkey;
ALTER TABLE escalations DROP CONSTRAINT IF EXISTS escalations_assigned_to_fkey;
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_created_by_fkey;
ALTER TABLE meeting_attendance DROP CONSTRAINT IF EXISTS meeting_attendance_user_id_fkey;
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE streaks DROP CONSTRAINT IF EXISTS streaks_user_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_created_by_fkey;
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_user_id_fkey;

-- Step 2: Remove password_hash column (Supabase Auth handles passwords)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Step 3: Drop the default value and constraint on id
-- We'll update it to reference auth.users
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- Step 4: Add foreign key constraint to auth.users
-- Note: This requires that all existing user IDs match auth.users IDs
-- If you have existing data, you'll need to sync them first
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_id_fkey' 
    AND conrelid = 'users'::regclass
  ) THEN
    -- Add foreign key constraint
    ALTER TABLE users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 5: Recreate all foreign key constraints
ALTER TABLE posts 
  ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE replies 
  ADD CONSTRAINT replies_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reports 
  ADD CONSTRAINT reports_reporter_id_fkey 
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reports 
  ADD CONSTRAINT reports_reviewed_by_fkey 
  FOREIGN KEY (reviewed_by) REFERENCES users(id);

ALTER TABLE escalations 
  ADD CONSTRAINT escalations_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES users(id);

ALTER TABLE meetings 
  ADD CONSTRAINT meetings_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE meeting_attendance 
  ADD CONSTRAINT meeting_attendance_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_badges 
  ADD CONSTRAINT user_badges_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE streaks 
  ADD CONSTRAINT streaks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE resources 
  ADD CONSTRAINT resources_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE check_ins 
  ADD CONSTRAINT check_ins_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Note: 
-- - If you have existing user data, make sure their IDs match auth.users IDs
-- - For new users, the ID will come from Supabase Auth automatically
-- - The password_hash column has been removed as Supabase Auth handles passwords

