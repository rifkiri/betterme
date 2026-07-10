CREATE OR REPLACE FUNCTION public.get_all_active_users_for_dashboard()
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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requesting_user_role text;
BEGIN
  SELECT p.role
    INTO requesting_user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF requesting_user_role IS NULL OR requesting_user_role = 'intern' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    p.role::text,
    p."position" AS user_position,
    p.user_status::text,
    p.created_at
  FROM public.profiles p
  WHERE p.user_status = 'active'
  ORDER BY p.name ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_all_active_users_for_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() TO service_role;