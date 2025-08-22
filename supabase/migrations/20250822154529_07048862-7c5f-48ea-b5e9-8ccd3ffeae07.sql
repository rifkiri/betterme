-- Remove the linked_goal_ids array column to standardize on single goal linking
ALTER TABLE public.weekly_outputs DROP COLUMN IF EXISTS linked_goal_ids;

-- Add index on linked_goal_id for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_outputs_linked_goal_id ON public.weekly_outputs(linked_goal_id);