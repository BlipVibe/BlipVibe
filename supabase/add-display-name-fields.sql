-- =============================================================================
-- BlipVibe — Add structured display name fields
-- Run AFTER schema.sql, admin-setup.sql, security-hardening-phase2.sql
-- =============================================================================

-- 1. Add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'real_name';

-- Add CHECK constraint for display_mode (idempotent — drop first if exists)
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_display_mode_check
    CHECK (display_mode IN ('real_name', 'nickname'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 2. Backfill existing rows: parse display_name into first/last
--    Split on first space: "John Smith" -> first="John", last="Smith"
--    Single word or NULL -> first = display_name or username, last = ''
UPDATE public.profiles
SET
  first_name = CASE
    WHEN display_name IS NOT NULL AND display_name LIKE '% %'
      THEN split_part(display_name, ' ', 1)
    WHEN display_name IS NOT NULL AND display_name <> ''
      THEN display_name
    ELSE username
  END,
  last_name = CASE
    WHEN display_name IS NOT NULL AND display_name LIKE '% %'
      THEN substring(display_name FROM position(' ' IN display_name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL;


-- 3. Update handle_new_user trigger to read first/last from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_first TEXT;
  v_last TEXT;
  v_display TEXT;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_first := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  -- Compute display_name: "First Last" if available, else username
  IF v_first <> '' OR v_last <> '' THEN
    v_display := TRIM(BOTH FROM (v_first || ' ' || v_last));
  ELSE
    v_display := v_username;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, first_name, last_name, display_mode, bio, avatar_url, cover_photo_url)
  VALUES (
    NEW.id,
    v_username,
    v_display,
    v_first,
    v_last,
    'real_name',
    '',
    NULL,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Update search_profiles to also search first_name, last_name, nickname
CREATE OR REPLACE FUNCTION public.search_profiles(p_query TEXT, p_limit INT DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pattern TEXT;
  result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_pattern := '%' || REPLACE(REPLACE(REPLACE(p_query, '%', ''), '_', ''), '\', '') || '%';

  SELECT jsonb_agg(row_to_json(r)::jsonb)
  INTO result
  FROM (
    SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.cover_photo_url
    FROM public.profiles p
    WHERE p.username ILIKE v_pattern
       OR p.display_name ILIKE v_pattern
       OR p.first_name ILIKE v_pattern
       OR p.last_name ILIKE v_pattern
       OR p.nickname ILIKE v_pattern
       OR p.bio ILIKE v_pattern
    LIMIT p_limit
  ) r;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;


-- 5. Update admin_get_users to also search new fields
CREATE OR REPLACE FUNCTION public.admin_get_users(search_query TEXT DEFAULT '', page_size INT DEFAULT 50, page_offset INT DEFAULT 0)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_admin BOOLEAN;
  result JSONB;
BEGIN
  SELECT is_admin INTO caller_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT jsonb_agg(row_to_json(u)::jsonb ORDER BY u.created_at DESC)
  INTO result
  FROM (
    SELECT p.id, p.username, p.display_name, p.email, p.avatar_url,
           p.is_admin, p.is_suspended, p.created_at,
           (SELECT count(*) FROM public.posts WHERE author_id = p.id) AS post_count
    FROM public.profiles p
    WHERE search_query = ''
       OR p.username ILIKE '%' || search_query || '%'
       OR p.display_name ILIKE '%' || search_query || '%'
       OR p.first_name ILIKE '%' || search_query || '%'
       OR p.last_name ILIKE '%' || search_query || '%'
       OR p.nickname ILIKE '%' || search_query || '%'
       OR p.email ILIKE '%' || search_query || '%'
    ORDER BY p.created_at DESC
    LIMIT page_size OFFSET page_offset
  ) u;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;


-- =============================================================================
-- DONE — Run this migration in Supabase SQL Editor
-- =============================================================================
