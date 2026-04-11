  -- =============================================
  -- Migration: Links & Apps tables
  -- Run this in Supabase SQL Editor
  -- =============================================

  -- 1. Links table
  CREATE TABLE IF NOT EXISTS public.links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    url text NOT NULL,
    title text,
    description text,
    image text,
    favicon text,
    created_at timestamptz DEFAULT now() NOT NULL
  );

  ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage their own links"
    ON public.links FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE INDEX idx_links_user_id ON public.links(user_id);
  CREATE INDEX idx_links_created_at ON public.links(created_at DESC);

  -- 2. Apps table
  CREATE TABLE IF NOT EXISTS public.apps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    html text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
  );

  ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage their own apps"
    ON public.apps FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE INDEX idx_apps_user_id ON public.apps(user_id);
  CREATE INDEX idx_apps_created_at ON public.apps(created_at DESC);
