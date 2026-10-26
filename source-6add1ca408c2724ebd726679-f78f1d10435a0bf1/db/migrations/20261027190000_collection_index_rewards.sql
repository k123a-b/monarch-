ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS character_index text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS set_rewards jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS permanent_epic_bonus integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS permanent_crown_bonus integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  ALTER TABLE accounts ADD CONSTRAINT accounts_loadout_slots_check CHECK (loadout_slots BETWEEN 3 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE accounts AS account
SET character_index = COALESCE(
  (
    SELECT array_agg(DISTINCT discovered.template_id ORDER BY discovered.template_id)
    FROM (
      SELECT unnest(account.fortnite_collection) AS template_id
      UNION
      SELECT card.template_id
      FROM inventory AS card
      WHERE card.owner_id = account.id
    ) AS discovered
  ),
  ARRAY[]::text[]
)
WHERE cardinality(account.character_index) = 0;

DO $$
BEGIN
  ALTER TABLE accounts
    ADD CONSTRAINT accounts_permanent_epic_bonus_check
    CHECK (permanent_epic_bonus BETWEEN 0 AND 1000000);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE accounts
    ADD CONSTRAINT accounts_permanent_crown_bonus_check
    CHECK (permanent_crown_bonus BETWEEN 0 AND 100000);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
