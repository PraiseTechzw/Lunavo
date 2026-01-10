-- Allow user registration (INSERT into users table)
-- This policy allows authenticated users to create their own user record
-- during the sign-up process

-- Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create policy to allow users to insert their own profile during registration
CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  WITH CHECK (
    -- The user must be authenticated (just signed up via Supabase Auth)
    auth.uid() = id
  );

-- Note: This policy ensures that:
-- 1. Users can only create a record for themselves (auth.uid() = id)
-- 2. They must be authenticated (have a valid auth session)
-- 3. The id must match their Supabase Auth user ID
