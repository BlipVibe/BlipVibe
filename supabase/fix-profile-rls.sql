-- =============================================================================
-- Fix Profile RLS: Hide skin_data, birthday, email from public queries
-- Run this in Supabase SQL Editor
-- =============================================================================
--
-- Problem: profiles_select policy is USING(true), meaning ANY logged-in user
-- can read ALL columns including email, birthday, and skin_data for every user.
--
-- Solution: Use Postgres column-level privileges to revoke SELECT on sensitive
-- columns. PostgREST (which Supabase uses) respects column grants — select(*)
-- will simply skip columns the role can't read.
--
-- The app uses get_own_profile() RPC to load the current user's full profile
-- (including private columns) via a SECURITY DEFINER function.
-- =============================================================================

-- 0. Ensure the columns exist first (safe to re-run)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skin_data JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday DATE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL;

-- Backfill email from auth.users for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 1. Revoke SELECT on sensitive columns from all client-facing roles
REVOKE SELECT (skin_data, birthday, email) ON public.profiles FROM authenticated;
REVOKE SELECT (skin_data, birthday, email) ON public.profiles FROM anon;

-- 2. SECURITY DEFINER function to let users read their OWN full profile
--    Called via: sb.rpc('get_own_profile')
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(p) INTO result
  FROM public.profiles p
  WHERE p.id = auth.uid();
  RETURN result;
END;
$$;

-- 3. Allow the profiles_update policy to still work for setting these columns.
--    UPDATE privilege is separate from SELECT — users can still write to their
--    own skin_data/birthday/email via sbUpdateProfile() as long as the RLS
--    UPDATE policy allows it (which it does: auth.uid() = id).
--
--    However, sbUpdateProfile() must NOT call .select() after update, because
--    that would try to read the revoked columns. The client code has been
--    updated to omit .select() on profile updates.
-- =============================================================================
