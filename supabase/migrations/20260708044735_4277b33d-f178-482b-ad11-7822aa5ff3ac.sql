-- Replace tasks RLS with role-aware rules
DROP POLICY IF EXISTS "Users can view tasks based on visibility" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Role-aware task visibility" ON public.tasks;
DROP POLICY IF EXISTS "Owners can manage their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and managers can create tasks for anyone" ON public.tasks;
DROP POLICY IF EXISTS "Admins and managers can update any task" ON public.tasks;

-- SELECT: role + visibility + collaborator based
CREATE POLICY "Role-aware task visibility"
ON public.tasks FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.uid() = ANY(COALESCE(tagged_users, ARRAY[]::uuid[]))
  OR public.get_user_role(auth.uid()) = 'admin'
  OR (
    public.get_user_role(auth.uid()) = 'manager'
    AND (
      COALESCE(visibility, 'all') = 'all'
      OR public.get_user_role(user_id) <> 'admin'
    )
  )
  OR (
    public.get_user_role(auth.uid()) IN ('team-member', 'intern')
    AND COALESCE(visibility, 'all') = 'all'
  )
);

-- Owners: full control of their own tasks
CREATE POLICY "Owners can manage their tasks"
ON public.tasks FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin/manager: create tasks for any user (delegation)
CREATE POLICY "Admins and managers can create tasks for anyone"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Admin/manager: update any task (reassign, mark, etc.)
CREATE POLICY "Admins and managers can update any task"
ON public.tasks FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));