-- Update get_filtered_users_for_role function to include the requesting user
-- This allows goal creators to assign themselves to roles in their own goals
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
 RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all users (including themselves)
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team members and other managers, but NOT admins
    -- Include themselves so they can assign themselves to goals
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.name;
    
  ELSE
    -- Team members can see other team members and managers, but NOT admins
    -- Include themselves so they can assign themselves to goals
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
    ORDER BY p.name;
  END IF;
END;
$function$