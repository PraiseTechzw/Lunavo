-- Create a trigger to automatically create a user profile when a new user signs up
-- This allows user creation to bypass RLS policies and works even without a session

-- 1. Create the handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
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
    verified
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'fullName',
    new.raw_user_meta_data->>'studentNumber',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
    new.raw_user_meta_data->>'pseudonym',
    new.raw_user_meta_data->>'program',
    (new.raw_user_meta_data->>'year')::int,
    (new.raw_user_meta_data->>'semester')::int,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'emergencyContactName',
    new.raw_user_meta_data->>'emergencyContactPhone',
    true, -- is_anonymous default
    false -- verified default
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
