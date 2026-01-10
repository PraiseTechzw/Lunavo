-- MASTER FIX FOR REGISTRATION
-- This migration ensures all necessary columns exist and sets up the auto-creation trigger
-- It is designed to be safe to run multiple times

-- 1. Ensure all columns exist (from migration 012 and 013)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS academic_year INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS academic_semester INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS academic_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- 2. Create the Trigger Function to handle new user creation
-- Uses ON CONFLICT to handle cases where the user might partially exist
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
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    student_number = EXCLUDED.student_number,
    program = EXCLUDED.program,
    academic_year = EXCLUDED.academic_year,
    academic_semester = EXCLUDED.academic_semester,
    phone = EXCLUDED.phone,
    emergency_contact_name = EXCLUDED.emergency_contact_name,
    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create/Replace the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Ensure RLS policies don't block Selects
-- (The Insert is handled by the trigger aka system, but the app needs to Select after)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- 5. Helper function for availability checks (just in case they were missed)
CREATE OR REPLACE FUNCTION check_email_available(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(check_email)
  ) AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = lower(check_email)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION check_email_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_available(TEXT) TO anon;
