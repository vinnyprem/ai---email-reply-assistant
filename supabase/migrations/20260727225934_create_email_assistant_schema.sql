CREATE TABLE IF NOT EXISTS email_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  original_sender text NOT NULL,
  original_recipient text NOT NULL DEFAULT '',
  original_subject text NOT NULL,
  original_body text NOT NULL,
  generated_reply text NOT NULL,
  tone text NOT NULL DEFAULT 'Professional',
  status text NOT NULL DEFAULT 'draft',
  important boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_email_history" ON email_history;
CREATE POLICY "select_own_email_history" ON email_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_email_history" ON email_history;
CREATE POLICY "insert_own_email_history" ON email_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_email_history" ON email_history;
CREATE POLICY "update_own_email_history" ON email_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_email_history" ON email_history;
CREATE POLICY "delete_own_email_history" ON email_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS email_history_user_created_idx ON email_history(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_tone text NOT NULL DEFAULT 'Professional',
  ai_model text NOT NULL DEFAULT 'gpt-4o-mini',
  theme text NOT NULL DEFAULT 'dark',
  auto_save boolean NOT NULL DEFAULT true,
  signature text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_settings" ON user_settings;
CREATE POLICY "select_own_user_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_settings" ON user_settings;
CREATE POLICY "insert_own_user_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_settings" ON user_settings;
CREATE POLICY "update_own_user_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_settings" ON user_settings;
CREATE POLICY "delete_own_user_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
