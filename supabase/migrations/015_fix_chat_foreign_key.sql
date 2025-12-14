-- Fix chat foreign key constraint naming
-- This migration ensures the foreign key constraint has the correct name
-- that PostgREST expects for relationship hints

-- Drop the old constraint if it exists with wrong name
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_conversations_last_message'
  ) THEN
    ALTER TABLE conversations
    DROP CONSTRAINT IF EXISTS fk_conversations_last_message;
  END IF;
END $$;

-- Add the constraint with the correct naming convention
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

