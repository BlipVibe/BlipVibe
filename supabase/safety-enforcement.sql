-- =============================================================================
-- BlipVibe — Safety Enforcement Migration
-- Run this ENTIRE file once in the Supabase SQL Editor. Safe to re-run.
--
-- What it fixes:
--   1. Blocking is now enforced by the database, not just hidden in the UI.
--   2. Reports go into a real table that admins can read (they never did before).
--   3. Suspended accounts can no longer post, comment, like, follow or message.
--   4. coin_balance / is_admin / is_suspended can no longer be written by the
--      client, so a user cannot give themselves coins or unsuspend themselves.
--   5. A sender can edit their own message again (the old policy only allowed
--      the receiver to update a row, so "edit message" silently failed).
-- =============================================================================


-- =============================================================================
-- 1. PREREQUISITE COLUMNS
-- =============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Starting coin balance lives in ONE place now (the column default). The client
-- used to send coin_balance:100 on signup, which overrode the old 1000 default —
-- so 100 is the balance new users actually get today. Making it the default
-- keeps that behaviour after the client stops sending the column.
ALTER TABLE public.profiles ALTER COLUMN coin_balance SET DEFAULT 100;


-- =============================================================================
-- 2. ADMIN + SUSPENSION HELPERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.account_suspended(p_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT p.is_suspended FROM public.profiles p WHERE p.id = p_uid), false);
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin()        TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.account_suspended(UUID)    TO authenticated, anon;


-- =============================================================================
-- 3. BLOCKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT blocks_no_self CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks (blocked_id, blocker_id);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- You can read only the blocks YOU created. Deliberately: a blocked user must
-- not be able to learn that they were blocked — the policies below make the
-- blocker's content invisible to them instead.
DROP POLICY IF EXISTS blocks_select ON public.blocks;
CREATE POLICY blocks_select ON public.blocks
    FOR SELECT USING (auth.uid() = blocker_id OR public.is_platform_admin());

DROP POLICY IF EXISTS blocks_insert ON public.blocks;
CREATE POLICY blocks_insert ON public.blocks
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS blocks_delete ON public.blocks;
CREATE POLICY blocks_delete ON public.blocks
    FOR DELETE USING (auth.uid() = blocker_id);


