ALTER TABLE accounts
  ADD COLUMN google_email text;

CREATE UNIQUE INDEX accounts_google_email_unique
  ON accounts (lower(google_email))
  WHERE google_email IS NOT NULL;
