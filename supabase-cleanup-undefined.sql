-- Cleanup files uploaded with invalid "undefined" userId path
-- Run once in Supabase SQL Editor
DELETE FROM storage.objects
WHERE bucket_id = 'mood-videos'
  AND name LIKE 'undefined/%';
