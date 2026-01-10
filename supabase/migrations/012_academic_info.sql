-- Add Academic Information to Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_year INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_semester INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to auto-calculate current semester if needed
-- This is a helper for the application logic
CREATE OR REPLACE FUNCTION get_current_semester_display(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    u_base_year INTEGER;
    u_base_sem INTEGER;
    u_base_date TIMESTAMP WITH TIME ZONE;
    current_date TIMESTAMP WITH TIME ZONE := NOW();
    month_val INTEGER;
    year_diff INTEGER;
    total_semesters INTEGER;
    final_year INTEGER;
    final_sem INTEGER;
BEGIN
    SELECT academic_year, academic_semester, academic_updated_at 
    INTO u_base_year, u_base_sem, u_base_date
    FROM users WHERE id = user_id;

    IF u_base_year IS NULL OR u_base_sem IS NULL THEN
        RETURN 'N/A';
    END IF;

    -- Calculate total semesters passed since update
    -- Simple logic: Feb-July is Sem 1, Aug-Jan is Sem 2
    -- (This is a simplified CUT model)
    year_diff := EXTRACT(YEAR FROM current_date) - EXTRACT(YEAR FROM u_base_date);
    month_val := EXTRACT(MONTH FROM current_date);
    
    -- Current semester index (1 or 2)
    -- Aug(8) to Jan(1) is Sem 2, Feb(2) to July(7) is Sem 1
    -- We'll simplify: 1-6 = Sem 1, 7-12 = Sem 2
    total_semesters := (year_diff * 2) + (CASE WHEN month_val > 6 THEN 2 ELSE 1 END) - (CASE WHEN EXTRACT(MONTH FROM u_base_date) > 6 THEN 2 ELSE 1 END);
    
    -- Start from base
    final_sem := u_base_sem + total_semesters;
    
    -- Normalize to 1-2
    final_year := u_base_year + ((final_sem - 1) / 2);
    final_sem := ((final_sem - 1) % 2) + 1;

    RETURN final_year::TEXT || '.' || final_sem::TEXT;
END;
$$;

-- Function to check if student ID is available (not taken)
CREATE OR REPLACE FUNCTION check_student_id_available(check_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  id_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE student_number = UPPER(TRIM(check_id))
  ) INTO id_exists;
  
  RETURN NOT id_exists;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_student_id_available(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_student_id_available(TEXT) TO anon;

-- Apply UNIQUE constraint to student_number if not already forced
-- This is a safety measure at the database level
ALTER TABLE users ADD CONSTRAINT unique_student_number UNIQUE (student_number);
