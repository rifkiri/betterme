-- Drop the item_linkages table
DROP TABLE IF EXISTS public.item_linkages;

-- Drop the related database functions
DROP FUNCTION IF EXISTS public.get_item_linkages(text, text, uuid);
DROP FUNCTION IF EXISTS public.cleanup_stale_linkages();
DROP FUNCTION IF EXISTS public.link_output_to_goal(text, text, uuid);
DROP FUNCTION IF EXISTS public.unlink_output_from_goal(text, text, uuid);

-- Re-add direct foreign key columns that were removed
ALTER TABLE public.weekly_outputs 
ADD COLUMN IF NOT EXISTS linked_goal_ids uuid[];

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_weekly_outputs_linked_goal_ids ON public.weekly_outputs USING GIN(linked_goal_ids);

-- Add index for habits linked_goal_id if not exists
CREATE INDEX IF NOT EXISTS idx_habits_linked_goal_id ON public.habits(linked_goal_id);

-- Add index for tasks weekly_output_id if not exists  
CREATE INDEX IF NOT EXISTS idx_tasks_weekly_output_id ON public.tasks(weekly_output_id);