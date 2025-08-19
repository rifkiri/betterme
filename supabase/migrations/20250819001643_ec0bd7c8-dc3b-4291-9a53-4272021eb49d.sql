-- Add linked_goal_ids column to weekly_outputs table
ALTER TABLE weekly_outputs 
ADD COLUMN linked_goal_ids TEXT[] DEFAULT '{}';

-- Add linked_output_ids column to goals table  
ALTER TABLE goals 
ADD COLUMN linked_output_ids TEXT[] DEFAULT '{}';