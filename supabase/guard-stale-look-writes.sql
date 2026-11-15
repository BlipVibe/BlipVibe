-- =============================================================================
-- Old app copies can't change your look.  (proposed Nov 15 2026)
--
-- An outdated BlipVibe session (an old browser tab, another device on an older
-- build) saves its whole skin_data every few seconds and put back an old skin
-- (neon-wave) and an empty timeline over the owner's Scrapbook choices.
-- Current app builds save merge-style and stamp skin_data.syncV = 2.
-- For a client save WITHOUT that stamp, the look keys keep their current value;
-- everything else (coins, quests, settings, owned items via the other trigger)
-- still saves. Trusted SECURITY DEFINER RPCs pass straight through.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.guard_stale_look_writes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
DECLARE
  k TEXT;
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN RETURN NEW; END IF;
  IF OLD.skin_data IS NULL OR NEW.skin_data IS NOT DISTINCT FROM OLD.skin_data THEN RETURN NEW; END IF;
  IF COALESCE((NEW.skin_data->>'syncV')::int, 0) >= 2 THEN RETURN NEW; END IF;
  FOREACH k IN ARRAY ARRAY['activePremiumSkin','activeSkin','activeFont','activeTemplate','activeNavStyle',
                           'activeIconSet','activeLogo','activeCoinSkin','premiumBgUrl','fsTimelinePhotos'] LOOP
    IF OLD.skin_data ? k THEN
      NEW.skin_data := jsonb_set(NEW.skin_data, ARRAY[k], OLD.skin_data->k);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_stale_look_writes_trg ON public.profiles;
CREATE TRIGGER guard_stale_look_writes_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_stale_look_writes();
