-- Restore the prior 40% leader rebalance to the calibrated 1.13x catalogue scale.
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
  WHEN template_id = 'world-flag-greece' THEN 12
  WHEN template_id = 'world-flag-qatar' THEN 18
  WHEN template_id = 'world-flag-bangladesh' THEN 24
  WHEN value < 0 THEN value
  WHEN template_id LIKE 'world-flag-%' THEN round(value * 1.13)::bigint
  WHEN template_id IN (
    'world-03d1258565161f56',
    'world-fa08df151cbbdfcc',
    'world-da36759797a0e5ab',
    'world-af6fc5610882bb5b',
    'world-eae3fe943739b49f',
    'world-2ca67a3b4b48decb',
    'world-19a48eef9c6e6cbc',
    'world-bf9a1a588f87c54b',
    'world-241569aad5b4daac',
    'world-a532e1b18f524880',
    'world-ea32f8a72ad14d1f',
    'world-28b3077da0cd43bb',
    'world-49a7a98e83f6d0dc',
    'world-a32833fd4ad13dfb',
    'world-16feed13bfed5b39',
    'world-b55e700d69f94714',
    'world-8122cb3a07f4aed5',
    'world-dd4cdb259d914520',
    'world-328ca615d0b27efc',
    'world-3696a04217ce54b4',
    'world-1644212c9c447206'
  ) THEN 678
  WHEN rarity = 'Uncommon' AND template_id LIKE 'world-%' THEN 339
  ELSE round(value * 2.825)::bigint
END
WHERE template_id = 'kim' OR template_id LIKE 'world-%';
