-- DEBUG SCRIPT: MANUAL INSERT TEST
-- Run this to find out EXACTLY why the database is rejecting the user data.
-- Look at the "Messages" or "Results" tab after running.

DO $$
DECLARE
  v_fake_id uuid := gen_random_uuid(); -- Random ID (won't match auth, so expected to fail on FK)
BEGIN
  RAISE NOTICE 'Attempting Manual Insert...';

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
    verified
  ) VALUES (
    v_fake_id,
    'debug_test@gmail.com',
    'DebugUser',
    'Debug Fullname',
    'DEBUG_STD_123',
    'student'::public.user_role,
    'DebugPseudonym',
    'Bachelor of Science (Hons) in Information Technology',
    3,
    2,
    '+263786223289',
    'Debug Contact',
    '+263786223289',
    true,
    false
  );

  RAISE NOTICE 'SUCCESS: Table structure is correct. (Rolling back now)';
  RAISE EXCEPTION 'Test Complete - Rollback'; -- Force rollback to clean up

EXCEPTION WHEN OTHERS THEN
  -- IF YOU SEE THIS MESSAGE, IT TELLS YOU THE REAL ERROR:
  RAISE NOTICE '---------------------------------------------------';
  RAISE NOTICE 'FAILED: %', SQLERRM;
  RAISE NOTICE '---------------------------------------------------';
END;
$$;
