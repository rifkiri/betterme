-- Remove unused target_value and current_value columns from goals table
-- These fields are no longer needed since we're using a simplified progress system

ALTER TABLE public.goals 
DROP COLUMN IF EXISTS target_value,
DROP COLUMN IF EXISTS current_value;