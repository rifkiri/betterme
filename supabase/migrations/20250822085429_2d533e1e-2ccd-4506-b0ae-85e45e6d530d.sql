-- Phase 1: Add missing foreign key constraints to fix PostgREST join detection
ALTER TABLE goal_assignments 
ADD CONSTRAINT goal_assignments_goal_id_fkey 
FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;

ALTER TABLE goal_assignments 
ADD CONSTRAINT goal_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_goal_assignments_goal_id ON goal_assignments(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_user_id ON goal_assignments(user_id);