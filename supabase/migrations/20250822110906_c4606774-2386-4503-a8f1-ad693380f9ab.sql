-- Phase 1: Restore linked_goal_id column to weekly_outputs table
-- Add the linked_goal_id column that was removed during the incomplete migration
ALTER TABLE public.weekly_outputs 
ADD COLUMN IF NOT EXISTS linked_goal_id UUID REFERENCES public.goals(id);

-- Create index for better performance on linked goal queries
CREATE INDEX IF NOT EXISTS idx_weekly_outputs_linked_goal_id 
ON public.weekly_outputs(linked_goal_id);

-- Migrate any existing linkages from item_linkages table back to the column
-- This handles the case where some data might exist in item_linkages
UPDATE public.weekly_outputs
SET linked_goal_id = CAST(il.target_id AS UUID)
FROM public.item_linkages il
WHERE il.source_type = 'weekly_output' 
  AND il.target_type = 'goal'
  AND il.source_id = weekly_outputs.id::text
  AND weekly_outputs.linked_goal_id IS NULL;

-- Clean up the migrated linkages from item_linkages table for weekly_output -> goal
DELETE FROM public.item_linkages
WHERE (source_type = 'weekly_output' AND target_type = 'goal')
   OR (source_type = 'goal' AND target_type = 'weekly_output');

-- Update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekly_outputs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_weekly_outputs_updated_at_trigger ON public.weekly_outputs;
CREATE TRIGGER update_weekly_outputs_updated_at_trigger
  BEFORE UPDATE ON public.weekly_outputs
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_outputs_updated_at();