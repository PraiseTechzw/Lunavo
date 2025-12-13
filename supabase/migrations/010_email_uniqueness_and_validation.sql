-- Ensure email uniqueness and add email availability check function
-- This migration ensures emails cannot be registered multiple times

-- Step 1: Add unique constraint to email column in users table (if not exists)
-- Note: Supabase Auth already enforces email uniqueness, but we add this for extra safety
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_unique'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- Step 2: Create function to check email availability (for real-time validation)
-- This function checks both the users table and auth.users table
CREATE OR REPLACE FUNCTION check_email_available(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  -- Normalize email to lowercase
  check_email := LOWER(TRIM(check_email));
  
  -- Validate email format
  IF check_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN false;
  END IF;
  
  -- Check if email exists in users table
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE LOWER(email) = check_email
  ) INTO email_exists;
  
  IF email_exists THEN
    RETURN false;
  END IF;
  
  -- Check if email exists in auth.users table (Supabase Auth)
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE LOWER(email) = check_email
  ) INTO email_exists;
  
  IF email_exists THEN
    RETURN false;
  END IF;
  
  -- Email is available
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_email_available(TEXT) TO authenticated, anon;

-- Create index on email for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- Note:
-- - Email uniqueness is enforced at both database and auth level
-- - Real-time validation can use check_email_available() function
-- - Function returns false if email format is invalid or email already exists

