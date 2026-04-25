-- ============================================================
-- FIX: Mood Videos Storage RLS
-- Run this in Supabase SQL Editor kalau ada error
-- "new row violates row-level security policy"
-- ============================================================

-- 1) Make sure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('mood-videos', 'mood-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2) Drop existing policies (clean slate) and recreate
DROP POLICY IF EXISTS "Users can upload own mood videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own mood videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own mood videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read mood videos" ON storage.objects;

-- 3) Recreate with correct rules
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

CREATE POLICY "Public can read mood videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mood-videos');

-- 4) Verify user_settings policies exist (for saving URL)
-- These should already exist from the user_settings migration.
-- If you get RLS errors on user_settings, run these too:
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