-- Is there a block in EITHER direction between these two users?
-- SECURITY DEFINER so it can see the "they blocked me" row that RLS hides.
CREATE OR REPLACE FUNCTION public.is_blocked_pair(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT p_a IS NOT NULL
     AND p_b IS NOT NULL
     AND p_a <> p_b
     AND EXISTS (
           SELECT 1 FROM public.blocks b
           WHERE (b.blocker_id = p_a AND b.blocked_id = p_b)
              OR (b.blocker_id = p_b AND b.blocked_id = p_a));
$$;

-- Post author lookup that ignores RLS, so a comment/like policy can still tell
-- who owns a post whose rows the caller is no longer allowed to see.
CREATE OR REPLACE FUNCTION public.post_author(p_post UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT p.author_id FROM public.posts p WHERE p.id = p_post;
$$;

GRANT EXECUTE ON FUNCTION public.is_blocked_pair(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.post_author(UUID)           TO authenticated, anon;


-- =============================================================================
-- 4. REPORTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type    TEXT NOT NULL CHECK (target_type IN ('post','user','comment','photo','story','group','message')),
    target_id      TEXT,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason         TEXT NOT NULL,
    details        TEXT,
    status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','actioned','dismissed')),
    reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_status  ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target  ON public.reports (target_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports (reporter_id, created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reporters can see their own reports; admins see everything.
DROP POLICY IF EXISTS reports_select ON public.reports;
CREATE POLICY reports_select ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id OR public.is_platform_admin());

-- All writes go through the SECURITY DEFINER RPCs below, so the rate limit and
-- the admin check cannot be bypassed by talking to the table directly.
DROP POLICY IF EXISTS reports_no_insert ON public.reports;
CREATE POLICY reports_no_insert ON public.reports FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS reports_no_update ON public.reports;
CREATE POLICY reports_no_update ON public.reports FOR UPDATE USING (false);
DROP POLICY IF EXISTS reports_no_delete ON public.reports;
CREATE POLICY reports_no_delete ON public.reports FOR DELETE USING (false);


-- =============================================================================
-- 5. LOCK THE PROTECTED PROFILE COLUMNS
--
-- Column-level REVOKE does not remove a privilege the role already holds at
-- table level, so the REVOKE statements alone are not enough (this is why the
-- existing REVOKE UPDATE (is_admin) may never have taken effect). The trigger
-- below is the real guarantee: it runs for every client write and puts the
-- protected columns back the way they were.
--
-- SECURITY DEFINER RPCs (award_coins, purchase_item, admin_toggle_suspend, ...)
-- run as their owner rather than as 'authenticated', so they are unaffected and
-- need no changes.
--
-- Protected columns are reverted silently rather than raising an error, so that
-- older app builds still in the wild keep working instead of erroring on every
-- coin update.
-- =============================================================================
REVOKE UPDATE (coin_balance, is_admin, is_suspended) ON public.profiles FROM authenticated;
REVOKE UPDATE (coin_balance, is_admin, is_suspended) ON public.profiles FROM anon;

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only client roles are restricted. Inside a SECURITY DEFINER function
    -- current_user is the function owner, so trusted RPCs pass straight through.
    IF current_user NOT IN ('authenticated', 'anon') THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        NEW.coin_balance := OLD.coin_balance;
        NEW.is_admin     := OLD.is_admin;
        NEW.is_suspended := OLD.is_suspended;
    ELSE  -- INSERT
        NEW.coin_balance := COALESCE(
            (SELECT p.coin_balance FROM public.profiles p WHERE p.id = NEW.id), 100);
        NEW.is_admin     := false;
        NEW.is_suspended := false;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_columns_trg
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();


-- =============================================================================
-- 6. POLICIES — BLOCK + SUSPENSION ENFORCEMENT ON CORE TABLES
-- =============================================================================

-- ---- POSTS ------------------------------------------------------------------
DROP POLICY IF EXISTS posts_select ON public.posts;
CREATE POLICY posts_select ON public.posts
    FOR SELECT USING (
        public.is_platform_admin()
        OR NOT public.is_blocked_pair(auth.uid(), author_id)
    );

DROP POLICY IF EXISTS posts_insert ON public.posts;
CREATE POLICY posts_insert ON public.posts
    FOR INSERT WITH CHECK (
        auth.uid() = author_id
        AND NOT public.account_suspended(auth.uid())
    );

DROP POLICY IF EXISTS posts_update ON public.posts;
CREATE POLICY posts_update ON public.posts
    FOR UPDATE USING (auth.uid() = author_id AND NOT public.account_suspended(auth.uid()))
    WITH CHECK (auth.uid() = author_id);

-- Deleting your own content stays allowed even while suspended.
DROP POLICY IF EXISTS posts_delete ON public.posts;
CREATE POLICY posts_delete ON public.posts
    FOR DELETE USING (auth.uid() = author_id);

-- ---- COMMENTS ---------------------------------------------------------------
DROP POLICY IF EXISTS comments_select ON public.comments;
CREATE POLICY comments_select ON public.comments
    FOR SELECT USING (
        public.is_platform_admin()
        OR NOT public.is_blocked_pair(auth.uid(), author_id)
    );

DROP POLICY IF EXISTS comments_insert ON public.comments;
CREATE POLICY comments_insert ON public.comments
    FOR INSERT WITH CHECK (
        auth.uid() = author_id
        AND NOT public.account_suspended(auth.uid())
        AND NOT public.is_blocked_pair(auth.uid(), public.post_author(post_id))
    );

DROP POLICY IF EXISTS comments_update ON public.comments;
CREATE POLICY comments_update ON public.comments
    FOR UPDATE USING (auth.uid() = author_id AND NOT public.account_suspended(auth.uid()))
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS comments_delete ON public.comments;
CREATE POLICY comments_delete ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- ---- LIKES ------------------------------------------------------------------
DROP POLICY IF EXISTS likes_insert ON public.likes;
CREATE POLICY likes_insert ON public.likes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND NOT public.account_suspended(auth.uid())
        AND (
            target_type <> 'post'
            OR NOT public.is_blocked_pair(auth.uid(), public.post_author(target_id))
        )
    );

-- ---- FOLLOWS ----------------------------------------------------------------
DROP POLICY IF EXISTS follows_insert ON public.follows;
CREATE POLICY follows_insert ON public.follows
    FOR INSERT WITH CHECK (
        auth.uid() = follower_id
        AND NOT public.account_suspended(auth.uid())
        AND NOT public.is_blocked_pair(auth.uid(), followed_id)
    );

DROP POLICY IF EXISTS follows_select ON public.follows;
CREATE POLICY follows_select ON public.follows
    FOR SELECT USING (
        public.is_platform_admin()
        OR NOT public.is_blocked_pair(auth.uid(), follower_id)
    );

-- ---- MESSAGES ---------------------------------------------------------------
DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND NOT public.account_suspended(auth.uid())
        AND NOT public.is_blocked_pair(sender_id, receiver_id)
    );

-- The old policy allowed only the receiver to update a row, which meant the
-- sender could never edit their own message. Both sides may update now; the
-- sender edits content, the receiver marks it read.
DROP POLICY IF EXISTS messages_update ON public.messages;
CREATE POLICY messages_update ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
    WITH CHECK  (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ---- NOTIFICATIONS ----------------------------------------------------------
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND NOT public.account_suspended(auth.uid())
        AND NOT public.is_blocked_pair(auth.uid(), user_id)
    );


-- =============================================================================
-- 7. POLICIES — OPTIONAL TABLES (only applied if the table exists)
-- =============================================================================
DO $do$
BEGIN
    -- ---- STORIES ----
    IF to_regclass('public.stories') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS stories_select ON public.stories';
        EXECUTE 'CREATE POLICY stories_select ON public.stories FOR SELECT USING (
                     public.is_platform_admin()
                     OR NOT public.is_blocked_pair(auth.uid(), user_id))';
        EXECUTE 'DROP POLICY IF EXISTS stories_insert ON public.stories';
        EXECUTE 'CREATE POLICY stories_insert ON public.stories FOR INSERT WITH CHECK (
                     auth.uid() = user_id
                     AND NOT public.account_suspended(auth.uid()))';
        EXECUTE 'DROP POLICY IF EXISTS stories_delete ON public.stories';
        EXECUTE 'CREATE POLICY stories_delete ON public.stories FOR DELETE USING (auth.uid() = user_id)';
    END IF;

    -- ---- PHOTO COMMENTS ----
    IF to_regclass('public.photo_comments') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS photo_comments_select ON public.photo_comments';
        EXECUTE 'CREATE POLICY photo_comments_select ON public.photo_comments FOR SELECT USING (
                     public.is_platform_admin()
                     OR NOT public.is_blocked_pair(auth.uid(), author_id))';
        EXECUTE 'DROP POLICY IF EXISTS photo_comments_insert ON public.photo_comments';
        EXECUTE 'CREATE POLICY photo_comments_insert ON public.photo_comments FOR INSERT WITH CHECK (
                     auth.uid() = author_id
                     AND NOT public.account_suspended(auth.uid()))';
        EXECUTE 'DROP POLICY IF EXISTS photo_comments_delete ON public.photo_comments';
        EXECUTE 'CREATE POLICY photo_comments_delete ON public.photo_comments FOR DELETE USING (auth.uid() = author_id)';
    END IF;

    -- ---- PHOTO LIKES / REACTIONS ----
    IF to_regclass('public.photo_likes') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS photo_likes_insert ON public.photo_likes';
        EXECUTE 'CREATE POLICY photo_likes_insert ON public.photo_likes FOR INSERT WITH CHECK (
                     auth.uid() = user_id
                     AND NOT public.account_suspended(auth.uid()))';
    END IF;

    -- ---- GROUP CHAT MESSAGES ----
    IF to_regclass('public.group_chat_messages') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS group_chat_messages_insert ON public.group_chat_messages';
        EXECUTE 'CREATE POLICY group_chat_messages_insert ON public.group_chat_messages FOR INSERT WITH CHECK (
                     auth.uid() = author_id
                     AND NOT public.account_suspended(auth.uid()))';
    END IF;

    -- ---- SCHEDULED POSTS ----
    IF to_regclass('public.scheduled_posts') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS scheduled_posts_insert ON public.scheduled_posts';
        EXECUTE 'CREATE POLICY scheduled_posts_insert ON public.scheduled_posts FOR INSERT WITH CHECK (
                     auth.uid() = author_id
                     AND NOT public.account_suspended(auth.uid()))';
    END IF;
