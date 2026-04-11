-- =============================================================================
-- Server-Side Purchase: Validates and processes all shop purchases atomically
-- Run this in Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION public.purchase_item(
  p_item_type TEXT,   -- 'skin','premium','font','template','navstyle','icons','logo','coins','song'
  p_item_id TEXT,
  p_price INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_balance INT;
  v_skin_data JSONB;
  v_owned_key TEXT;
  v_infinity BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current balance and skin_data
  SELECT coin_balance, skin_data INTO v_balance, v_skin_data
  FROM public.profiles WHERE id = v_uid FOR UPDATE;

  IF v_skin_data IS NULL THEN v_skin_data := '{}'::JSONB; END IF;

  -- Check infinity coins
  v_infinity := COALESCE((v_skin_data->>'infinityCoins')::BOOLEAN, false);

  -- Validate balance (skip for infinity users)
  IF NOT v_infinity AND v_balance < p_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough coins', 'balance', v_balance);
  END IF;

  -- Map item type to ownership key in skin_data
  v_owned_key := CASE p_item_type
    WHEN 'skin' THEN 'ownedSkins'
    WHEN 'premium' THEN 'ownedPremiumSkins'
    WHEN 'font' THEN 'ownedFonts'
    WHEN 'template' THEN 'ownedTemplates'
    WHEN 'navstyle' THEN 'ownedNavStyles'
    WHEN 'icons' THEN 'ownedIconSets'
    WHEN 'logo' THEN 'ownedLogos'
    WHEN 'coins' THEN 'ownedCoinSkins'
    ELSE NULL
  END;

  IF v_owned_key IS NULL AND p_item_type != 'song' THEN
    RAISE EXCEPTION 'Invalid item type: %', p_item_type;
  END IF;

  -- Check if already owned
  IF v_owned_key IS NOT NULL THEN
    IF COALESCE(v_skin_data->v_owned_key->>p_item_id, '') = 'true' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already owned');
    END IF;

    -- Add to owned items
    IF v_skin_data->v_owned_key IS NULL THEN
      v_skin_data := jsonb_set(v_skin_data, ARRAY[v_owned_key], '{}'::JSONB);
    END IF;
    v_skin_data := jsonb_set(v_skin_data, ARRAY[v_owned_key, p_item_id], 'true'::JSONB);
  END IF;

  -- Deduct coins (skip for infinity users)
  IF NOT v_infinity THEN
    UPDATE public.profiles
    SET coin_balance = coin_balance - p_price,
        skin_data = v_skin_data
    WHERE id = v_uid;
    v_balance := v_balance - p_price;
  ELSE
    UPDATE public.profiles
    SET skin_data = v_skin_data
    WHERE id = v_uid;
  END IF;

  RETURN jsonb_build_object('success', true, 'balance', v_balance, 'item_type', p_item_type, 'item_id', p_item_id);
END;
$$;
