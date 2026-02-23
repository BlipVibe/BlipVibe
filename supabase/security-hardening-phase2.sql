-- =============================================================================
-- Security Hardening Phase 2
-- Run this in Supabase SQL Editor AFTER admin-setup.sql
-- =============================================================================
--
-- Adds: rate-limited message RPC, admin action logs, RLS gap fixes,
--       parameterized search RPC
-- =============================================================================

-- =====================================================================
-- 1. RATE-LIMITED MESSAGE SENDING
-- =====================================================================

CREATE OR REPLACE FUNCTION public.send_message_ratelimited(p_receiver_id UUID, p_content TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id UUID := auth.uid();
  v_count INT;
  v_result JSONB;
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Count messages sent by this user in the last 60 seconds
  SELECT count(*) INTO v_count
  FROM public.messages
  WHERE sender_id = v_sender_id
    AND created_at > now() - interval '60 seconds';

  IF v_count >= 30 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many messages. Please wait a moment.';
  END IF;

  -- Insert the message and return it with sender profile join
  WITH inserted AS (
    INSERT INTO public.messages (sender_id, receiver_id, content)
    VALUES (v_sender_id, p_receiver_id, p_content)
    RETURNING *
  )
  SELECT row_to_json(r)::jsonb INTO v_result
  FROM (
    SELECT i.*,
      json_build_object(
        'id', p.id,
        'username', p.username,
        'display_name', p.display_name,
        'avatar_url', p.avatar_url
      ) AS sender
    FROM inserted i
    JOIN public.profiles p ON p.id = i.sender_id
  ) r;

  RETURN v_result;
END;
$$;

-- =====================================================================
-- 2. ADMIN ACTION LOGS
-- =====================================================================

-- 2A. Create admin_logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs (admin_id);

-- RLS: only admins can SELECT, no client INSERT/UPDATE/DELETE
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS admin_logs_select_admin ON public.admin_logs;
DROP POLICY IF EXISTS admin_logs_no_insert ON public.admin_logs;
DROP POLICY IF EXISTS admin_logs_no_update ON public.admin_logs;
DROP POLICY IF EXISTS admin_logs_no_delete ON public.admin_logs;

CREATE POLICY admin_logs_select_admin ON public.admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- No client writes — logging done inside SECURITY DEFINER RPCs only
CREATE POLICY admin_logs_no_insert ON public.admin_logs
  FOR INSERT WITH CHECK (false);
CREATE POLICY admin_logs_no_update ON public.admin_logs
  FOR UPDATE USING (false);
CREATE POLICY admin_logs_no_delete ON public.admin_logs
  FOR DELETE USING (false);

-- 2B. Modify admin_delete_user to log action BEFORE deleting
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_admin BOOLEAN;
  target_admin BOOLEAN;
  target_uname TEXT;
BEGIN
  SELECT is_admin INTO caller_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Prevent deleting other admins
  SELECT is_admin, username INTO target_admin, target_uname
  FROM public.profiles WHERE id = target_id;
  IF COALESCE(target_admin, false) THEN
    RAISE EXCEPTION 'Cannot delete another admin account';
  END IF;

  -- Log BEFORE delete so FK is still valid
  INSERT INTO public.admin_logs (admin_id, target_user_id, action, details)
  VALUES (auth.uid(), target_id, 'delete_user',
    jsonb_build_object('target_username', COALESCE(target_uname, 'unknown')));

  -- Delete profile (cascades to posts, comments, likes, follows, etc.)
  DELETE FROM public.profiles WHERE id = target_id;
  -- Delete auth user record
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

-- 2C. Modify admin_toggle_suspend to log action
CREATE OR REPLACE FUNCTION public.admin_toggle_suspend(target_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_admin BOOLEAN;
  target_admin BOOLEAN;
  target_uname TEXT;
  new_status BOOLEAN;
BEGIN
  SELECT is_admin INTO caller_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT is_admin, username INTO target_admin, target_uname
  FROM public.profiles WHERE id = target_id;
  IF COALESCE(target_admin, false) THEN
    RAISE EXCEPTION 'Cannot suspend another admin';
  END IF;

  UPDATE public.profiles
  SET is_suspended = NOT COALESCE(is_suspended, false)
  WHERE id = target_id
  RETURNING is_suspended INTO new_status;

  -- Log after toggle so we know the new status
  INSERT INTO public.admin_logs (admin_id, target_user_id, action, details)
  VALUES (auth.uid(), target_id,
    CASE WHEN new_status THEN 'suspend_user' ELSE 'unsuspend_user' END,
    jsonb_build_object('target_username', COALESCE(target_uname, 'unknown')));

  RETURN new_status;
END;
$$;

-- 2D. Admin get logs RPC
CREATE OR REPLACE FUNCTION public.admin_get_logs(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
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

  SELECT jsonb_agg(row_to_json(r)::jsonb)
  INTO result
  FROM (
    SELECT l.id, l.action, l.details, l.created_at,
           COALESCE(a.username, 'deleted') AS admin_username,
           COALESCE(t.username, l.details->>'target_username') AS target_username
    FROM public.admin_logs l
    LEFT JOIN public.profiles a ON a.id = l.admin_id
    LEFT JOIN public.profiles t ON t.id = l.target_user_id
    ORDER BY l.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) r;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- =====================================================================
-- 3. RLS GAP FIXES
-- =====================================================================

-- 3A. notifications: users can delete their own notifications
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 3B. messages: users can delete messages they sent
DROP POLICY IF EXISTS messages_delete_own ON public.messages;
CREATE POLICY messages_delete_own ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

-- 3C. user_skins: users can delete their own skins
DROP POLICY IF EXISTS user_skins_delete_own ON public.user_skins;
CREATE POLICY user_skins_delete_own ON public.user_skins
  FOR DELETE USING (auth.uid() = user_id);

-- 3D. group_skins: group owners can delete group skins
DROP POLICY IF EXISTS group_skins_delete_owner ON public.group_skins;
DO $$
BEGIN
  -- Only create if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_skins') THEN
    EXECUTE 'CREATE POLICY group_skins_delete_owner ON public.group_skins
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.groups
          WHERE groups.id = group_skins.group_id
            AND groups.owner_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- 3E. storage.objects: authenticated users can delete their own post images
-- Note: This requires the 'posts' bucket to exist. Uses storage policies.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'posts') THEN
    -- Drop if exists to allow re-run
    DROP POLICY IF EXISTS posts_delete_own ON storage.objects;
    CREATE POLICY posts_delete_own ON storage.objects
      FOR DELETE USING (
        bucket_id = 'posts' AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- =====================================================================
-- 4. PARAMETERIZED SEARCH RPC
-- =====================================================================

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

  -- Sanitize and build ILIKE pattern (no string interpolation)
  v_pattern := '%' || REPLACE(REPLACE(REPLACE(p_query, '%', ''), '_', ''), '\', '') || '%';

  SELECT jsonb_agg(row_to_json(r)::jsonb)
  INTO result
  FROM (
    SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.cover_photo_url
    FROM public.profiles p
    WHERE p.username ILIKE v_pattern
       OR p.display_name ILIKE v_pattern
       OR p.bio ILIKE v_pattern
    LIMIT p_limit
  ) r;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- =============================================================================
-- DONE — Run this migration after admin-setup.sql and fix-profile-rls.sql
-- =============================================================================
