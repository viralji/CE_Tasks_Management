-- Add chat_mention table for tracking @mentions in chat messages
-- This migration adds support for @mention functionality in project chat

CREATE TABLE IF NOT EXISTS chat_mention (
  org_id uuid NOT NULL,
  message_id uuid NOT NULL,
  mentioned_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  PRIMARY KEY (org_id, message_id, mentioned_user_id),
  CONSTRAINT fk_mention_message FOREIGN KEY (org_id, message_id) REFERENCES chat_message(org_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_mention_user FOREIGN KEY (mentioned_user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- Create index for efficient querying of unread mentions per user
CREATE INDEX IF NOT EXISTS idx_chat_mention_user ON chat_mention (mentioned_user_id, read_at);

-- Add RLS policy for chat_mention table
ALTER TABLE chat_mention ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see mentions where they are the mentioned user or the message author
CREATE POLICY mention_access ON chat_mention
  FOR ALL
  USING (
    mentioned_user_id = current_setting('app.current_user_id')::uuid
    OR EXISTS (
      SELECT 1 FROM chat_message cm 
      WHERE cm.org_id = chat_mention.org_id 
      AND cm.id = chat_mention.message_id 
      AND cm.author_id = current_setting('app.current_user_id')::uuid
    )
  );
