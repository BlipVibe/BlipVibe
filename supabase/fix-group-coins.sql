-- BlipVibe — Group Coins: server-side atomic increment
-- Run this in Supabase SQL Editor

-- RPC to add/subtract coins from a group's balance
-- Any authenticated group member can earn coins for the group
CREATE OR REPLACE FUNCTION public.add_group_coins(p_group_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Must be a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM groups
    WHERE id = p_group_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  -- Atomically update coin_balance (floor at 0)
  UPDATE groups
  SET coin_balance = GREATEST(0, coin_balance + p_amount),
      updated_at = now()
  WHERE id = p_group_id
  RETURNING coin_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  RETURN v_new_balance;
END;
$$;
