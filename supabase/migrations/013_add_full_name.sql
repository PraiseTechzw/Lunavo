-- Add Full Name column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update the academic year and semester to be more explicit if needed
-- This migration ensures these fields are available for the new registration flow
COMMENT ON COLUMN users.full_name IS 'Real name of the student, kept private except for responders';
COMMENT ON COLUMN users.program IS 'Degree program (e.g. BSc Computer Science)';
COMMENT ON COLUMN users.academic_year IS 'Current year of study (1-5)';
COMMENT ON COLUMN users.academic_semester IS 'Current semester (1-2)';
