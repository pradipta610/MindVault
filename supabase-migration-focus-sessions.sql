-- ============================================================
-- MindVault: Focus Sessions table
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists public.focus_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  task_id     uuid null,                          -- optional link to tasks table
  project_id  uuid null,                          -- optional link for future Projects feature
  method      text not null check (method in ('pomodoro', '52/17', '90min', 'flowtime', 'deadline')),
  duration_minutes integer not null default 0,    -- actual focus minutes completed
  started_at  timestamptz not null default now(),
  completed_at timestamptz null,                  -- null = abandoned / in-progress
  created_at  timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_focus_sessions_user_id on public.focus_sessions(user_id);
create index if not exists idx_focus_sessions_user_date on public.focus_sessions(user_id, started_at);
create index if not exists idx_focus_sessions_task_id on public.focus_sessions(task_id);

-- RLS
alter table public.focus_sessions enable row level security;

create policy "Users can view own focus sessions"
  on public.focus_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own focus sessions"
  on public.focus_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own focus sessions"
  on public.focus_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own focus sessions"
  on public.focus_sessions for delete
  using (auth.uid() = user_id);
