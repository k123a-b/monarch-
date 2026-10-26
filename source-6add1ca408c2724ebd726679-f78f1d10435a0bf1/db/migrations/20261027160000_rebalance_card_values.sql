-- Reduce the sell value of existing cards so opening a pack is more likely to lose value.
-- Preserve the two specifically priced Crown chase cards.
UPDATE inventory
SET value = ROUND(value * 0.75)::integer
WHERE template_id NOT IN ('kim', 'fortnite-renegade-raider');
