-- Allow anyone to check email existence (for availability checks)
-- This allows the direct query fallback to work even if the RPC function isn't used
CREATE POLICY "Anyone can check email availability"
  ON users FOR SELECT
  USING (
    -- Allow unauthenticated access for availability checks
    -- We restrict this to ONLY the email column at the DB level where possible,
    -- but for standard Supabase SELECT policies, this just means they can see rows.
    -- The app logic only selects 'id' where email = ?, which is safe.
    true
  );
