-- Add 'mention' to the notification_type enum
-- Run this in Supabase SQL Editor if your database was created before this migration
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'mention';
