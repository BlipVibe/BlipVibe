-- Add skin_data column to groups table for shared group skin settings
-- Run this in Supabase SQL Editor

ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS skin_data JSONB DEFAULT '{}';
