-- Add DELETE policy for users to delete their own goal assignments
CREATE POLICY "Users can delete their own goal assignments"
ON public.goal_assignments
FOR DELETE
USING (auth.uid() = user_id);

-- Clean up duplicate goal assignments (keep only the most recent one for each user/goal combination)
DELETE FROM goal_assignments a1
USING goal_assignments a2
WHERE a1.id < a2.id 
  AND a1.user_id = a2.user_id 
  AND a1.goal_id = a2.goal_id;

-- Add unique constraint to prevent duplicate assignments
ALTER TABLE goal_assignments 
ADD CONSTRAINT unique_user_goal_assignment 
UNIQUE (user_id, goal_id);