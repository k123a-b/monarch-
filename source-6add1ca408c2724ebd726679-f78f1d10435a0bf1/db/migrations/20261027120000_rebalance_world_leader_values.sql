UPDATE inventory
SET value = CASE template_id
  WHEN 'kim' THEN 25000
  WHEN 'world-38b1a8656815ee75' THEN 7500
  WHEN 'world-c6af8a1c1faf4aae' THEN 23000
  WHEN 'world-israel-flag' THEN 5000
  WHEN 'world-former-keir-starmer' THEN -250
  ELSE round(value * 0.4)::bigint
END
WHERE template_id = 'kim' OR template_id LIKE 'world-%';

ALTER TABLE inventory DROP CONSTRAINT inventory_value_valid;
ALTER TABLE inventory ADD CONSTRAINT inventory_value_valid
  CHECK (value >= 0 OR (template_id = 'world-former-keir-starmer' AND value = -250));