END
$do$;


-- =============================================================================
-- 8. RPCs — BLOCKING
-- =============================================================================
CREATE OR REPLACE FUNCTION public.block_user(p_target UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF p_target IS NULL OR p_target = v_uid THEN RAISE EXCEPTION 'Invalid target'; END IF;

    INSERT INTO public.blocks (blocker_id, blocked_id)
    VALUES (v_uid, p_target)
    ON CONFLICT DO NOTHING;

    -- A block breaks the relationship in both directions.
    DELETE FROM public.follows
     WHERE (follower_id = v_uid AND followed_id = p_target)
        OR (follower_id = p_target AND followed_id = v_uid);
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_user(p_target UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    DELETE FROM public.blocks WHERE blocker_id = v_uid AND blocked_id = p_target;
END;
$$;

-- Returns only the users YOU blocked, with enough detail to render the list.
CREATE OR REPLACE FUNCTION public.get_blocked_users()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'id',          p.id,
             'username',    p.username,
             'displayName', p.display_name,
             'bio',         p.bio,
             'avatarUrl',   p.avatar_url,
             'createdAt',   b.created_at
         ) ORDER BY b.created_at DESC), '[]'::jsonb)
  FROM public.blocks b
  JOIN public.profiles p ON p.id = b.blocked_id
  WHERE b.blocker_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.block_user(UUID)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(UUID)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_blocked_users()  TO authenticated;


