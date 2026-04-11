-- =============================================================================
-- Server-Side Coin Rewards: All coin earning goes through the server
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Award coins for engagement (likes, comments, posts, etc.)
-- Enforces daily caps server-side
CREATE OR REPLACE FUNCTION public.award_coins(
  p_type TEXT,      -- 'postLike','commentLike','post','comment','reply','follow','streak'
  p_amount INT,
  p_ref_id TEXT DEFAULT NULL  -- optional reference (post ID, comment ID) to prevent double-awards
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_balance INT;
  v_skin_data JSONB;
  v_infinity BOOLEAN;
  v_daily_key TEXT;
  v_daily JSONB;
  v_count INT;
  v_cap INT;
  v_awarded_key TEXT;
  v_already_awarded BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current state
  SELECT coin_balance, skin_data INTO v_balance, v_skin_data
  FROM public.profiles WHERE id = v_uid FOR UPDATE;

  IF v_skin_data IS NULL THEN v_skin_data := '{}'::JSONB; END IF;

  -- Check infinity — still award but don't change balance
  v_infinity := COALESCE((v_skin_data->>'infinityCoins')::BOOLEAN, false);

  -- Daily cap enforcement
  v_daily_key := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_daily := COALESCE(v_skin_data->'dailyCaps', '{}'::JSONB);

  -- Reset daily caps if date changed
  IF COALESCE(v_daily->>'date', '') != v_daily_key THEN
    v_daily := jsonb_build_object('date', v_daily_key);
  END IF;

  -- Get current count for this type
  v_count := COALESCE((v_daily->>p_type)::INT, 0);

  -- Define caps per type
  v_cap := CASE p_type
    WHEN 'postLike' THEN 30
    WHEN 'commentLike' THEN 20
    WHEN 'post' THEN 5
    WHEN 'comment' THEN 15
    WHEN 'reply' THEN 10
    WHEN 'follow' THEN 10
    WHEN 'streak' THEN 1
    ELSE 100
  END;

  -- Check cap
  IF v_count >= v_cap THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_cap', 'balance', v_balance);
  END IF;

  -- Check reference ID for double-award prevention
  IF p_ref_id IS NOT NULL THEN
    v_awarded_key := 'awarded_' || p_type;
    IF v_skin_data->v_awarded_key IS NOT NULL AND v_skin_data->v_awarded_key ? p_ref_id THEN
      v_already_awarded := true;
    END IF;
  END IF;

  IF v_already_awarded THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_awarded', 'balance', v_balance);
  END IF;

  -- Increment daily count
  v_daily := jsonb_set(v_daily, ARRAY[p_type], to_jsonb(v_count + 1));
  v_skin_data := jsonb_set(v_skin_data, ARRAY['dailyCaps'], v_daily);

  -- Track reference ID if provided
  IF p_ref_id IS NOT NULL AND NOT v_already_awarded THEN
    IF v_skin_data->v_awarded_key IS NULL THEN
      v_skin_data := jsonb_set(v_skin_data, ARRAY[v_awarded_key], '{}'::JSONB);
    END IF;
    v_skin_data := jsonb_set(v_skin_data, ARRAY[v_awarded_key, p_ref_id], 'true'::JSONB);
  END IF;

  -- Award coins (skip balance change for infinity users)
  IF NOT v_infinity THEN
    UPDATE public.profiles
    SET coin_balance = coin_balance + p_amount,
        skin_data = v_skin_data
    WHERE id = v_uid;
    v_balance := v_balance + p_amount;
  ELSE
    UPDATE public.profiles
    SET skin_data = v_skin_data
    WHERE id = v_uid;
  END IF;

  RETURN jsonb_build_object('success', true, 'balance', v_balance, 'awarded', p_amount);
END;
$$;
