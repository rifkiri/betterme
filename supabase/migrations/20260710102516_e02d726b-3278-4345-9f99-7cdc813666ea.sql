CREATE TABLE public.task_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  UNIQUE (task_id, invitee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_invitations TO authenticated;
GRANT ALL ON public.task_invitations TO service_role;

ALTER TABLE public.task_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task invitations involving them"
ON public.task_invitations
FOR SELECT
TO authenticated
USING (
  auth.uid() = invitee_id
  OR auth.uid() = invited_by
  OR EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_invitations.task_id
      AND t.user_id = auth.uid()
  )
  OR public.get_user_role(auth.uid()) IN ('manager', 'admin')
);

CREATE POLICY "Task owners and leaders can create task invitations"
ON public.task_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = invited_by
  AND (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_invitations.task_id
        AND t.user_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('manager', 'admin')
  )
);

CREATE POLICY "Invitees can respond to task invitations"
ON public.task_invitations
FOR UPDATE
TO authenticated
USING (auth.uid() = invitee_id)
WITH CHECK (
  auth.uid() = invitee_id
  AND status IN ('accepted', 'declined')
);

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
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_invitations.task_id
      AND t.user_id = auth.uid()
  )
  OR public.get_user_role(auth.uid()) IN ('manager', 'admin')
);

CREATE POLICY "Task owners and leaders can delete task invitations"
ON public.task_invitations
FOR DELETE
TO authenticated
USING (
  auth.uid() = invitee_id
  OR EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_invitations.task_id
      AND t.user_id = auth.uid()
  )
  OR public.get_user_role(auth.uid()) IN ('manager', 'admin')
);

CREATE TRIGGER update_task_invitations_updated_at
BEFORE UPDATE ON public.task_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.accept_task_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record public.task_invitations%ROWTYPE;
BEGIN
  SELECT * INTO invite_record
  FROM public.task_invitations
  WHERE id = p_invitation_id
    AND invitee_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task invitation not found or already handled';
  END IF;

  UPDATE public.task_invitations
  SET status = 'accepted', responded_at = now(), updated_at = now()
  WHERE id = p_invitation_id;

  UPDATE public.tasks
  SET tagged_users = CASE
      WHEN tagged_users IS NULL THEN ARRAY[invite_record.invitee_id::text]
      WHEN NOT (invite_record.invitee_id::text = ANY(tagged_users)) THEN array_append(tagged_users, invite_record.invitee_id::text)
      ELSE tagged_users
    END,
    updated_at = now()
  WHERE id = invite_record.task_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_task_invitation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.decline_task_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.task_invitations
  SET status = 'declined', responded_at = now(), updated_at = now()
  WHERE id = p_invitation_id
    AND invitee_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task invitation not found or already handled';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_task_invitation(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_invitations;