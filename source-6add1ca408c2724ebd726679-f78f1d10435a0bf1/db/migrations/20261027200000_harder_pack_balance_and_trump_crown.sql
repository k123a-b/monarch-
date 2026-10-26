-- Revalue existing inventory to match the new slightly lower catalogue values.
-- Ordinary catalogue values move from a 0.75 to a 0.73 multiplier.
-- Fortnite Epics move from 0.60 to 0.45, a 25% reduction.
UPDATE inventory
SET value = CASE
  WHEN template_id = 'world-c6af8a1c1faf4aae' THEN 50000
  WHEN template_id = 'fortnite-renegade-raider' OR template_id = 'kim' THEN value
  WHEN template_id LIKE 'fortnite-%' AND rarity = 'Epic'
    THEN ROUND(value::numeric * 3 / 4)::bigint
  ELSE ROUND(value::numeric * 73 / 75)::bigint
END,
rarity = CASE
  WHEN template_id = 'world-c6af8a1c1faf4aae' THEN 'Crown'
  ELSE rarity
END;
