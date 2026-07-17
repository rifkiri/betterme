
-- Fix mutual recursion between goals and goal_assignments RLS policies
-- by using SECURITY DEFINER helpers that bypass RLS.

CREATE OR REPLACE FUNCTION public.is_goal_owner(_goal_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.goals WHERE id = _goal_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_goal_assignee(_goal_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.goal_assignments WHERE goal_id = _goal_id AND user_id = _user_id)
$$;

-- Replace goal_assignments SELECT policy
DROP POLICY IF EXISTS "goal_assignments_select" ON public.goal_assignments;
CREATE POLICY "goal_assignments_select"
ON public.goal_assignments
FOR SELECT
USING (
  user_id = auth.uid()
  OR assigned_by = auth.uid()
  OR public.is_goal_owner(goal_id, auth.uid())
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['manager','admin'])
);

-- Replace goals SELECT policy
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;
CREATE POLICY "Users can view goals based on visibility"
ON public.goals
FOR SELECT
USING (
  auth.uid() = user_id
  OR private.get_user_role(auth.uid()) = 'admin'
  OR (
    private.get_user_role(auth.uid()) = 'manager'
    AND NOT is_deleted
    AND NOT archived
    AND (visibility = 'all' OR visibility = 'managers')
  )
  OR (
    private.get_user_role(auth.uid()) = 'team-member'
    AND NOT is_deleted
    AND NOT archived
    AND visibility = 'all'
  )
  OR public.is_goal_assignee(id, auth.uid())
);

-- Replace goals UPDATE policies (both reference goal_assignments)
DROP POLICY IF EXISTS "Owners and assigned users can update goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update goals they own or are assigned to" ON public.goals;
CREATE POLICY "Users can update goals they own or are assigned to"
ON public.goals
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_goal_assignee(id, auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_goal_assignee(id, auth.uid())
);
