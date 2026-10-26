-- Reduce sell values for existing cards; preserve the two specifically priced chase cards.
-- Set Fortnite card values to the new roster values in case copies already exist.
UPDATE inventory
SET value = CASE template_id
  WHEN 'fortnite-recruit' THEN 1500
  WHEN 'fortnite-jonesy' THEN 3500
  WHEN 'fortnite-commando' THEN 3000
  WHEN 'fortnite-fishstick' THEN 10000
  WHEN 'fortnite-agent-peely' THEN 17500
  WHEN 'fortnite-midas' THEN 25000
  ELSE ROUND(value * 0.75)::integer
END
WHERE template_id NOT IN ('kim', 'fortnite-renegade-raider');
