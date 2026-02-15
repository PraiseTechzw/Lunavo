-- Add parent_reply_id column to replies table
ALTER TABLE replies
ADD COLUMN parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE;
-- Add index for better performance
CREATE INDEX idx_replies_parent_reply_id ON replies(parent_reply_id);
-- Update RLS if needed (usually existing SELECT policies cover new columns)