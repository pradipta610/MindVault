-- ============================================================
-- MindVault: Nested Folders Migration
-- Adds parent_id to both app_folders and link_folders
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add parent_id to app_folders (nullable self-referencing FK)
alter table public.app_folders
  add column if not exists parent_id uuid null
  references public.app_folders(id) on delete cascade;

create index if not exists idx_app_folders_parent_id on public.app_folders(parent_id);

-- 2. Add parent_id to link_folders (nullable self-referencing FK)
alter table public.link_folders
  add column if not exists parent_id uuid null
  references public.link_folders(id) on delete cascade;

create index if not exists idx_link_folders_parent_id on public.link_folders(parent_id);
