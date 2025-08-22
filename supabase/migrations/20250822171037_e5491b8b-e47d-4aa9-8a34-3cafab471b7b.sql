-- Fix all RLS policies for goal_assignments to resolve database access issues

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view relevant goal assignments" ON public.goal_assignments;
DROP POLICY IF EXISTS "Authenticated users can create goal assignments" ON public.goal_assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON public.goal_assignments;
DROP POLICY IF EXISTS "Users can delete assignments they control" ON public.goal_assignments;
DROP POLICY IF EXISTS "Managers can manage all assignments" ON public.goal_assignments;
DROP POLICY IF EXISTS "Managers can view all assignments" ON public.goal_assignments;

-- Create comprehensive RLS policies for goal_assignments
CREATE POLICY "Enable all operations for managers and admins" 
ON public.goal_assignments 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin']))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin']));

CREATE POLICY "Users can view assignments they're involved in" 
ON public.goal_assignments 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR assigned_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);

CREATE POLICY "Users can create goal assignments" 
ON public.goal_assignments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    assigned_by = auth.uid() 
    OR user_id = auth.uid()
    OR get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
  )
);

CREATE POLICY "Users can update their own assignments" 
ON public.goal_assignments 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR assigned_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
)
WITH CHECK (
  user_id = auth.uid() 
  OR assigned_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);

CREATE POLICY "Users can delete assignments they control" 
ON public.goal_assignments 
FOR DELETE 
USING (
  user_id = auth.uid() 
  OR assigned_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);