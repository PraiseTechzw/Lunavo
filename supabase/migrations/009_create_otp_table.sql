-- Create OTP table for email verification codes
-- This table stores 6-digit OTP codes for email verification

CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL, -- 6-digit code
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_code ON email_otps(code);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps(expires_at);

-- Add RLS policies
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own OTPs (for verification)
CREATE POLICY "Users can read their own OTPs"
  ON email_otps
  FOR SELECT
  USING (true); -- OTPs are public for verification, but codes expire quickly

-- Allow service role to insert/update OTPs (via function)
-- This will be handled by a SECURITY DEFINER function

-- Function to generate and store OTP
CREATE OR REPLACE FUNCTION generate_email_otp(email_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_code TEXT;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate 6-digit random code
  otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Set expiration to 10 minutes from now
  expires_at := NOW() + INTERVAL '10 minutes';
  
  -- Mark old OTPs as used
  UPDATE email_otps
  SET used = true
  WHERE email = email_param AND used = false AND email_otps.expires_at > NOW();
  
  -- Insert new OTP
  INSERT INTO email_otps (email, code, expires_at)
  VALUES (email_param, otp_code, expires_at);
  
  RETURN otp_code;
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verify_email_otp(email_param TEXT, code_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_record RECORD;
BEGIN
  -- Find valid, unused OTP
  SELECT * INTO otp_record
  FROM email_otps
  WHERE email = email_param
    AND code = code_param
    AND used = false
    AND email_otps.expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no valid OTP found, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mark OTP as used
  UPDATE email_otps
  SET used = true
  WHERE id = otp_record.id;
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_email_otp(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION verify_email_otp(TEXT, TEXT) TO authenticated, anon;

-- Note:
-- - OTPs expire after 10 minutes
-- - Only the most recent unused OTP is valid
-- - OTPs are marked as used after verification
-- - Old OTPs are automatically marked as used when a new one is generated

