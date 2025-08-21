-- Add single linked_goal_id column to weekly_outputs table to match task->output architecture
ALTER TABLE weekly_outputs 
ADD COLUMN linked_goal_id UUID NULL;

-- Migrate existing array data to single column (take first goal if multiple exist)
UPDATE weekly_outputs 
SET linked_goal_id = (
  CASE 
    WHEN linked_goal_ids IS NOT NULL AND array_length(linked_goal_ids, 1) > 0 
    THEN linked_goal_ids[1]::UUID
    ELSE NULL
  END
)
WHERE linked_goal_ids IS NOT NULL;