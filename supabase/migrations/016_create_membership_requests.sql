-- Create membership_requests table for peer educator club applications
-- This allows students to apply to become peer educators

CREATE TYPE membership_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'withdrawn'
);

CREATE TABLE membership_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  motivation TEXT NOT NULL,
  experience TEXT,
  availability TEXT,
  additional_info TEXT,
  status membership_request_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One active request per user
);

-- Create indexes
CREATE INDEX idx_membership_requests_user_id ON membership_requests(user_id);
CREATE INDEX idx_membership_requests_status ON membership_requests(status);
CREATE INDEX idx_membership_requests_created_at ON membership_requests(created_at DESC);

-- Enable RLS
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can create their own membership requests
CREATE POLICY "Users can create own membership requests"
  ON membership_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own membership requests
CREATE POLICY "Users can read own membership requests"
  ON membership_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own pending requests (to withdraw)
CREATE POLICY "Users can update own pending requests"
  ON membership_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Peer educator executives and admins can read all requests
CREATE POLICY "Executives can read all membership requests"
  ON membership_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('peer-educator-executive', 'admin', 'student-affairs')
    )
  );

-- Peer educator executives and admins can update requests (approve/reject)
CREATE POLICY "Executives can update membership requests"
  ON membership_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('peer-educator-executive', 'admin', 'student-affairs')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('peer-educator-executive', 'admin', 'student-affairs')
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_membership_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER membership_requests_updated_at
  BEFORE UPDATE ON membership_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_requests_updated_at();




