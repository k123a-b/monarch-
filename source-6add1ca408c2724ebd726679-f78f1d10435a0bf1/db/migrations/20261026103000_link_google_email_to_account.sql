ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS google_email text;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_google_email_unique
  ON accounts (lower(google_email))
  WHERE google_email IS NOT NULL;
