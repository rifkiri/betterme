
-- 1) Lock down all SECURITY DEFINER functions: revoke from PUBLIC/anon/authenticated,
--    then grant back only the RPC helpers the app calls (authenticated only).

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name, p.proname AS fn_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   fn.schema_name, fn.fn_name, fn.args);
  END LOOP;
END$$;

-- Grant EXECUTE back only for RPCs invoked from the client (authenticated only).
GRANT EXECUTE ON FUNCTION public.accept_task_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_task_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_users_for_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_habits_for_date(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_habit_completion(uuid, uuid, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_goal_assignment(uuid, uuid, text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_goal_notification(uuid, uuid, text, text) TO authenticated;

-- service_role always keeps full access (default via PUBLIC-less path); grant explicitly for edge functions.
GRANT EXECUTE ON FUNCTION public.accept_task_invitation(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.decline_task_invitation(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_filtered_users_for_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_active_users_for_dashboard() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_habits_for_date(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_habit_completion(uuid, uuid, date, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_goal_assignment(uuid, uuid, text, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_goal_notification(uuid, uuid, text, text) TO service_role;

-- 2) Hide all public tables from anonymous visitors in the GraphQL/PostgREST schema.
--    The app is authenticated-only; revoke SELECT from anon on every base table in public.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE SELECT ON TABLE %I.%I FROM anon', t.schemaname, t.tablename);
  END LOOP;
END$$;
