-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;

-- Create a new policy that allows both owners and assigned users to update goals
CREATE POLICY "Users can update goals they own or are assigned to" ON public.goals
FOR UPDATE USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM goal_assignments 
    WHERE goal_assignments.goal_id = goals.id 
    AND goal_assignments.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM goal_assignments 
    WHERE goal_assignments.goal_id = goals.id 
    AND goal_assignments.user_id = auth.uid()
  )
);