-- Add Bio and interests fields to users for a richer profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization TEXT; -- e.g. 'Trauma Counseling', 'Study Skills'
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[]; -- Array of tags
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN users.bio IS 'A short professional or personal biography';
COMMENT ON COLUMN users.specialization IS 'For Peer Educators and Counselors to list their areas of expertise';
COMMENT ON COLUMN users.interests IS 'Tags representing user interests for community matching';
COMMENT ON COLUMN users.avatar_url IS 'URL to the user profile picture';
