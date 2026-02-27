-- Add icon and color columns to groups table
-- Run this in Supabase SQL Editor

ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS icon  TEXT DEFAULT 'fa-users';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#5cbdb9';
