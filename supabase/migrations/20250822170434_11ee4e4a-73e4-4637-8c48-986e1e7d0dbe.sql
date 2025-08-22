-- Update RLS policy to allow managers to see all assignments without complex joins
DROP POLICY IF EXISTS "Users can view assignments for their accessible goals" ON public.goal_assignments;

CREATE POLICY "Users can view relevant goal assignments" 
ON public.goal_assignments 
FOR SELECT 
USING (
  -- Managers and admins can see all assignments (simple check)
  get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
  OR
  -- Users can see their own assignments
  goal_assignments.user_id = auth.uid()
  OR
  -- Users can see assignments for goals they created/assigned
  goal_assignments.assigned_by = auth.uid()
);