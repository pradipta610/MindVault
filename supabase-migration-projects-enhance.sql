-- ============================================================
-- MindVault: Projects Enhancement Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add emoji icon to projects table
alter table public.projects add column if not exists icon text default '📁';

-- 2. Add collaborator label to project_tasks
alter table public.project_tasks add column if not exists collaborator text null;

-- 3. Add project_id to notes table (nullable FK)
alter table public.notes add column if not exists project_id uuid null;
create index if not exists idx_notes_project_id on public.notes(project_id);

-- 4. Add project_id to links table (nullable FK)
alter table public.links add column if not exists project_id uuid null;
create index if not exists idx_links_project_id on public.links(project_id);

-- 5. Add project_id to apps table (nullable FK)
alter table public.apps add column if not exists project_id uuid null;
create index if not exists idx_apps_project_id on public.apps(project_id);

-- 6. focus_sessions already has project_id from the previous migration.
--    If not, uncomment:
-- alter table public.focus_sessions add column if not exists project_id uuid null;
-- create index if not exists idx_focus_sessions_project_id on public.focus_sessions(project_id);
