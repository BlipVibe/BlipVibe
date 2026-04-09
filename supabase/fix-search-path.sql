-- Fix Function Search Path Mutable warnings
-- Sets search_path = public on all functions to prevent schema poisoning

ALTER FUNCTION public.get_own_profile() SET search_path = public;
ALTER FUNCTION public.posts_search_update() SET search_path = public;
ALTER FUNCTION public.search_posts(text, int) SET search_path = public;
ALTER FUNCTION public.claim_daily_reward() SET search_path = public;
ALTER FUNCTION public.log_post_edit() SET search_path = public;
ALTER FUNCTION public.admin_user_count(text) SET search_path = public;
ALTER FUNCTION public.admin_toggle_suspend(uuid) SET search_path = public;
ALTER FUNCTION public.send_message_ratelimited(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_get_users(text, int, int) SET search_path = public;
ALTER FUNCTION public.admin_delete_user(uuid) SET search_path = public;
ALTER FUNCTION public.admin_get_logs(int, int) SET search_path = public;
ALTER FUNCTION public.is_current_user_admin() SET search_path = public;
ALTER FUNCTION public.search_profiles(text, int) SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.purchase_user_skin(text, text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.purchase_group_skin(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.award_coins(uuid, int) SET search_path = public;
ALTER FUNCTION public.confirm_user(uuid) SET search_path = public;
