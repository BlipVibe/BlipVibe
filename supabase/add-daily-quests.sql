-- Daily Quest System + Tiered Streak Rewards
-- Tracks daily quest progress server-side to prevent cheating

-- Daily quests table
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  likes_count INT NOT NULL DEFAULT 0,
  follows_count INT NOT NULL DEFAULT 0,
  posts_count INT NOT NULL DEFAULT 0,
  likes_reward_claimed BOOLEAN NOT NULL DEFAULT false,
  follows_reward_claimed BOOLEAN NOT NULL DEFAULT false,
  posts_reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_date)
);

ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quests" ON user_quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests" ON user_quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests" ON user_quests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_quests_user_date ON user_quests (user_id, quest_date DESC);

-- RPC: Get or create today's quest progress
CREATE OR REPLACE FUNCTION get_daily_quests()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_quest record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Get or create today's quest row
  INSERT INTO user_quests (user_id, quest_date)
  VALUES (v_user_id, v_today)
  ON CONFLICT (user_id, quest_date) DO NOTHING;

  SELECT * INTO v_quest FROM user_quests
  WHERE user_id = v_user_id AND quest_date = v_today;

  RETURN jsonb_build_object(
    'date', v_today,
    'likes_count', v_quest.likes_count,
    'follows_count', v_quest.follows_count,
    'posts_count', v_quest.posts_count,
    'likes_reward_claimed', v_quest.likes_reward_claimed,
    'follows_reward_claimed', v_quest.follows_reward_claimed,
    'posts_reward_claimed', v_quest.posts_reward_claimed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Increment quest progress and claim rewards
CREATE OR REPLACE FUNCTION update_quest_progress(p_type text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := CURRENT_DATE;
  v_quest record;
  v_reward int := 0;
  v_claimed boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Ensure today's row exists
  INSERT INTO user_quests (user_id, quest_date)
  VALUES (v_user_id, v_today)
  ON CONFLICT (user_id, quest_date) DO NOTHING;

  -- Increment the appropriate counter
  IF p_type = 'like' THEN
    UPDATE user_quests SET likes_count = likes_count + 1
    WHERE user_id = v_user_id AND quest_date = v_today;
  ELSIF p_type = 'follow' THEN
    UPDATE user_quests SET follows_count = follows_count + 1
    WHERE user_id = v_user_id AND quest_date = v_today;
  ELSIF p_type = 'post' THEN
    UPDATE user_quests SET posts_count = posts_count + 1
    WHERE user_id = v_user_id AND quest_date = v_today;
  END IF;

  -- Re-fetch
  SELECT * INTO v_quest FROM user_quests
  WHERE user_id = v_user_id AND quest_date = v_today;

  -- Check and claim rewards
  IF p_type = 'like' AND v_quest.likes_count >= 3 AND NOT v_quest.likes_reward_claimed THEN
    UPDATE user_quests SET likes_reward_claimed = true WHERE user_id = v_user_id AND quest_date = v_today;
    UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + 20 WHERE id = v_user_id;
    v_reward := 20; v_claimed := true;
  ELSIF p_type = 'follow' AND v_quest.follows_count >= 2 AND NOT v_quest.follows_reward_claimed THEN
    UPDATE user_quests SET follows_reward_claimed = true WHERE user_id = v_user_id AND quest_date = v_today;
    UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + 20 WHERE id = v_user_id;
    v_reward := 20; v_claimed := true;
  ELSIF p_type = 'post' AND v_quest.posts_count >= 1 AND NOT v_quest.posts_reward_claimed THEN
    UPDATE user_quests SET posts_reward_claimed = true WHERE user_id = v_user_id AND quest_date = v_today;
    UPDATE profiles SET coin_balance = COALESCE(coin_balance, 0) + 35 WHERE id = v_user_id;
    v_reward := 35; v_claimed := true;
  END IF;

  RETURN jsonb_build_object(
    'likes_count', v_quest.likes_count + (CASE WHEN p_type = 'like' THEN 0 ELSE 0 END),
    'follows_count', v_quest.follows_count,
    'posts_count', v_quest.posts_count,
    'reward_claimed', v_claimed,
    'reward_amount', v_reward,
    'new_balance', (SELECT coin_balance FROM profiles WHERE id = v_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Upgrade streak rewards to tiered
-- Modify claim_daily_reward to give tiered rewards based on streak
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

  SELECT last_daily_reward, daily_login_streak
  INTO v_last_reward, v_streak
  FROM profiles WHERE id = v_user_id;

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

    IF v_hours_since <= 48 THEN
      v_streak := COALESCE(v_streak, 0) + 1;
    ELSE
      v_streak := 1;
    END IF;
  ELSE
    v_streak := 1;
  END IF;

  -- Tiered rewards based on streak
  v_reward := 5; -- base
  IF v_streak >= 14 THEN v_reward := 100;
  ELSIF v_streak >= 7 THEN v_reward := 50;
  ELSIF v_streak >= 3 THEN v_reward := 20;
  ELSIF v_streak >= 1 THEN v_reward := 10;
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
