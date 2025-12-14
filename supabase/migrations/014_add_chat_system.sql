-- Chat System Migration
-- Creates conversations and messages tables with support staff assignment

-- Create message status enum
CREATE TYPE message_status AS ENUM (
  'sending',
  'sent',
  'delivered',
  'read'
);

-- Create message type enum
CREATE TYPE message_type AS ENUM (
  'text',
  'image',
  'voice',
  'system'
);

-- Conversations table
-- Represents a chat conversation between a user and support staff
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supporter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Support staff assigned to this conversation
  title TEXT, -- Optional conversation title
  last_message_id UUID, -- Reference to last message for quick access
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count_user INTEGER DEFAULT 0, -- Unread messages for user
  unread_count_supporter INTEGER DEFAULT 0, -- Unread messages for supporter
  is_archived BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  status message_status DEFAULT 'sent',
  attachment_url TEXT, -- For images, voice messages, etc.
  read_at TIMESTAMP WITH TIME ZONE, -- When message was read
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Typing indicators table (for real-time typing status)
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Online status table (for tracking who's online)
CREATE TABLE user_online_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_supporter_id ON conversations(supporter_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_archived ON conversations(is_archived);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);

CREATE INDEX idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_user_id ON typing_indicators(user_id);

-- Function to update conversation last_message_at and last_message_id
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- Update unread counts based on who sent the message
  IF NEW.sender_id = (SELECT user_id FROM conversations WHERE id = NEW.conversation_id) THEN
    -- User sent message, increment supporter's unread count
    UPDATE conversations
    SET unread_count_supporter = unread_count_supporter + 1
    WHERE id = NEW.conversation_id;
  ELSE
    -- Supporter sent message, increment user's unread count
    UPDATE conversations
    SET unread_count_user = unread_count_user + 1
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Mark messages as read
  UPDATE messages
  SET 
    status = 'read',
    read_at = NOW()
  WHERE 
    conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND status != 'read';
  
  -- Reset unread count
  IF p_user_id = (SELECT user_id FROM conversations WHERE id = p_conversation_id) THEN
    UPDATE conversations
    SET unread_count_user = 0
    WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations
    SET unread_count_supporter = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create conversation for user
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user_id UUID,
  p_supporter_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing active conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE 
    user_id = p_user_id
    AND (p_supporter_id IS NULL OR supporter_id = p_supporter_id)
    AND is_archived = false
  ORDER BY last_message_at DESC NULLS LAST, created_at DESC
  LIMIT 1;
  
  -- If no conversation exists, create one
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id, supporter_id)
    VALUES (p_user_id, p_supporter_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_online_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Users can see their own conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Support staff can see conversations assigned to them
CREATE POLICY "Support staff can view assigned conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = supporter_id 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('peer-educator', 'peer-educator-executive', 'moderator', 'counselor', 'life-coach', 'student-affairs', 'admin')
    )
  );

-- Support staff can see all conversations (for assignment purposes)
CREATE POLICY "Support staff can view all conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'counselor', 'life-coach', 'student-affairs', 'admin')
    )
  );

-- Users can create conversations for themselves
CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Support staff can update conversations
CREATE POLICY "Support staff can update conversations"
  ON conversations FOR UPDATE
  USING (
    auth.uid() = supporter_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('moderator', 'counselor', 'life-coach', 'student-affairs', 'admin')
    )
  );

-- RLS Policies for messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

-- Support staff can view messages in assigned conversations
CREATE POLICY "Support staff can view messages in assigned conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id 
      AND (supporter_id = auth.uid() OR supporter_id IS NULL)
      AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('peer-educator', 'peer-educator-executive', 'moderator', 'counselor', 'life-coach', 'student-affairs', 'admin')
      )
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

-- Support staff can send messages in any conversation
CREATE POLICY "Support staff can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('peer-educator', 'peer-educator-executive', 'moderator', 'counselor', 'life-coach', 'student-affairs', 'admin')
    )
    AND EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- RLS Policies for typing indicators
-- Users can manage typing indicators for conversations they're in
CREATE POLICY "Users can manage typing indicators"
  ON typing_indicators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = typing_indicators.conversation_id 
      AND (user_id = auth.uid() OR supporter_id = auth.uid())
    )
  );

-- RLS Policies for online status
-- Users can view all online statuses
CREATE POLICY "Users can view online status"
  ON user_online_status FOR SELECT
  USING (true);

-- Users can update their own online status
CREATE POLICY "Users can update their own online status"
  ON user_online_status FOR ALL
  USING (auth.uid() = user_id);

-- Add foreign key constraint for last_message_id
-- Added at the end after both tables exist to ensure proper creation
-- Using the naming convention PostgREST expects for foreign key relationships
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_last_message_id_fkey'
  ) THEN
    ALTER TABLE conversations
    ADD CONSTRAINT conversations_last_message_id_fkey
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to clean up old typing indicators (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;
