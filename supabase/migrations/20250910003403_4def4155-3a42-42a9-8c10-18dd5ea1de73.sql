-- Create new function specifically for admin user management (includes pending users)
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
 RETURNS TABLE(id uuid, name text, email text, role text, user_position text, user_status text, created_at timestamp with time zone, temporary_password text, has_changed_password boolean, last_login timestamp with time zone)
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
  
  -- Only admins can use this function
  IF requesting_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can view all users';
  END IF;
  
  -- Return all users (both active and pending) for admin management
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at, p.temporary_password, p.has_changed_password, p.last_login
  FROM public.profiles p
  WHERE p.user_status IN ('active', 'pending')
  ORDER BY p.user_status DESC, p.name; -- Show pending first, then active
END;
$function$;