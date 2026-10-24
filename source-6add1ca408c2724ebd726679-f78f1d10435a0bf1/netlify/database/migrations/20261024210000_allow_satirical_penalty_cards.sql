-- Preserve existing applied migrations and permit the one explicit penalty template.
ALTER TABLE inventory DROP CONSTRAINT inventory_value_nonnegative;
ALTER TABLE inventory ADD CONSTRAINT inventory_value_valid
  CHECK (value >= 0 OR (template_id = 'world-former-keir-starmer' AND value = -2500));
-- Keep already owned Trump cards consistent with the published £70 sell value.
UPDATE inventory SET value = 7000 WHERE template_id = 'world-c6af8a1c1faf4aae';
