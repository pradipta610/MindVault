-- ============================================================
-- MindVault: Link Folders Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Link Folders table
create table if not exists public.link_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.link_folders enable row level security;

create policy "Users can manage own link_folders"
  on public.link_folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Add folder_id to links table (nullable FK)
alter table public.links add column if not exists folder_id uuid null references public.link_folders(id) on delete set null;
create index if not exists idx_links_folder_id on public.links(folder_id);
