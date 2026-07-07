-- ============================================================
-- MindVault: Task Custom Fields Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Field *definitions* (per-user, not per-task)
create table if not exists task_fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,                    -- stable jsonb key, immutable after creation
  label text not null,
  type text not null check (type in ('text', 'number', 'date', 'select', 'checkbox')),
  options jsonb not null default '[]',  -- select-type only: [{ value, label, color }]
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table task_fields enable row level security;

create policy "Users can view own task_fields"
  on task_fields for select
  using (auth.uid() = user_id);

create policy "Users can insert own task_fields"
  on task_fields for insert
  with check (auth.uid() = user_id);

create policy "Users can update own task_fields"
  on task_fields for update
  using (auth.uid() = user_id);

create policy "Users can delete own task_fields"
  on task_fields for delete
  using (auth.uid() = user_id);

create index if not exists idx_task_fields_user_id on task_fields(user_id);
create unique index if not exists idx_task_fields_user_key on task_fields(user_id, key);

-- Field *values* live on tasks, keyed by task_fields.key
alter table tasks add column if not exists custom_fields jsonb not null default '{}'::jsonb;
