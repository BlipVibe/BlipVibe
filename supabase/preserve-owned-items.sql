-- =============================================================================
-- Owned items can only be ADDED by clients, never removed.  (applied Nov 15 2026)
--
-- Clients save the whole skin_data object. A device holding older skin data
-- (an idle tab, a second phone, a stale simulator) used to overwrite purchases
-- made elsewhere — last writer wins — which wiped a just-bought skin.
-- This trigger merges every owned* map with what the row already had, so a
-- client update can add keys but never drop them. Trusted SECURITY DEFINER
-- RPCs (purchase_item, admin tools) run as the function owner and pass
-- straight through.
--
-- Verified in a rolled-back transaction: as the signed-in user, setting
-- ownedSkins to {} left all 5 owned skins in place.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.preserve_owned_items()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp
AS $$
DECLARE
  k TEXT;
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF OLD.skin_data IS NULL OR NEW.skin_data IS NOT DISTINCT FROM OLD.skin_data THEN
    RETURN NEW;
  END IF;
  FOREACH k IN ARRAY ARRAY['ownedSkins','ownedPremiumSkins','ownedFonts','ownedTemplates',
                           'ownedNavStyles','ownedIconSets','ownedLogos','ownedCoinSkins'] LOOP
    IF jsonb_typeof(OLD.skin_data->k) = 'object' THEN
      NEW.skin_data := jsonb_set(COALESCE(NEW.skin_data, '{}'::jsonb), ARRAY[k],
        (OLD.skin_data->k) || COALESCE(CASE WHEN jsonb_typeof(NEW.skin_data->k) = 'object' THEN NEW.skin_data->k END, '{}'::jsonb));
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preserve_owned_items_trg ON public.profiles;
CREATE TRIGGER preserve_owned_items_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.preserve_owned_items();
