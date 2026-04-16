-- App Usage Logs table
-- Run this in Supabase SQL Editor

create table if not exists app_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid not null references apps(id) on delete cascade,
  opened_at timestamptz not null default now()
);

-- Index for fast lookups: user's recent opens
create index if not exists idx_app_usage_logs_user_opened
  on app_usage_logs (user_id, opened_at desc);

-- RLS
alter table app_usage_logs enable row level security;

create policy "Users can read own usage logs"
  on app_usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage logs"
  on app_usage_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own usage logs"
  on app_usage_logs for delete
  using (auth.uid() = user_id);
