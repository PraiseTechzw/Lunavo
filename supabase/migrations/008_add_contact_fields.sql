-- Add contact information fields to users table for crisis intervention
-- These fields are required for counselors to contact students in emergencies

-- Step 1: Add phone number field (required)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Step 2: Add emergency contact fields (required)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Step 3: Add location field (optional but recommended)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Step 4: Add preferred contact method (optional)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;

-- Step 5: Make student_number required (update existing nulls first)
-- For existing users without student numbers, set a placeholder
UPDATE users 
SET student_number = 'PENDING_' || SUBSTRING(id::text, 1, 8) 
WHERE student_number IS NULL;

-- Now make it NOT NULL
ALTER TABLE users 
ALTER COLUMN student_number SET NOT NULL;

-- Step 6: Add CUT student number format constraint
-- Format: Letter + 8 digits + Letter (e.g., C23155538O)
ALTER TABLE users
DROP CONSTRAINT IF EXISTS cut_student_number_format;

ALTER TABLE users
ADD CONSTRAINT cut_student_number_format 
CHECK (
  student_number ~ '^[A-Z]\d{8}[A-Z]$' OR 
  student_number LIKE 'PENDING_%'
);

-- Step 7: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);

-- Note:
-- - Phone, emergency_contact_name, and emergency_contact_phone are nullable initially
--   but should be required during registration (enforced at application level)
-- - Location is optional but recommended for physical intervention
-- - preferred_contact_method can be: 'phone', 'sms', 'email', 'in-person'
-- - Student number format: Letter + 8 digits + Letter (e.g., C23155538O)
-- - Existing users without student numbers get a PENDING_ prefix

