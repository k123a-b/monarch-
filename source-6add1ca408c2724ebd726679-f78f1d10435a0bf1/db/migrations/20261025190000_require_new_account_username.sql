ALTER TABLE accounts
ADD COLUMN username_set boolean NOT NULL DEFAULT false;

UPDATE accounts
SET username_set = true;
