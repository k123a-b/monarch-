-- The code caps permanent set bonuses at +2.00% Epic / +0.40% Crown (four
-- completions of each). The original constraints stopped at one completion.
ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_permanent_epic_bonus_check;
ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_permanent_crown_bonus_check;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_permanent_epic_bonus_check
  CHECK (permanent_epic_bonus BETWEEN 0 AND 2000000);
ALTER TABLE accounts
  ADD CONSTRAINT accounts_permanent_crown_bonus_check
  CHECK (permanent_crown_bonus BETWEEN 0 AND 400000);

-- Daily quest progress and the once-a-day Secret window.
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS quest_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS secret_day text NOT NULL DEFAULT '';
