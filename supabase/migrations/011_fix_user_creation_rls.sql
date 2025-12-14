-- Fix: Add INSERT policy for users table to allow user creation during signup
-- This policy allows authenticated users to insert their own user record
-- The id must match auth.uid() to ensure users can only create their own record

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Drop existing function if it exists (for idempotency)
-- Drop all overloaded versions by using CASCADE
DROP FUNCTION IF EXISTS create_user_profile CASCADE;

-- Also try dropping with the exact signature in case CASCADE doesn't work
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, user_role, TEXT, JSONB);

-- Create a function that allows user creation with SECURITY DEFINER
-- This bypasses RLS and allows the function to insert on behalf of the caller
-- Works even when email confirmation is required (no active session)
CREATE OR REPLACE FUNCTION create_user_profile(
  p_id UUID,
  p_email TEXT,
  p_username TEXT,
  p_student_number TEXT,
  p_phone TEXT,
  p_emergency_contact_name TEXT,
  p_emergency_contact_phone TEXT,
  p_location TEXT,
  p_preferred_contact_method TEXT,
  p_role user_role,
  p_pseudonym TEXT,
  p_profile_data JSONB
) RETURNS users AS $$
DECLARE
  v_user users;
  v_auth_user_exists BOOLEAN;
BEGIN
  -- Verify that the user exists in auth.users table
  -- This works even if email isn't confirmed yet (no active session)
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_id) INTO v_auth_user_exists;
  
  IF NOT v_auth_user_exists THEN
    RAISE EXCEPTION 'Unauthorized: User does not exist in auth.users';
  END IF;

  -- Verify email matches (additional security check)
  IF EXISTS(SELECT 1 FROM auth.users WHERE id = p_id AND email != p_email) THEN
    RAISE EXCEPTION 'Unauthorized: Email does not match auth user email';
  END IF;

  -- Insert the user record (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO users (
    id, email, username, student_number, phone,
    emergency_contact_name, emergency_contact_phone, location,
    preferred_contact_method, role, pseudonym, is_anonymous,
    verified, profile_data
  ) VALUES (
    p_id, p_email, p_username, p_student_number, p_phone,
    p_emergency_contact_name, p_emergency_contact_phone, p_location,
    p_preferred_contact_method::user_role, p_role, p_pseudonym, true,
    false, p_profile_data
  )
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
-- Anon is needed because users might not have a session yet (email confirmation required)
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated, anon;

-- Also create a regular INSERT policy as a fallback
-- This allows direct inserts when the user has an active session
CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    auth.role() = 'authenticated'
  );

-- Add comments
COMMENT ON FUNCTION create_user_profile IS 
  'Allows authenticated users to create their own user record during signup. Bypasses RLS using SECURITY DEFINER.';
COMMENT ON POLICY "Users can create own profile" ON users IS 
  'Allows authenticated users to create their own user record during signup. The user ID must match the authenticated user ID.';
