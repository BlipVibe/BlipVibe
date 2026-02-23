-- =============================================================================
-- Super Admin Setup
-- Run this in Supabase SQL Editor
-- =============================================================================
--
-- Adds an is_admin flag to profiles and SECURITY DEFINER RPC functions
-- that check the flag server-side before allowing privileged actions.
-- =============================================================================

-- 1. Add is_admin column (default false, safe to re-run)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- 2. Mark yourself as admin (replace YOUR_USER_ID with your actual Supabase user ID)
--    You can find your user ID in Supabase Dashboard > Authentication > Users
--    Example:
--    UPDATE public.profiles SET is_admin = true WHERE username = 'YourUsername';

-- 3. Revoke direct UPDATE on is_admin from client roles (prevent privilege escalation)
REVOKE UPDATE (is_admin) ON public.profiles FROM authenticated;
REVOKE UPDATE (is_admin) ON public.profiles FROM anon;

-- 4. Admin: list all users (paginated)
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
       OR p.email ILIKE '%' || search_query || '%'
    ORDER BY p.created_at DESC
    LIMIT page_size OFFSET page_offset
  ) u;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 5. Admin: get total user count (for pagination)
CREATE OR REPLACE FUNCTION public.admin_user_count(search_query TEXT DEFAULT '')
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_admin BOOLEAN;
  total INT;
BEGIN
  SELECT is_admin INTO caller_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT count(*) INTO total
  FROM public.profiles p
  WHERE search_query = ''
     OR p.username ILIKE '%' || search_query || '%'
     OR p.display_name ILIKE '%' || search_query || '%'
     OR p.email ILIKE '%' || search_query || '%';

  RETURN total;
END;
$$;

-- 6. Admin: delete a user's account (profile + auth record)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_admin BOOLEAN;
  target_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO caller_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Prevent deleting other admins
  SELECT is_admin INTO target_admin FROM public.profiles WHERE id = target_id;
  IF COALESCE(target_admin, false) THEN
    RAISE EXCEPTION 'Cannot delete another admin account';
  END IF;

  -- Delete profile (cascades to posts, comments, likes, follows, etc.)
  DELETE FROM public.profiles WHERE id = target_id;
  -- Delete auth user record
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

-- 7. Admin: suspend / unsuspend a user
CREATE OR REPLACE FUNCTION public.admin_toggle_suspend(target_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_admin BOOLEAN;
  target_admin BOOLEAN;
  new_status BOOLEAN;
BEGIN
  SELECT is_admin INTO caller_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT is_admin INTO target_admin FROM public.profiles WHERE id = target_id;
  IF COALESCE(target_admin, false) THEN
    RAISE EXCEPTION 'Cannot suspend another admin';
  END IF;

  UPDATE public.profiles
  SET is_suspended = NOT COALESCE(is_suspended, false)
  WHERE id = target_id
  RETURNING is_suspended INTO new_status;

  RETURN new_status;
END;
$$;

-- 8. Check if current user is admin (lightweight, for UI gating)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT COALESCE(is_admin, false) INTO result
  FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(result, false);
END;
$$;

-- =============================================================================
-- IMPORTANT: After running this SQL, set yourself as admin:
--   UPDATE public.profiles SET is_admin = true WHERE username = 'your_username';
-- =============================================================================
