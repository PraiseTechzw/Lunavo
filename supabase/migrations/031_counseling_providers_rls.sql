-- Allow authenticated users to read counseling provider profiles (limited by row)

DROP POLICY IF EXISTS "Authenticated can read counseling providers" ON users;
CREATE POLICY "Authenticated can read counseling providers"
  ON users FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    role IN ('life-coach', 'peer-educator-executive')
  );
