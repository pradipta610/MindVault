-- ============================================================
-- Finance Scopes: user-defined context for transactions
-- (Pribadi, Keluarga, Pacar, dst — bebas tambah sendiri)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1) Table: finance_scopes
CREATE TABLE IF NOT EXISTS finance_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '💰',
  color text NOT NULL DEFAULT '#f7ce28',
  position int NOT NULL DEFAULT 0,
  spending_limit bigint DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- RLS
ALTER TABLE finance_scopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own scopes" ON finance_scopes;
DROP POLICY IF EXISTS "Users can insert own scopes" ON finance_scopes;
DROP POLICY IF EXISTS "Users can update own scopes" ON finance_scopes;
DROP POLICY IF EXISTS "Users can delete own scopes" ON finance_scopes;

CREATE POLICY "Users can read own scopes"
  ON finance_scopes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scopes"
  ON finance_scopes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scopes"
  ON finance_scopes FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scopes"
  ON finance_scopes FOR DELETE USING (auth.uid() = user_id);

-- 2) Add scope_id FK on transactions (NULL-safe: delete scope won't delete txs)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS scope_id uuid REFERENCES finance_scopes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_user_scope_date
  ON transactions(user_id, scope_id, date DESC);

-- 3) Backfill: for every user with existing transactions,
--    create a default "Pribadi" scope and assign all their txs to it.
DO $$
DECLARE
  u record;
  sid uuid;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM transactions WHERE scope_id IS NULL LOOP
    -- Find existing default scope, otherwise create one
    SELECT id INTO sid
      FROM finance_scopes
      WHERE user_id = u.user_id AND name = 'Pribadi'
      LIMIT 1;

    IF sid IS NULL THEN
      INSERT INTO finance_scopes (user_id, name, emoji, color, position)
      VALUES (u.user_id, 'Pribadi', '👤', '#f7ce28', 0)
      RETURNING id INTO sid;
    END IF;

    -- Assign all orphan transactions to this scope
    UPDATE transactions
      SET scope_id = sid
      WHERE user_id = u.user_id AND scope_id IS NULL;
  END LOOP;
END $$;
