
-- Grant Data-API access to all public tables (previous migration was not executed)
DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN SELECT c.relname AS t FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.t);
  END LOOP;
END $$;

-- Fix get_filtered_users_for_role to include the current user (was excluding self)
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE requesting_user_role text;
BEGIN
  SELECT p.role INTO requesting_user_role FROM public.profiles p WHERE p.id = auth.uid();
  IF requesting_user_role = 'admin' THEN
    RETURN QUERY SELECT p.id, p.name, p.email, p.role::text, p."position", p.user_status::text, p.created_at
      FROM public.profiles p WHERE p.user_status = 'active' ORDER BY p.name;
  ELSE
    RETURN QUERY SELECT p.id, p.name, p.email, p.role::text, p."position", p.user_status::text, p.created_at
      FROM public.profiles p WHERE p.user_status = 'active' AND p.role IN ('team-member','manager','intern') ORDER BY p.name;
  END IF;
END;
$$;

-- Allow all authenticated users to see goal_assignments (so coach/owner names render)
DROP POLICY IF EXISTS "Users can view assignments they're involved in" ON public.goal_assignments;
CREATE POLICY "Users can view all goal assignments" ON public.goal_assignments FOR SELECT TO authenticated USING (true);

-- Expand weekly_outputs SELECT to include goal collaborators
DROP POLICY IF EXISTS "Users can view weekly outputs based on visibility" ON public.weekly_outputs;
CREATE POLICY "Users can view weekly outputs based on visibility" ON public.weekly_outputs FOR SELECT TO authenticated USING (
  auth.uid() = user_id
  OR get_user_role(auth.uid()) = 'admin'
  OR ((get_user_role(auth.uid()) = 'manager') AND (NOT is_deleted) AND (visibility IN ('all','managers') OR visibility IS NULL))
  OR ((get_user_role(auth.uid()) IN ('team-member','intern')) AND (NOT is_deleted) AND (visibility = 'all' OR visibility IS NULL))
  OR EXISTS (SELECT 1 FROM public.goal_assignments ga WHERE ga.goal_id = weekly_outputs.linked_goal_id AND ga.user_id = auth.uid())
);
