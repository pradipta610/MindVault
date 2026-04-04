-- ============================================
-- MindVault: Backlog table migration
-- Run this SQL in your Supabase SQL Editor
-- ============================================

create table if not exists backlog (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_type text not null check (source_type in ('dump', 'todo')),
  source_data jsonb not null default '{}',
  deleted_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Row Level Security
alter table backlog enable row level security;

create policy "Users can view own backlog"
  on backlog for select
  using (auth.uid() = user_id);

create policy "Users can insert own backlog"
  on backlog for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own backlog"
  on backlog for delete
  using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists idx_backlog_user_id on backlog(user_id);
create index if not exists idx_backlog_deleted_at on backlog(deleted_at desc);
