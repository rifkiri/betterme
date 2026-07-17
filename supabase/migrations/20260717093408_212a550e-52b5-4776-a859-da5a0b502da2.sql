CREATE OR REPLACE FUNCTION public.create_goal_assignment(
  p_goal_id uuid,
  p_user_id uuid,
  p_role text,
  p_assigned_by uuid,
  p_self_assigned boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.goal_assignments (
    goal_id,
    user_id,
    role,
    assigned_by,
    self_assigned,
    acknowledged
  )
  VALUES (
    p_goal_id,
    p_user_id,
    p_role,
    p_assigned_by,
    p_self_assigned,
    CASE WHEN p_self_assigned THEN true ELSE false END
  )
  ON CONFLICT (goal_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    assigned_by = EXCLUDED.assigned_by,
    self_assigned = EXCLUDED.self_assigned,
    acknowledged = CASE WHEN EXCLUDED.self_assigned THEN true ELSE public.goal_assignments.acknowledged END;
END;
$$;