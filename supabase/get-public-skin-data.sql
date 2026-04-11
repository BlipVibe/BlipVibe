-- =============================================================================
-- Get Public Skin Data: Returns visual customization fields from skin_data
-- for any user (no private data exposed)
-- Run this in Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_public_skin_data(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sd JSONB;
BEGIN
  SELECT skin_data INTO sd FROM public.profiles WHERE id = target_user_id;
  IF sd IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;
  -- Only return visual customization fields (no private settings)
  RETURN jsonb_build_object(
    'activeSkin', sd->'activeSkin',
    'activePremiumSkin', sd->'activePremiumSkin',
    'activeFont', sd->'activeFont',
    'activeTemplate', sd->'activeTemplate',
    'premiumBgUrl', sd->'premiumBgUrl',
    'premiumBgOverlay', sd->'premiumBgOverlay',
    'premiumBgDarkness', sd->'premiumBgDarkness',
    'premiumCardTransparency', sd->'premiumCardTransparency'
  );
END;
$$;
