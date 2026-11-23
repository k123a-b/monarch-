ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS chest_day text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS chest_reward integer;
