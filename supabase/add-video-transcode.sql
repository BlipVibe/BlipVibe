-- ============================================================
-- Video transcoding pipeline — status tracking on posts
-- ============================================================
-- A post with an uploaded video starts life as 'processing'. A free
-- GitHub Actions worker picks it up, re-encodes the raw iPhone .mov/HEVC
-- into a web-optimized 720p H.264 MP4 with the moov atom moved to the
-- front (fast-start), swaps the optimized URL into media_urls, and flips
-- the status to 'ready'. The app shows a "processing…" placeholder until
-- then, exactly like Facebook/Instagram.
--
-- video_status values:
--   NULL         -> post has no video / nothing to do
--   'processing' -> raw video uploaded, awaiting transcode
--   'ready'      -> optimized video swapped in, playable everywhere
--   'failed'     -> transcode errored (raw URL is left in place as fallback)
-- ============================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT NULL;

-- Fast lookup for the worker's poll: only the rows still needing work.
CREATE INDEX IF NOT EXISTS idx_posts_video_processing
  ON public.posts (created_at)
  WHERE video_status = 'processing';

-- Let the worker (service-role) read/update freely is already covered by
-- service_role bypassing RLS; no policy changes needed.
