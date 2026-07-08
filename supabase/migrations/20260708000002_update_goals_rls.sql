-- Update Goals RLS for strict role-based access

-- Drop previous overlapping policies
DROP POLICY IF EXISTS "Visibility-based goal access" ON public.goals;
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;
DROP POLICY IF EXISTS "Authenticated users can view active goals" ON public.goals;

-- Unified Role-Based and Visibility-Based SELECT Policy
CREATE POLICY "Role and Visibility based goal access"
ON public.goals FOR SELECT
TO authenticated
USING (
  is_deleted = false
  AND (
    -- 1. Owner always sees
    user_id = auth.uid()
    OR
    -- 2. Collaborators always see
    EXISTS (
      SELECT 1 FROM public.goal_assignments
      WHERE goal_assignments.goal_id = goals.id
        AND goal_assignments.user_id = auth.uid()
    )
    OR
    -- 3. Admins and Managers see EVERYTHING (Public and Private)
    get_user_role(auth.uid()) IN ('admin', 'manager')
    OR
    -- 4. Team-Members see ONLY 'all' (Public) goals
    -- (Interns fall through this check and only see via Owner or Collaborator rules above)
    (
      get_user_role(auth.uid()) = 'team-member'
      AND visibility = 'all'
    )
  )
);
