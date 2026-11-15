-- =============================================================================
-- Your look changes only when YOU apply it.  (Nov 15 2026, owner's idea)
--
-- Problem: an outdated BlipVibe session (old browser tab / another device on an
-- older build) kept saving its whole skin_data every few seconds and put back an
-- old skin (neon-wave) and an empty timeline over the owner's Scrapbook choices.
-- Seen live: Scrapbook saved 18:05:15Z, neon-wave written back 18:05:30Z.
--
-- Rule: ordinary client saves to profiles.skin_data can no longer change the
-- "look" keys — they keep their current value. The only way to change them is
-- set_skin_look(), which the app calls when you apply a skin/font/template/etc.
-- or pick a timeline photo. Everything else (coins, quests, settings) saves as
-- before; owned items are still protected by preserve_owned_items.
-- =============================================================================

-- 1) the one door for look changes
CREATE OR REPLACE FUNCTION public.set_skin_look(p_changes JSONB)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  k TEXT;
  sd JSONB;
  allowed TEXT[] := ARRAY['activePremiumSkin','activeSkin','activeFont','activeTemplate','activeNavStyle',
                          'activeIconSet','activeLogo','activeCoinSkin','premiumBgUrl','premiumBgOverlay',
                          'premiumBgDarkness','premiumCardTransparency','fsTimelinePhotos'];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF jsonb_typeof(p_changes) <> 'object' THEN RAISE EXCEPTION 'changes must be an object'; END IF;
  SELECT COALESCE(skin_data, '{}'::jsonb) INTO sd FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  FOR k IN SELECT jsonb_object_keys(p_changes) LOOP
    IF k = ANY(allowed) THEN
      sd := jsonb_set(sd, ARRAY[k], p_changes->k, true);
    END IF;
  END LOOP;
  UPDATE public.profiles SET skin_data = sd WHERE id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.set_skin_look(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_skin_look(JSONB) TO authenticated;

-- 2) ordinary client saves keep the current look
CREATE OR REPLACE FUNCTION public.guard_stale_look_writes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
DECLARE
  k TEXT;
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN RETURN NEW; END IF;   -- set_skin_look / admin RPCs
  IF OLD.skin_data IS NULL OR NEW.skin_data IS NOT DISTINCT FROM OLD.skin_data THEN RETURN NEW; END IF;
  IF NEW.skin_data IS NULL THEN RETURN NEW; END IF;
  FOREACH k IN ARRAY ARRAY['activePremiumSkin','activeSkin','activeFont','activeTemplate','activeNavStyle',
                           'activeIconSet','activeLogo','activeCoinSkin','premiumBgUrl','premiumBgOverlay',
                           'premiumBgDarkness','premiumCardTransparency','fsTimelinePhotos'] LOOP
    IF OLD.skin_data ? k THEN
      NEW.skin_data := jsonb_set(NEW.skin_data, ARRAY[k], OLD.skin_data->k, true);
    ELSE
      NEW.skin_data := NEW.skin_data - k;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_stale_look_writes_trg ON public.profiles;
CREATE TRIGGER guard_stale_look_writes_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_stale_look_writes();
