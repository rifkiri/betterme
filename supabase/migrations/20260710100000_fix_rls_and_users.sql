-- Fix get_filtered_users_for_role to include the current user
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE requesting_user_role text;
BEGIN
  SELECT p.role INTO requesting_user_role FROM public.profiles p WHERE p.id = auth.uid();
  IF requesting_user_role = 'admin' THEN
    RETURN QUERY SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at FROM public.profiles p WHERE p.user_status = 'active' ORDER BY p.name;
  ELSE
    RETURN QUERY SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at FROM public.profiles p WHERE p.user_status = 'active' AND p.role IN ('team-member', 'manager') ORDER BY p.name;
  END IF;
END;
$$;

-- Fix tasks RLS to allow tagged users to see them
DROP POLICY IF EXISTS "Users can view tasks based on visibility" ON public.tasks;
CREATE POLICY "Users can view tasks based on visibility" ON public.tasks FOR SELECT TO authenticated USING (
  auth.uid() = user_id 
  OR auth.uid() = ANY(tagged_users)
  OR get_user_role(auth.uid()) IN ('admin', 'manager') 
  OR visibility = 'all'
);

-- Fix outputs RLS to allow goal collaborators to see them
DROP POLICY IF EXISTS "Users can view outputs based on visibility" ON public.weekly_outputs;
CREATE POLICY "Users can view outputs based on visibility" ON public.weekly_outputs FOR SELECT TO authenticated USING (
  auth.uid() = user_id 
  OR get_user_role(auth.uid()) IN ('admin', 'manager') 
  OR visibility = 'all'
  OR EXISTS (
    SELECT 1 FROM public.goal_assignments ga 
    WHERE ga.goal_id = weekly_outputs.linked_goal_id 
    AND ga.user_id = auth.uid()
  )
);

-- Fix goal_assignments RLS so users can see who else is assigned (like coaches)
DROP POLICY IF EXISTS "Users can view their assignments" ON public.goal_assignments;
CREATE POLICY "Users can view all goal assignments" ON public.goal_assignments FOR SELECT TO authenticated USING (true);
