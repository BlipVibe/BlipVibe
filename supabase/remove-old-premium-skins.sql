-- =============================================================================
-- Old Premium Skins retired (owner, Nov 21 2026)
--   * everyone wearing a premium / full skin goes back to the BlipVibe default
--     (owner chose "everyone wearing a skin", including the new finished full skins)
--   * groups wearing an old premium skin go back to default too (that shop tab is gone)
--   * everyone gets +1000 coins on top of their balance
--   * purchases (ownedPremiumSkins) are kept, so anyone who paid can equip the new version
-- Run in the Supabase SQL editor (runs as postgres, so the look guard and coin guard let it through).
-- activePremiumSkin is set to null (not removed): the app only applies keys that are present.
-- =============================================================================

-- 1) preview (read-only)
SELECT
  (SELECT count(*) FROM public.profiles) AS users,
  (SELECT count(*) FROM public.profiles WHERE COALESCE(skin_data->>'activePremiumSkin','') <> '') AS users_wearing_skin,
  (SELECT count(*) FROM public.groups   WHERE COALESCE(skin_data->>'activePremiumSkin','') <> '') AS groups_wearing_skin;

-- 2) the change
BEGIN;

UPDATE public.profiles
SET skin_data = skin_data || jsonb_build_object(
      'activePremiumSkin', NULL,
      'premiumBgUrl', NULL, 'premiumBgOverlay', 0, 'premiumBgDarkness', 0, 'premiumCardTransparency', 0.1)
WHERE COALESCE(skin_data->>'activePremiumSkin','') <> '';

UPDATE public.groups
SET skin_data = (skin_data - 'premiumBg') || jsonb_build_object('activePremiumSkin', NULL)
WHERE COALESCE(skin_data->>'activePremiumSkin','') <> '';

UPDATE public.profiles SET coin_balance = COALESCE(coin_balance, 0) + 1000;

COMMIT;
