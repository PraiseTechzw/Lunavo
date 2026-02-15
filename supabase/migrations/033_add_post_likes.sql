-- Create post_likes table
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);
-- Separate reply_likes table if we want to like replies later (optional, but good practice)
-- CREATE TABLE reply_likes ( ... ); 
-- Add indexes
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can view all likes" ON post_likes FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON post_likes FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);
-- Trigger to update post upvotes count
CREATE OR REPLACE FUNCTION update_post_upvotes() RETURNS TRIGGER AS $$ BEGIN IF (TG_OP = 'INSERT') THEN
UPDATE posts
SET upvotes = upvotes + 1
WHERE id = NEW.post_id;
RETURN NEW;
ELSIF (TG_OP = 'DELETE') THEN
UPDATE posts
SET upvotes = upvotes - 1
WHERE id = OLD.post_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_post_upvotes_trigger
AFTER
INSERT
    OR DELETE ON post_likes FOR EACH ROW EXECUTE FUNCTION update_post_upvotes();