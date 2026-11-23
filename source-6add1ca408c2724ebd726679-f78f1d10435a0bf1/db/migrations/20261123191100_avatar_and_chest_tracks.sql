ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS chest_tier_days jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar_items text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS avatar_equipped text NOT NULL DEFAULT 'nova';
