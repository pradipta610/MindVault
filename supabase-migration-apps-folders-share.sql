-- ============================================================
-- MindVault: Apps Folders + Share Links Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. App Folders table
create table if not exists public.app_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.app_folders enable row level security;

create policy "Users can manage own app_folders"
  on public.app_folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Add folder_id to apps table (nullable FK)
alter table public.apps add column if not exists folder_id uuid null references public.app_folders(id) on delete set null;
create index if not exists idx_apps_folder_id on public.apps(folder_id);

-- 3. Add share_token to apps table (nullable, unique)
alter table public.apps add column if not exists share_token text null;
create unique index if not exists idx_apps_share_token on public.apps(share_token);

-- 4. Public read policy for shared apps (anyone can read if they have the token)
-- This allows the server API to fetch shared apps without auth
create policy "Anyone can read shared apps by token"
  on public.apps for select
  using (share_token is not null);
