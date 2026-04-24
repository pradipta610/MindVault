-- ============================================================
-- MindVault: Missing Tables Migration
-- Creates tables that are referenced by composables but were
-- never created via migration files.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#d4a853',
  icon text DEFAULT '📁',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- 2. Project Tasks table
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  parent_id uuid REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  collaborator text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project tasks"
  ON public.project_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_parent_id ON public.project_tasks(parent_id);

-- 3. Project Notes table
CREATE TABLE IF NOT EXISTS public.project_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project notes"
  ON public.project_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON public.project_notes(project_id);

-- 4. Project Bugs table
CREATE TABLE IF NOT EXISTS public.project_bugs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.project_bugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project bugs"
  ON public.project_bugs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_bugs_project_id ON public.project_bugs(project_id);

-- 5. Transactions table (Finance)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount bigint NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  note text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
