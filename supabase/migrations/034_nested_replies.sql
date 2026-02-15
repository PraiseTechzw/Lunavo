-- Add parent_reply_id column to replies table
ALTER TABLE replies
ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE;
-- Create reply_likes table
CREATE TABLE IF NOT EXISTS reply_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reply_id UUID NOT NULL REFERENCES replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reply_id, user_id)
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_replies_parent_reply_id ON replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply_id ON reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_user_id ON reply_likes(user_id);
-- Enable RLS
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can view all reply likes" ON reply_likes FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own reply likes" ON reply_likes FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reply likes" ON reply_likes FOR DELETE USING (auth.uid() = user_id);
-- Trigger to update reply helpful count
CREATE OR REPLACE FUNCTION update_reply_helpful_count() RETURNS TRIGGER AS $$ BEGIN IF (TG_OP = 'INSERT') THEN
UPDATE replies
SET is_helpful = is_helpful + 1
WHERE id = NEW.reply_id;
RETURN NEW;
ELSIF (TG_OP = 'DELETE') THEN
UPDATE replies
SET is_helpful = is_helpful - 1
WHERE id = OLD.reply_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_reply_helpful_trigger ON reply_likes;
CREATE TRIGGER update_reply_helpful_trigger
AFTER
INSERT
    OR DELETE ON reply_likes FOR EACH ROW EXECUTE FUNCTION update_reply_helpful_count();