-- Consecutive money-losing pack purchases. At three, the next pack is opened
-- with no Common cards, then the streak resets on the next win.
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS loss_streak integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  ALTER TABLE accounts
    ADD CONSTRAINT accounts_loss_streak_check
    CHECK (loss_streak >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Brainrot rebalance. The pack now wins about 55% of the time, so the tiers are
-- banded onto narrower, lower ranges. Existing cards move with the catalogue.
UPDATE inventory
SET value = CASE
  WHEN template_id = 'crocodilo' THEN 1500
  WHEN template_id = 'mythic-brainrot' THEN 9000
  WHEN template_id LIKE 'brainrot-%' AND rarity = 'Crown' THEN 800
  WHEN template_id LIKE 'brainrot-%' AND rarity = 'Common'
    THEN ROUND(8 + (LEAST(GREATEST(value, 7), 26) - 7) * 8.0 / 19)::bigint
  WHEN template_id LIKE 'brainrot-%' AND rarity = 'Uncommon'
    THEN ROUND(45 + (LEAST(GREATEST(value, 35), 95) - 35) * 17.0 / 60)::bigint
  WHEN template_id LIKE 'brainrot-%' AND rarity = 'Epic'
    THEN ROUND(168 + (LEAST(GREATEST(value, 161), 240) - 161) * 40.0 / 79)::bigint
  ELSE value
END
WHERE template_id = 'crocodilo'
  OR template_id = 'mythic-brainrot'
  OR (template_id LIKE 'brainrot-%' AND rarity IN ('Common', 'Uncommon', 'Epic', 'Crown'));