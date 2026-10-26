UPDATE inventory
SET value = CASE
  WHEN template_id = 'world-38b1a8656815ee75' THEN 7500
  WHEN template_id = 'world-c6af8a1c1faf4aae' THEN 23000
  WHEN template_id = 'world-israel-flag' THEN 5000
  WHEN template_id = 'kim' THEN 25000
  WHEN template_id IN (
    'world-dd20def1224e404d',
    'world-8f0bc8a1eee603cf',
    'world-1a7e28ef695b74e2',
    'world-16d8ba899f2579f0',
    'world-a82f7e6d516193db',
    'world-a4c83b25134638cf',
    'world-827df415256f1971',
    'world-d85ede7b5430fc73',
    'world-4492ad33d0db4a84',
    'world-89c5e31692ab25f1',
    'world-ab1dafec608fc1f9',
    'world-b49097520a03a7cf',
    'world-1458200e050260a7',
    'world-cee64675f2257b3f'
  ) THEN 400
  WHEN template_id LIKE 'world-flag-%' THEN round(
    value * CASE rarity
      WHEN 'Common' THEN 0.075
      WHEN 'Uncommon' THEN 0.15
      WHEN 'Epic' THEN 0.25
      WHEN 'Crown' THEN 0.3
      ELSE 0
    END
  )::bigint
  WHEN rarity = 'Uncommon' AND template_id LIKE 'world-%' THEN
    CASE WHEN value <= 400 THEN 120 ELSE 240 END
  ELSE value
END
WHERE template_id = 'kim' OR template_id LIKE 'world-%';
