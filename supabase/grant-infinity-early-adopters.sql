-- Grant infinity coins to all existing users (early adopters / beta testers)
-- This sets infinityCoins=true in their skin_data JSONB column
-- Run this ONCE to reward current users. New users after this won't have it.

UPDATE profiles
SET skin_data = COALESCE(skin_data, '{}'::jsonb) || '{"infinityCoins": true}'::jsonb
WHERE id IN (SELECT id FROM profiles);
