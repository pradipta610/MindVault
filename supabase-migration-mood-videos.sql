-- ============================================================
-- MindVault: Mood Videos for Focus Timer
-- Run in Supabase SQL Editor.
-- ============================================================

-- 1) Add mood video URL columns to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS mood_working_url text,
  ADD COLUMN IF NOT EXISTS mood_resting_url text;

-- 2) Create public storage bucket for mood videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('mood-videos', 'mood-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own mood videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'mood-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own mood videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'mood-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own mood videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'mood-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Public can read (bucket is public, but explicit policy for clarity)
CREATE POLICY "Public can read mood videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mood-videos');
