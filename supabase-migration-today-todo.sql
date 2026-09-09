-- ============================================================
-- MindVault: "Hari Ini" (Today To-Do) Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- today_at: the date this task was planned into the Today list.
--   A task is "in Today" only when today_at = current date, so yesterday's
--   unfinished plan drops back into the main pool automatically.
-- today_order: manual position within that day's plan (1-based).
alter table tasks add column if not exists today_at date;
alter table tasks add column if not exists today_order integer;

create index if not exists idx_tasks_today on tasks(user_id, today_at) where today_at is not null;
