-- FIX USERNAME CONSTRAINT ERROR
-- The database requires usernames to be lowercase, but the signup was sending mixed case.
-- This script updates the trigger to force-lowercase the username BEFORE inserting.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_username text;
BEGIN
  -- Safe cast for role
  BEGIN
    v_role := (new.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'student'::public.user_role;
  END;

  -- Force lowercase and trim for username to satisfy "username_format_check"
  v_username := LOWER(TRIM(new.raw_user_meta_data->>'username'));
  
  -- Fallback if username is null (auto-generate to prevent crash)
  IF v_username IS NULL OR v_username = '' THEN
     v_username := 'user_' || SUBSTRING(new.id::text FROM 1 FOR 8);
  END IF;

  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    student_number,
    role,
    pseudonym,
    program,
    academic_year,
    academic_semester,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    is_anonymous,
    verified,
    last_active,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_username, -- Use the validated lowercase variable
    new.raw_user_meta_data->>'fullName',
    new.raw_user_meta_data->>'studentNumber',
    COALESCE(v_role, 'student'::public.user_role),
    new.raw_user_meta_data->>'pseudonym',
    new.raw_user_meta_data->>'program',
    (new.raw_user_meta_data->>'year')::int,
    (new.raw_user_meta_data->>'semester')::int,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'emergencyContactName',
    new.raw_user_meta_data->>'emergencyContactPhone',
    true,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    student_number = EXCLUDED.student_number,
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger (Just to be sure)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
