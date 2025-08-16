-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION public.get_filtered_users_for_role()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  user_position text,
  user_status text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Get the requesting user's role
  SELECT p.role INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Return users based on requesting user's role
  IF requesting_user_role = 'admin' THEN
    -- Admins can see all users
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active'
    ORDER BY p.name;
    
  ELSIF requesting_user_role = 'manager' THEN
    -- Managers can see team members and other managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
    
  ELSE
    -- Team members can only see other team members and managers, but NOT admins
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.role::text, p."position" as user_position, p.user_status::text, p.created_at
    FROM public.profiles p
    WHERE p.user_status = 'active' 
      AND p.role IN ('team-member', 'manager')
      AND p.id != auth.uid() -- Exclude self
    ORDER BY p.name;
  END IF;
END;
$$;