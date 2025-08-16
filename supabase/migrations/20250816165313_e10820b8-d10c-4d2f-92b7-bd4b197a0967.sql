-- Add progress column to goals table to properly store progress values
-- This replaces the removed current_value column with a proper progress field

ALTER TABLE public.goals 
ADD COLUMN progress INTEGER DEFAULT 0 NOT NULL;

-- Add constraint to ensure progress is between 0 and 100
ALTER TABLE public.goals 
ADD CONSTRAINT goals_progress_check CHECK (progress >= 0 AND progress <= 100);

-- Update any existing goals to have 0% progress
UPDATE public.goals 
SET progress = 0 
WHERE progress IS NULL;