-- Function to check if email is available (NOT taken)
-- This bypasses RLS for the purpose of checking availability during registration
CREATE OR REPLACE FUNCTION check_email_available(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  -- Check if email exists in our users table
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE email = LOWER(TRIM(check_email))
  ) INTO email_exists;
  
  -- Return true if email is NOT taken (available)
  RETURN NOT email_exists;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION check_email_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_available(TEXT) TO anon;