-- =============================================================================
-- 9. RPCs — REPORTING
-- =============================================================================
CREATE OR REPLACE FUNCTION public.submit_report(
    p_target_type    TEXT,
    p_target_id      TEXT DEFAULT NULL,
    p_target_user_id UUID DEFAULT NULL,
    p_reason         TEXT DEFAULT 'Other',
    p_details        TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid   UUID := auth.uid();
    v_count INT;
    v_id    UUID;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Anti-spam: 30 reports per user per rolling 24 hours.
    SELECT count(*) INTO v_count
      FROM public.reports
     WHERE reporter_id = v_uid AND created_at > now() - interval '24 hours';
    IF v_count >= 30 THEN
        RAISE EXCEPTION 'Report limit reached. Please try again later.';
    END IF;

    INSERT INTO public.reports (reporter_id, target_type, target_id, target_user_id, reason, details)
    VALUES (v_uid, p_target_type, p_target_id, p_target_user_id,
            COALESCE(NULLIF(trim(p_reason), ''), 'Other'),
            NULLIF(trim(COALESCE(p_details, '')), ''))
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_reports(
    p_status TEXT DEFAULT 'open',
    p_limit  INT  DEFAULT 100,
    p_offset INT  DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE result JSONB;
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Unauthorized: admin access required';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC), '[]'::jsonb)
      INTO result
      FROM (
        SELECT r.id, r.target_type, r.target_id, r.reason, r.details,
               r.status, r.created_at, r.reviewed_at,
               r.reporter_id,
               rep.username     AS reporter_username,
               r.target_user_id,
               tgt.username     AS target_username,
               tgt.is_suspended AS target_suspended
          FROM public.reports r
          LEFT JOIN public.profiles rep ON rep.id = r.reporter_id
          LEFT JOIN public.profiles tgt ON tgt.id = r.target_user_id
         WHERE (p_status IS NULL OR p_status = 'all' OR r.status = p_status)
         ORDER BY r.created_at DESC
         LIMIT GREATEST(p_limit, 1) OFFSET GREATEST(p_offset, 0)
      ) t;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_resolve_report(p_report_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Unauthorized: admin access required';
    END IF;
    IF p_status NOT IN ('open', 'actioned', 'dismissed') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;

    UPDATE public.reports
       SET status      = p_status,
           reviewed_by = auth.uid(),
           reviewed_at = now()
     WHERE id = p_report_id;

    IF to_regclass('public.admin_logs') IS NOT NULL THEN
        INSERT INTO public.admin_logs (admin_id, target_user_id, action, details)
        SELECT auth.uid(), r.target_user_id, 'resolve_report',
               jsonb_build_object('report_id', p_report_id, 'status', p_status,
                                  'target_type', r.target_type)
          FROM public.reports r WHERE r.id = p_report_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_open_report_count()
RETURNS INT
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v INT;
BEGIN
    IF NOT public.is_platform_admin() THEN RETURN 0; END IF;
    SELECT count(*) INTO v FROM public.reports WHERE status = 'open';
    RETURN COALESCE(v, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_report(TEXT, TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_reports(TEXT, INT, INT)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(UUID, TEXT)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_open_report_count()                   TO authenticated;


-- =============================================================================
-- 10. BACKFILL — move existing blocks out of skin_data into the blocks table
-- =============================================================================
DO $do$
DECLARE
    r RECORD;
    k TEXT;
BEGIN
    FOR r IN SELECT id, skin_data FROM public.profiles
              WHERE skin_data IS NOT NULL
                AND jsonb_typeof(skin_data->'blockedUsers') = 'object'
    LOOP
        FOR k IN SELECT jsonb_object_keys(r.skin_data->'blockedUsers')
        LOOP
            BEGIN
                IF (r.skin_data->'blockedUsers'->>k) IN ('true', '1') THEN
                    INSERT INTO public.blocks (blocker_id, blocked_id)
                    VALUES (r.id, k::uuid)
                    ON CONFLICT DO NOTHING;
                END IF;
            EXCEPTION WHEN others THEN
                -- Skip malformed keys or users who no longer exist.
                NULL;
            END;
        END LOOP;
    END LOOP;
END
$do$;


-- =============================================================================
-- 11. VERIFY — read the output of these to confirm the migration landed
-- =============================================================================
SELECT 'blocks rows'            AS check, count(*)::text AS value FROM public.blocks
UNION ALL
SELECT 'reports rows',            count(*)::text FROM public.reports
UNION ALL
SELECT 'protect trigger present', count(*)::text FROM pg_trigger
       WHERE tgname = 'protect_profile_columns_trg'
UNION ALL
SELECT 'suspended accounts',      count(*)::text FROM public.profiles WHERE is_suspended
UNION ALL
SELECT 'admins',                  count(*)::text FROM public.profiles WHERE is_admin;
