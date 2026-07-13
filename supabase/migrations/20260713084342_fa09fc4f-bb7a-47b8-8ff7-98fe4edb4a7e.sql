-- Add the missing database relationship used when loading goal notification details.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'goal_notifications_goal_id_fkey'
      AND conrelid = 'public.goal_notifications'::regclass
  ) THEN
    ALTER TABLE public.goal_notifications
      ADD CONSTRAINT goal_notifications_goal_id_fkey
      FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Keep elevated helper logic out of the exposed public API schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.user_has_pending_task_invitation(_task_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_invitations
    WHERE task_id = _task_id
      AND invitee_id = _user_id
      AND status = 'pending'
  );
$$;

-- Update all existing RLS policies to use the private helpers, keeping user access intact.
DO $$
DECLARE
  policy_record record;
  new_qual text;
  new_with_check text;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        coalesce(qual, '') LIKE '%get_user_role(%'
        OR coalesce(qual, '') LIKE '%is_admin(%'
        OR coalesce(qual, '') LIKE '%user_has_pending_task_invitation(%'
        OR coalesce(with_check, '') LIKE '%get_user_role(%'
        OR coalesce(with_check, '') LIKE '%is_admin(%'
        OR coalesce(with_check, '') LIKE '%user_has_pending_task_invitation(%'
      )
  LOOP
    new_qual := policy_record.qual;
    new_with_check := policy_record.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'get_user_role(', 'private.get_user_role(');
      new_qual := replace(new_qual, 'is_admin(', 'private.is_admin(');
      new_qual := replace(new_qual, 'user_has_pending_task_invitation(', 'private.user_has_pending_task_invitation(');
    END IF;

    IF new_with_check IS NOT NULL THEN
      new_with_check := replace(new_with_check, 'get_user_role(', 'private.get_user_role(');
      new_with_check := replace(new_with_check, 'is_admin(', 'private.is_admin(');
      new_with_check := replace(new_with_check, 'user_has_pending_task_invitation(', 'private.user_has_pending_task_invitation(');
    END IF;

    IF new_qual IS NOT NULL AND new_with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
        policy_record.policyname,
        policy_record.schemaname,
        policy_record.tablename,
        new_qual,
        new_with_check
      );
    ELSIF new_qual IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        policy_record.policyname,
        policy_record.schemaname,
        policy_record.tablename,
        new_qual
      );
    ELSIF new_with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        policy_record.policyname,
        policy_record.schemaname,
        policy_record.tablename,
        new_with_check
      );
    END IF;
  END LOOP;
END $$;

