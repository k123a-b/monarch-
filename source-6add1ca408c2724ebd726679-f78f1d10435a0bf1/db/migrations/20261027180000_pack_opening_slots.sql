ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS pack_slots integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  ALTER TABLE accounts
    ADD CONSTRAINT accounts_pack_slots_check
    CHECK (pack_slots BETWEEN 1 AND 3);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

