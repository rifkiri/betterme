
-- 1. Add 'intern' to user_role enum so profiles with role='intern' don't break the user list
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'intern';

-- 2. Lock down all SECURITY DEFINER (and other) functions in public from anon / PUBLIC
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- 3. Re-grant EXECUTE to authenticated ONLY for functions the app actually needs
-- RPCs called from client
GRANT EXECUTE ON FUNCTION public.get_filtered_users_for_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_habits_for_date(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_habit_completion(uuid, uuid, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_task_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_task_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_goal_assignment(uuid, uuid, text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_goal_notification(uuid, uuid, text, text) TO authenticated;

-- Helpers referenced inside RLS policies — must be executable by the role
-- that evaluates the policy (authenticated users). SECURITY DEFINER inside
-- keeps the internal lookups safe.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_pending_task_invitation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO authenticated;

-- service_role keeps full access for edge functions / admin utilities
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
