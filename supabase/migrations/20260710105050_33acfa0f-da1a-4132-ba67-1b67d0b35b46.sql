
-- 1) Break the tasks <-> task_invitations RLS recursion via a SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.user_has_pending_task_invitation(_task_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_invitations
    WHERE task_id = _task_id
      AND invitee_id = _user_id
      AND status = 'pending'
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_pending_task_invitation(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_pending_task_invitation(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can view tasks based on visibility" ON public.tasks;
CREATE POLICY "Users can view tasks based on visibility"
ON public.tasks
FOR SELECT
USING (
  auth.uid() = user_id
  OR get_user_role(auth.uid()) = 'admin'
  OR (get_user_role(auth.uid()) = 'manager' AND NOT is_deleted AND (visibility = 'all' OR visibility = 'managers' OR visibility IS NULL))
  OR (get_user_role(auth.uid()) = 'team-member' AND NOT is_deleted AND (visibility = 'all' OR visibility IS NULL))
  OR (auth.uid())::text = ANY (tagged_users)
  OR public.user_has_pending_task_invitation(id, auth.uid())
);

-- 2) Lock down internal helper functions that should not be callable via the Data API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_notification_preferences() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_weekly_outputs_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_task_pomodoro_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_password_strength(text) FROM PUBLIC, anon, authenticated;
