-- Post Edit History — tracks changes when posts are edited
-- Provides transparency and accountability

CREATE TABLE IF NOT EXISTS post_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Anyone can see edit history for public posts
ALTER TABLE post_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post edit history" ON post_edits
  FOR SELECT USING (true);

CREATE POLICY "Post authors can insert edit history" ON post_edits
  FOR INSERT WITH CHECK (auth.uid() = edited_by);

CREATE INDEX IF NOT EXISTS idx_post_edits_post ON post_edits (post_id, edited_at DESC);

-- Trigger: auto-log edit when post content changes
CREATE OR REPLACE FUNCTION log_post_edit() RETURNS trigger AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO post_edits (post_id, previous_content, edited_by)
    VALUES (OLD.id, OLD.content, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_edit_logger ON posts;
CREATE TRIGGER post_edit_logger
  BEFORE UPDATE OF content ON posts
  FOR EACH ROW EXECUTE FUNCTION log_post_edit();

-- Add website_url and link_in_bio to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add seen_by tracking for group posts
CREATE TABLE IF NOT EXISTS group_post_views (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE group_post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group post views" ON group_post_views
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert own views" ON group_post_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_group_post_views_post ON group_post_views (post_id);
