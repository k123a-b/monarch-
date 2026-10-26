ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS fortnite_collection text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Existing copies count as discoveries even if the account never opened the new album.
UPDATE accounts AS account
SET fortnite_collection = COALESCE(
  (
    SELECT array_agg(DISTINCT card.template_id ORDER BY card.template_id)
    FROM inventory AS card
    WHERE card.owner_id = account.id
      AND card.template_id LIKE 'fortnite-%'
  ),
  ARRAY[]::text[]
);
