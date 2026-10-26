ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS loadout_slots integer NOT NULL DEFAULT 3;
