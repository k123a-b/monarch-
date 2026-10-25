-- Supabase exposes every public table through its Data API using a public
-- (anon) key. Card Monarchs never uses that API: the server connects directly
-- as the database owner, which bypasses row level security. Enabling RLS with no
-- policies therefore locks the public API out of every table without affecting
-- the game.
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alpha_pulls ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE wagers ENABLE ROW LEVEL SECURITY;
