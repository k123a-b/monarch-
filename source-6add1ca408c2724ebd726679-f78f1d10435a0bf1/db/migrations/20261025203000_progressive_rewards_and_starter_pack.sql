ALTER TABLE accounts
  ADD COLUMN reward_steps integer NOT NULL DEFAULT 0,
  ADD COLUMN starter_claimed boolean NOT NULL DEFAULT false;

UPDATE accounts
SET reward_steps = LEAST(4, daily_reward / 50)
WHERE reward_day = TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
