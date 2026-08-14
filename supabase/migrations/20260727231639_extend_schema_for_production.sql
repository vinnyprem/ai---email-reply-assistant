CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT 'google',
  gmail_connected boolean NOT NULL DEFAULT false,
  account_status text NOT NULL DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS auto_reply boolean NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notifications boolean NOT NULL DEFAULT true;

ALTER TABLE email_history ADD COLUMN IF NOT EXISTS response_time_ms integer;
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS intent text;
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS priority text;
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS sentiment text;

CREATE INDEX IF NOT EXISTS email_history_user_status_idx ON email_history(user_id, status, created_at);
