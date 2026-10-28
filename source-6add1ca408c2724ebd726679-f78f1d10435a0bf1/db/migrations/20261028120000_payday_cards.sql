-- Payday cards: a separate 1-in-25 roll on the Vault, Apex, Fortnite and Fast
-- Food packs. It swaps the lowest card for that pack's Payday card and lifts the
-- pack into the 2x-5x band. Payday cards are new templates, so no inventory rows
-- point at them yet; only the bulk-tier trims below move existing holdings.
UPDATE inventory
SET value = ROUND(value * 0.93)::bigint
WHERE template_id LIKE 'fortnite-%' AND rarity = 'Common';

UPDATE inventory
SET value = ROUND(value * 0.92)::bigint
WHERE template_id LIKE 'fortnite-%' AND rarity = 'Uncommon';

UPDATE inventory
SET value = ROUND(value * 0.96)::bigint
WHERE template_id LIKE 'food-%' AND rarity = 'Common';

UPDATE inventory
SET value = ROUND(value * 0.86)::bigint
WHERE template_id LIKE 'food-%' AND rarity = 'Epic';
