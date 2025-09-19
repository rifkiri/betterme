-- Drop the overly permissive policy that allows managers to see ALL goals
DROP POLICY IF EXISTS "Managers and admins can view all goals" ON public.goals;

-- Ensure the visibility-based policy is comprehensive
-- This policy already exists and handles visibility correctly:
-- "Users can view goals based on visibility"
-- It allows:
-- 1. Users to see their own goals (regardless of visibility)
-- 2. Admins to see all goals
-- 3. Managers to see non-deleted, non-archived goals with visibility 'all' or 'managers'
-- 4. Team members to see non-deleted, non-archived goals with visibility 'all'
-- 5. Users assigned to a goal to see it

-- Let's also ensure private visibility is properly enforced
-- The existing policy should work, but let's make it more explicit
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;

CREATE POLICY "Users can view goals based on visibility" 
ON public.goals 
FOR SELECT 
USING (
  -- Users can always see their own goals
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all goals
  (get_user_role(auth.uid()) = 'admin'::text) 
  OR 
  -- Managers can see non-deleted, non-archived goals with appropriate visibility
  (
    (get_user_role(auth.uid()) = 'manager'::text) 
    AND (NOT is_deleted) 
    AND (NOT archived) 
    AND (
      (visibility = 'all'::text) 
      OR (visibility = 'managers'::text)
    )
    -- Explicitly exclude private goals
    AND (visibility != 'private'::text OR visibility IS NULL)
  ) 
  OR 
  -- Team members can see non-deleted, non-archived goals with 'all' visibility
  (
    (get_user_role(auth.uid()) = 'team-member'::text) 
    AND (NOT is_deleted) 
    AND (NOT archived) 
    AND (visibility = 'all'::text)
  ) 
  OR 
  -- Users assigned to a goal can see it
  (
    EXISTS (
      SELECT 1 
      FROM goal_assignments 
      WHERE goal_assignments.goal_id = goals.id 
      AND goal_assignments.user_id = auth.uid()
    )
  )
);