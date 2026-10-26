ALTER TABLE accounts
  ADD COLUMN spin_day text NOT NULL DEFAULT '',
  ADD COLUMN spin_reward integer,
  ADD COLUMN loadout integer[] NOT NULL DEFAULT '{}';
