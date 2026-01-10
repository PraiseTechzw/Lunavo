-- IMPROVED TRIGGER WITH LOGGING AND ERROR HANDLING
-- This handles potential type casting issues and adds missing fields like username

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
BEGIN
  -- Safe cast for role with fallback
  BEGIN
    v_role := (new.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'student'::public.user_role;
  END;

  INSERT INTO public.users (
    id,
    email,
    username, -- Added username mapping
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
    new.raw_user_meta_data->>'username', 
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

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
