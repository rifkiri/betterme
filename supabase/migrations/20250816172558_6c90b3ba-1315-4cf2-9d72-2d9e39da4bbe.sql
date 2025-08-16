-- Drop the existing restrictive UPDATE policy for goals
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;

-- Create a new UPDATE policy that allows both owners and assigned users
CREATE POLICY "Users can update their own goals or assigned goals" 
ON public.goals 
FOR UPDATE 
USING (
  -- Allow if user owns the goal
  (auth.uid() = user_id) OR 
  -- Allow if user is assigned to the goal
  EXISTS (
    SELECT 1 FROM goal_assignments 
    WHERE goal_id = goals.id 
    AND user_id = auth.uid()
  )
);