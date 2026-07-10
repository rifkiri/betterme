DROP POLICY IF EXISTS "Users can view tasks based on visibility" ON public.tasks;

CREATE POLICY "Users can view tasks based on visibility"
ON public.tasks
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (get_user_role(auth.uid()) = 'admin'::text)
  OR (
    (get_user_role(auth.uid()) = 'manager'::text)
    AND (NOT is_deleted)
    AND ((visibility = 'all'::text) OR (visibility = 'managers'::text) OR (visibility IS NULL))
  )
  OR (
    (get_user_role(auth.uid()) = 'team-member'::text)
    AND (NOT is_deleted)
    AND ((visibility = 'all'::text) OR (visibility IS NULL))
  )
  OR ((auth.uid())::text = ANY (tagged_users))
  OR EXISTS (
    SELECT 1
    FROM public.task_invitations ti
    WHERE ti.task_id = tasks.id
      AND ti.invitee_id = auth.uid()
      AND ti.status = 'pending'
  )
);