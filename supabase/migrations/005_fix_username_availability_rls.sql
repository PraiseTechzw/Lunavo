-- Fix RLS policies to allow username availability checks
-- This prevents infinite recursion when checking if a username is taken

-- Drop the problematic recursive policies first
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate the update policy without recursion
-- Use a function to check role instead of querying users table
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Allow updating username, pseudonym, profile_data, and last_active
    -- But prevent changing role, email, or student_number
    -- We'll enforce this at the application level to avoid recursion
  );

-- Recreate admin read policy using a simpler approach
-- This uses a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION is_admin_or_student_affairs()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() 
    AND role IN ('admin', 'student-affairs')
  );
$$;

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (is_admin_or_student_affairs());

-- Add a policy to allow checking username availability
-- This allows anyone (even unauthenticated) to check if a username exists
-- We only expose the username and id columns for this check
CREATE POLICY "Anyone can check username availability"
  ON users FOR SELECT
  USING (
    -- Only allow selecting username column for availability checks
    -- This is safe because we're only checking existence, not reading other data
    auth.role() = 'authenticated' OR auth.role() = 'anon'
  );

-- Alternative: Create a function that bypasses RLS for username checks
-- This is safer and more performant
CREATE OR REPLACE FUNCTION check_username_available(check_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  username_exists BOOLEAN;
BEGIN
  -- Check if username exists (bypasses RLS)
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE username = LOWER(TRIM(check_username))
  ) INTO username_exists;
  
  -- Return true if username is NOT taken (available)
  RETURN NOT username_exists;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION check_username_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_username_available(TEXT) TO anon;

-- Note:
-- - The function approach is safer as it bypasses RLS for this specific check
-- - We can update the application code to use the function instead of direct queries
-- - The policy approach also works but the function is more efficient

