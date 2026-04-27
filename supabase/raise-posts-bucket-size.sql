-- Raise the per-file size limit on the `posts` storage bucket from the
-- previous default (typically 50MB) to 500MB so iPhone clips and 4K video
-- can upload without re-encoding.
--
-- Requirements:
--   * Project must be on Supabase Pro plan or higher. Free tier hard-caps
--     per-file uploads at 50MB regardless of this setting and the dashboard
--     will silently clamp the value back down.
--
-- Run from the Supabase SQL editor (must be project owner / service role).

UPDATE storage.buckets
SET file_size_limit = 524288000  -- 500 MB, expressed in bytes (500 * 1024 * 1024)
WHERE id = 'posts';

-- Verify:
SELECT id, name, file_size_limit, public, allowed_mime_types
FROM storage.buckets
WHERE id = 'posts';
