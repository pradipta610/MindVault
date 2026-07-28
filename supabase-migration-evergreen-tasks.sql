-- ============================================================
-- MindVault: Evergreen (pinned, recurring) Tasks Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- is_evergreen: pinned/recurring task, not tied to a specific date
-- last_done_date: date it was last checked done; "done today" = last_done_date = current date
-- archived_at: soft-hide an evergreen task without moving it to backlog or deleting it
alter table tasks add column if not exists is_evergreen boolean not null default false;
alter table tasks add column if not exists last_done_date date;
alter table tasks add column if not exists archived_at timestamptz;

create index if not exists idx_tasks_evergreen on tasks(user_id, is_evergreen) where is_evergreen = true;
