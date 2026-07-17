
-- C1: Block role self-escalation on profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- C2: Scope goal_assignments SELECT
DROP POLICY IF EXISTS "Users can view all goal assignments"   ON public.goal_assignments;
DROP POLICY IF EXISTS "Users can view their assignments"      ON public.goal_assignments;
DROP POLICY IF EXISTS "Users can view assignments they're involved in" ON public.goal_assignments;
DROP POLICY IF EXISTS "Managers can view all goal assignments" ON public.goal_assignments;
DROP POLICY IF EXISTS "goal_assignments_select" ON public.goal_assignments;

CREATE POLICY "goal_assignments_select"
  ON public.goal_assignments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_assignments.goal_id
        AND g.user_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('manager', 'admin')
  );

-- C3: Tighten task_invitations UPDATE for owners
DROP POLICY IF EXISTS "Task owners and leaders can manage task invitations"
  ON public.task_invitations;

CREATE POLICY "Task owners and leaders can manage task invitations"
  ON public.task_invitations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_invitations.task_id
        AND t.user_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('manager', 'admin')
  )
  WITH CHECK (
    task_id = task_invitations.task_id
    AND invitee_id = task_invitations.invitee_id
    AND invited_by = task_invitations.invited_by
    AND (
      EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_invitations.task_id
          AND t.user_id = auth.uid()
      )
      OR public.get_user_role(auth.uid()) IN ('manager', 'admin')
    )
  );
