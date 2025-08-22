-- Fix RLS policies for goal_assignments to prevent cross-table reference issues

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view goal assignments for accessible goals" ON public.goal_assignments;

-- Create a more direct policy that allows users to see assignments for goals they can access
CREATE POLICY "Users can view assignments for their accessible goals" 
ON public.goal_assignments 
FOR SELECT 
USING (
  -- Users can see assignments for goals they own
  EXISTS (
    SELECT 1 FROM public.goals g 
    WHERE g.id = goal_assignments.goal_id 
    AND g.user_id = auth.uid() 
    AND NOT g.is_deleted
  )
  OR
  -- Users can see assignments for goals they are assigned to
  goal_assignments.user_id = auth.uid()
  OR
  -- Managers and admins can see all assignments
  get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);

-- Also ensure users can delete their own assignments
DROP POLICY IF EXISTS "Users can delete their own assignments" ON public.goal_assignments;
CREATE POLICY "Users can delete assignments they control" 
ON public.goal_assignments 
FOR DELETE 
USING (
  -- Users can delete their own assignments
  auth.uid() = user_id 
  OR 
  -- Users can delete assignments they made
  auth.uid() = assigned_by
  OR
  -- Managers and admins can delete any assignments
  get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);