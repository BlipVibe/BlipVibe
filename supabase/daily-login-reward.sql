-- Daily Login Reward System (server-side, cheat-proof)
-- Uses server timestamp so device clock manipulation won't work

-- 1. Add columns to profiles for tracking daily rewards
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_reward timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_login_streak int DEFAULT 0;

-- 2. Server-side RPC that handles the entire reward logic
--    Returns: { awarded: bool, coins: int, streak: int, next_available: timestamptz }
CREATE OR REPLACE FUNCTION claim_daily_reward()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_last_reward timestamptz;
  v_streak int;
  v_reward int := 5;
  v_hours_since numeric;
  v_next_available timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('awarded', false, 'error', 'Not authenticated');
  END IF;

  -- Get current reward state
  SELECT last_daily_reward, daily_login_streak
  INTO v_last_reward, v_streak
  FROM profiles WHERE id = v_user_id;

  -- Check if 24 hours have passed since last reward
  IF v_last_reward IS NOT NULL THEN
    v_hours_since := EXTRACT(EPOCH FROM (v_now - v_last_reward)) / 3600.0;
    IF v_hours_since < 24 THEN
      v_next_available := v_last_reward + interval '24 hours';
      RETURN jsonb_build_object(
        'awarded', false,
        'streak', COALESCE(v_streak, 0),
        'next_available', v_next_available,
        'hours_remaining', ROUND((24 - v_hours_since)::numeric, 1)
      );
    END IF;

    -- Check if within 48 hours (streak continues) or beyond (streak resets)
    IF v_hours_since <= 48 THEN
      v_streak := COALESCE(v_streak, 0) + 1;
    ELSE
      v_streak := 1; -- streak broken, reset
    END IF;
  ELSE
    v_streak := 1; -- first ever reward
  END IF;

  -- Award is always 5 coins
  v_reward := 5;

  -- Update profile: add coins, update reward timestamp and streak
  UPDATE profiles
  SET coin_balance = COALESCE(coin_balance, 0) + v_reward,
      last_daily_reward = v_now,
      daily_login_streak = v_streak
  WHERE id = v_user_id;

  v_next_available := v_now + interval '24 hours';

  RETURN jsonb_build_object(
    'awarded', true,
    'coins', v_reward,
    'streak', v_streak,
    'new_balance', (SELECT coin_balance FROM profiles WHERE id = v_user_id),
    'next_available', v_next_available
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
