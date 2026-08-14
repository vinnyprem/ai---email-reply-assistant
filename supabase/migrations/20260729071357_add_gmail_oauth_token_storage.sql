CREATE TABLE IF NOT EXISTS google_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text NOT NULL DEFAULT '',
  token_type text NOT NULL DEFAULT 'Bearer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_google_tokens" ON google_tokens;
CREATE POLICY "select_own_google_tokens" ON google_tokens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_google_tokens" ON google_tokens;
CREATE POLICY "insert_own_google_tokens" ON google_tokens FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_google_tokens" ON google_tokens;
CREATE POLICY "update_own_google_tokens" ON google_tokens FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_google_tokens" ON google_tokens;
CREATE POLICY "delete_own_google_tokens" ON google_tokens FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

ALTER TABLE email_history ADD COLUMN IF NOT EXISTS gmail_message_id text;
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS gmail_thread_id text;
