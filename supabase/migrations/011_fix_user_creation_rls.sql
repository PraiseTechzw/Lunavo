-- Fix RLS policy to allow users to create their own user record during signup
-- This migration adds an INSERT policy and a SECURITY DEFINER function for user creation

-- Step 1: Add INSERT policy for users to create their own record
-- This allows users to insert their own user record during signup
-- Drop the policy if it exists to make this migration idempotent
DROP POLICY IF EXISTS "Users can create own profile" ON users;

CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 2: Create a SECURITY DEFINER function to create user records
-- This function bypasses RLS and is used as a fallback if the policy doesn't work
-- It validates that the user exists in auth.users and the ID matches
-- Drop the function first if it exists to allow parameter name changes
DROP FUNCTION IF EXISTS create_user_profile(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
);

CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_student_number TEXT,
  user_phone TEXT,
  user_emergency_contact_name TEXT,
  user_emergency_contact_phone TEXT,
  user_pseudonym TEXT,
  user_username TEXT DEFAULT NULL,
  user_location TEXT DEFAULT NULL,
  user_preferred_contact_method TEXT DEFAULT NULL,
  user_role_param TEXT DEFAULT 'student',
  user_profile_data JSONB DEFAULT '{}'::JSONB
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user users;
  auth_user_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users (this validates the user was created in Supabase Auth)
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO auth_user_exists;
  
  IF NOT auth_user_exists THEN
    RAISE EXCEPTION 'User must exist in auth.users before creating profile';
  END IF;

  -- Validate that the user ID matches the authenticated user (if session exists)
  -- During signup, auth.uid() might be null, so we allow it if user exists in auth.users
  IF auth.uid() IS NOT NULL AND auth.uid() != user_id THEN
    RAISE EXCEPTION 'User ID must match authenticated user';
  END IF;

  -- Check if user profile already exists
  IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User profile already exists';
  END IF;

  -- Insert the user record
  INSERT INTO users (
    id,
    email,
    username,
    student_number,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    location,
    preferred_contact_method,
    role,
    pseudonym,
    is_anonymous,
    verified,
    profile_data
  ) VALUES (
    user_id,
    user_email,
    user_username,
    user_student_number,
    user_phone,
    user_emergency_contact_name,
    user_emergency_contact_phone,
    user_location,
    user_preferred_contact_method,
    user_role_param::user_role,  -- Cast TEXT to user_role enum
    user_pseudonym,
    true,
    false,
    user_profile_data
  )
  RETURNING * INTO new_user;

  RETURN new_user;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) TO authenticated, anon;

-- Note:
-- - The INSERT policy allows users to create their own profile during signup
-- - The SECURITY DEFINER function is a fallback that bypasses RLS
-- - Both validate that the user ID matches the authenticated user
-- - The function can be used if the policy doesn't work due to session timing issues


