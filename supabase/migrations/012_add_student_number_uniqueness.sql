-- Add unique constraint to student_number column
-- This ensures no two users can have the same student number
-- Also creates an index for faster lookups

-- Step 1: Add unique constraint to student_number
-- This will prevent duplicate student numbers at the database level
DO $$ 
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_student_number_unique'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_student_number_unique UNIQUE (student_number);
  END IF;
END $$;

-- Step 2: Create index on student_number for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);

-- Step 3: Create a function to check student number availability
-- This function can be used for real-time validation
CREATE OR REPLACE FUNCTION check_student_number_available(check_student_number TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_number_exists BOOLEAN;
BEGIN
  -- Normalize student number to uppercase
  check_student_number := UPPER(TRIM(check_student_number));
  
  -- Validate student number format (CUT format: Letter + 8 digits + Letter)
  IF check_student_number !~ '^[A-Z]\d{8}[A-Z]$' THEN
    RETURN false;
  END IF;
  
  -- Check if student number exists in users table
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE UPPER(TRIM(student_number)) = check_student_number
  ) INTO student_number_exists;
  
  IF student_number_exists THEN
    RETURN false;
  END IF;
  
  -- Student number is available
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION check_student_number_available(TEXT) TO authenticated, anon;

-- Note:
-- - Unique constraint ensures database-level enforcement
-- - Index improves query performance for student number lookups
-- - Function provides real-time validation capability
-- - All student numbers are normalized to uppercase for consistency

