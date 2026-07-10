REVOKE EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() TO service_role;