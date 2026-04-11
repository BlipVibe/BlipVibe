-- =============================================================================
-- Admin Delete Post: Allows admins to delete any post
-- Run this in Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_post(p_post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete the post (cascades to comments, likes, etc.)
  DELETE FROM public.posts WHERE id = p_post_id;
END;
$$;