-- Private implementations for app RPCs that need elevated table access.
CREATE OR REPLACE FUNCTION private.create_goal_assignment(
  p_goal_id uuid,
  p_user_id uuid,
  p_role text,
  p_assigned_by uuid,
  p_self_assigned boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    p_assigned_by = auth.uid()
    OR p_user_id = auth.uid()
    OR private.get_user_role(auth.uid()) IN ('manager', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.goal_assignments (
    goal_id,
    user_id,
    role,
    assigned_by,
    self_assigned,
    acknowledged
  ) VALUES (
    p_goal_id,
    p_user_id,
    p_role,
    p_assigned_by,
    p_self_assigned,
    false
  )
  ON CONFLICT (goal_id, user_id)
  DO UPDATE SET
    role = p_role,
    assigned_by = p_assigned_by,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION private.create_goal_notification(
  p_user_id uuid,
  p_goal_id uuid,
  p_notification_type text,
  p_role text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    p_user_id = auth.uid()
    OR private.get_user_role(auth.uid()) IN ('manager', 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.goals g
      WHERE g.id = p_goal_id
        AND g.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.goal_notifications (
    user_id,
    goal_id,
    notification_type,
    role,
    acknowledged
  ) VALUES (
    p_user_id,
    p_goal_id,
    p_notification_type,
    p_role,
    false
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.get_filtered_users_for_role()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  requesting_user_role := private.get_user_role(auth.uid());

  IF requesting_user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position", p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
  ELSE
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position", p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
      AND p.role IN ('team-member', 'manager', 'intern')
    ORDER BY p.name;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.get_all_users_for_admin()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone, temporary_password text, has_changed_password boolean, last_login timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF private.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can view all users';
  END IF;

  RETURN QUERY
  SELECT p.id, p.name, p.email, p.role::text, p."position", p.user_status::text, p.created_at, p.temporary_password, p.has_changed_password, p.last_login
  FROM public.profiles p
  WHERE p.user_status IN ('active', 'pending')
  ORDER BY p.user_status DESC, p.name;
END;
$$;

CREATE OR REPLACE FUNCTION private.get_all_active_users_for_dashboard()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  requesting_user_role := private.get_user_role(auth.uid());

  IF requesting_user_role IS NULL OR requesting_user_role = 'intern' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.name, p.email, p.role::text, p."position", p.user_status::text, p.created_at
  FROM public.profiles p
  WHERE p.user_status = 'active'
  ORDER BY p.name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION private.get_habits_for_date(user_id_param uuid, target_date date)
RETURNS TABLE(id uuid, name text, description text, category text, streak integer, archived boolean, is_deleted boolean, created_at timestamp with time zone, completed boolean, linked_goal_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF user_id_param <> auth.uid() AND private.get_user_role(auth.uid()) NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    h.id,
    h.name,
    h.description,
    h.category::text,
    h.streak,
    h.archived,
    h.is_deleted,
    h.created_at,
    COALESCE(hc.completed_date IS NOT NULL, false) AS completed,
    h.linked_goal_id
  FROM public.habits h
  LEFT JOIN public.habit_completions hc
    ON h.id = hc.habit_id
   AND hc.completed_date = target_date
  WHERE h.user_id = user_id_param
  ORDER BY h.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION private.toggle_habit_completion(habit_id_param uuid, user_id_param uuid, target_date date, is_completed boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF user_id_param <> auth.uid() AND private.get_user_role(auth.uid()) NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF is_completed THEN
    INSERT INTO public.habit_completions (habit_id, user_id, completed_date)
    VALUES (habit_id_param, user_id_param, target_date)
    ON CONFLICT (habit_id, completed_date) DO NOTHING;

    UPDATE public.habits
    SET last_completed_date = target_date,
        streak = CASE
          WHEN last_completed_date = target_date - INTERVAL '1 day' THEN streak + 1
          WHEN last_completed_date IS NULL OR last_completed_date < target_date - INTERVAL '1 day' THEN 1
          ELSE streak
        END
    WHERE id = habit_id_param
      AND user_id = user_id_param;
  ELSE
    DELETE FROM public.habit_completions
    WHERE habit_id = habit_id_param
      AND completed_date = target_date
      AND user_id = user_id_param;

    UPDATE public.habits
    SET streak = 0,
        last_completed_date = NULL
    WHERE id = habit_id_param
      AND user_id = user_id_param;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.accept_task_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION private.decline_task_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Public RPC wrappers remain callable, but no exposed public function runs as SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.create_goal_assignment(p_goal_id uuid, p_user_id uuid, p_role text, p_assigned_by uuid, p_self_assigned boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $$
BEGIN
  PERFORM private.create_goal_assignment(p_goal_id, p_user_id, p_role, p_assigned_by, p_self_assigned);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_goal_notification(p_user_id uuid, p_goal_id uuid, p_notification_type text, p_role text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $$
BEGIN
  PERFORM private.create_goal_notification(p_user_id, p_goal_id, p_notification_type, p_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.get_filtered_users_for_role();
$$;

CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone, temporary_password text, has_changed_password boolean, last_login timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.get_all_users_for_admin();
$$;

CREATE OR REPLACE FUNCTION public.get_all_active_users_for_dashboard()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.get_all_active_users_for_dashboard();
$$;

CREATE OR REPLACE FUNCTION public.get_habits_for_date(user_id_param uuid, target_date date)
RETURNS TABLE(id uuid, name text, description text, category text, streak integer, archived boolean, is_deleted boolean, created_at timestamp with time zone, completed boolean, linked_goal_id uuid)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.get_habits_for_date(user_id_param, target_date);
$$;

CREATE OR REPLACE FUNCTION public.toggle_habit_completion(habit_id_param uuid, user_id_param uuid, target_date date, is_completed boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $$
BEGIN
  PERFORM private.toggle_habit_completion(habit_id_param, user_id_param, target_date, is_completed);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_task_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $$
BEGIN
  PERFORM private.accept_task_invitation(p_invitation_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_task_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $$
BEGIN
  PERFORM private.decline_task_invitation(p_invitation_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF LENGTH(password) < 8 THEN
    RETURN FALSE;
  END IF;

  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;

  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;

  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- Lock down exposed public functions, then grant only safe public RPC wrappers.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION public.create_goal_assignment(uuid, uuid, text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_goal_notification(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_users_for_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_habits_for_date(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_habit_completion(uuid, uuid, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_task_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_task_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO authenticated;