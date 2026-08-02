-- ============================================================
-- Bank Statement Import: minimal extension of existing finance system
-- Adds: bank account identification, import batches, and the columns
-- needed for duplicate detection + internal transfer tagging.
-- Does NOT introduce a new transaction/category/report system.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1) finance_bank_accounts
-- Minimal entity to identify which rekening a statement/transaction
-- belongs to. Intentionally NOT a wallet/balance/net-worth system —
-- no balance column, no running total. Just a label.
CREATE TABLE IF NOT EXISTS finance_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank text NOT NULL CHECK (bank IN ('bca', 'blu')),
  account_name text NOT NULL,
  account_number_last4 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own bank accounts" ON finance_bank_accounts;
DROP POLICY IF EXISTS "Users can insert own bank accounts" ON finance_bank_accounts;
DROP POLICY IF EXISTS "Users can update own bank accounts" ON finance_bank_accounts;
DROP POLICY IF EXISTS "Users can delete own bank accounts" ON finance_bank_accounts;

CREATE POLICY "Users can read own bank accounts"
  ON finance_bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank accounts"
  ON finance_bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank accounts"
  ON finance_bank_accounts FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank accounts"
  ON finance_bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- 2) finance_import_batches
-- One row per statement upload. Lets us reject re-uploading the exact
-- same file outright, and (Phase 3) show import history / allow undo.
CREATE TABLE IF NOT EXISTS finance_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES finance_bank_accounts(id) ON DELETE SET NULL,
  bank text NOT NULL CHECK (bank IN ('bca', 'blu')),
  file_hash text,
  period_label text,
  transaction_count int NOT NULL DEFAULT 0,
  imported_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own import batches" ON finance_import_batches;
DROP POLICY IF EXISTS "Users can insert own import batches" ON finance_import_batches;
DROP POLICY IF EXISTS "Users can delete own import batches" ON finance_import_batches;

CREATE POLICY "Users can read own import batches"
  ON finance_import_batches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own import batches"
  ON finance_import_batches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own import batches"
  ON finance_import_batches FOR DELETE USING (auth.uid() = user_id);

-- Prevent re-importing the literal same file twice (per user).
CREATE UNIQUE INDEX IF NOT EXISTS idx_import_batches_user_filehash
  ON finance_import_batches(user_id, file_hash) WHERE file_hash IS NOT NULL;

-- 3) Extend existing transactions table (additive, all nullable /
--    defaulted — existing manual-entry rows and code path are unaffected).
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import'));

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES finance_bank_accounts(id) ON DELETE SET NULL;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES finance_import_batches(id) ON DELETE SET NULL;

-- Fingerprint of (account + date + amount + type + normalized description
-- [+ bank reference if available]), computed by the importer. Used for
-- exact-duplicate protection on re-imported statements. Manual entries
-- keep this NULL — they were never meant to be deduped against each other.
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS dedupe_hash text;

-- Two linked rows (outgoing + incoming) share this id to represent one
-- internal transfer between the user's own accounts (Phase 2). Reporting
-- code already filters explicitly on type = 'income' / 'expense', so a
-- 'transfer' row is automatically excluded from both — no report changes
-- needed.
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS transfer_group_id uuid;

-- Widen the type check to allow 'transfer' (Phase 2 uses it; Phase 1
-- import only ever writes 'income' / 'expense', so this is safe to add
-- now and avoid a second migration later).
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income', 'expense', 'transfer'));

-- Exact-duplicate guard: same user can't have two rows with the same
-- dedupe_hash. Rows without a hash (all manual entries) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_dedupe_hash
  ON transactions(user_id, dedupe_hash) WHERE dedupe_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_import_batch_id ON transactions(import_batch_id);
