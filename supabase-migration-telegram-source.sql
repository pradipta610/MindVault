-- ============================================================
-- Telegram Finance Inbox (Phase 2): allow 'telegram' as a transaction
-- source, alongside the existing 'manual' / 'import'.
-- Run this in Supabase SQL Editor.
-- ============================================================

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_source_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_source_check
  CHECK (source IN ('manual', 'import', 'telegram'));
