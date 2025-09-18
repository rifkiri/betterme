-- Update the RLS policy for viewing goals to be clearer and more comprehensive
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;

CREATE POLICY "Users can view goals based on visibility" 
ON public.goals 
FOR SELECT 
USING (
  -- User can always see their own goals
  auth.uid() = user_id
  OR
  -- Admins can see all goals
  get_user_role(auth.uid()) = 'admin'::text
  OR
  -- Managers can see all non-deleted, non-archived goals with 'all' or 'managers' visibility
  (
    get_user_role(auth.uid()) = 'manager'::text
    AND NOT is_deleted
    AND NOT archived
    AND (visibility = 'all'::text OR visibility = 'managers'::text)
  )
  OR
  -- Team members can see all non-deleted, non-archived goals with 'all' visibility
  (
    get_user_role(auth.uid()) = 'team-member'::text
    AND NOT is_deleted
    AND NOT archived
    AND visibility = 'all'::text
  )
  OR
  -- Any user can see goals they're assigned to
  EXISTS (
    SELECT 1 
    FROM goal_assignments 
    WHERE goal_assignments.goal_id = goals.id 
    AND goal_assignments.user_id = auth.uid()
  )
);