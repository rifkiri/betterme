-- Migration 1: add intern role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'manager', 'team-member', 'intern'));

CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  user_position text,
  user_status text,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  SELECT p.role INTO requesting_user_role FROM public.profiles p WHERE p.id = auth.uid();

  IF requesting_user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name ASC;
  ELSIF requesting_user_role = 'manager' THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' AND p.role IN ('team-member', 'manager', 'intern')
    ORDER BY p.name ASC;
  ELSE
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' AND p.role IN ('team-member', 'manager', 'intern') AND p.id != auth.uid()
    ORDER BY p.name ASC;
  END IF;
END;
$$;

-- Migration 2: update goals RLS
DROP POLICY IF EXISTS "Visibility-based goal access" ON public.goals;
DROP POLICY IF EXISTS "Users can view goals based on visibility" ON public.goals;
DROP POLICY IF EXISTS "Authenticated users can view active goals" ON public.goals;
DROP POLICY IF EXISTS "Role and Visibility based goal access" ON public.goals;

CREATE POLICY "Role and Visibility based goal access"
ON public.goals FOR SELECT
TO authenticated
USING (
  is_deleted = false
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.goal_assignments
      WHERE goal_assignments.goal_id = goals.id
        AND goal_assignments.user_id = auth.uid()
    )
    OR public.get_user_role(auth.uid()) IN ('admin', 'manager')
    OR (public.get_user_role(auth.uid()) = 'team-member' AND visibility = 'all')
  )
);