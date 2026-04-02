-- Full-Text Search for Posts
-- Adds tsvector column and search RPC for post content search

-- 1. Add search vector column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(search_vector);

-- 3. Auto-update search vector on insert/update
CREATE OR REPLACE FUNCTION posts_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_search_trigger ON posts;
CREATE TRIGGER posts_search_trigger
  BEFORE INSERT OR UPDATE OF content ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_search_update();

-- 4. Backfill existing posts
UPDATE posts SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE search_vector IS NULL;

-- 5. Search RPC — returns posts matching query with author info
CREATE OR REPLACE FUNCTION search_posts(p_query text, p_limit int DEFAULT 20)
RETURNS TABLE(
  id uuid,
  content text,
  author_id uuid,
  created_at timestamptz,
  media_urls text[],
  image_url text,
  location text,
  author_username text,
  author_display_name text,
  author_avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.content, p.author_id, p.created_at, p.media_urls, p.image_url, p.location,
    pr.username, pr.display_name, pr.avatar_url
  FROM posts p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE p.search_vector @@ plainto_tsquery('english', p_query)
    AND p.group_id IS NULL
  ORDER BY ts_rank(p.search_vector, plainto_tsquery('english', p_query)) DESC,
           p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
